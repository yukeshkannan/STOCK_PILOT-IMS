/**
 * Idempotency Middleware for StockPilot IMS
 * Prevents duplicate execution of mutating HTTP requests (POST, PUT, PATCH).
 * 
 * Flow:
 * 1. Checks for 'x-idempotency-key' or 'Idempotency-Key' in request headers.
 * 2. If key is found:
 *    - If status === 'PROCESSING': Return 409 Conflict (Concurrent in-flight duplicate).
 *    - If status === 'COMPLETED': Replay cached response with 'X-Idempotent-Replayed: true'.
 *    - If new: Intercept res.send / res.json, cache response upon completion, and set status to 'COMPLETED'.
 * 3. In-memory cache with configurable TTL (default 15 minutes) and automatic cleanup.
 */

class MemoryIdempotencyStore {
  constructor(defaultTtlMs = 15 * 60 * 1000) {
    this.store = new Map();
    this.defaultTtlMs = defaultTtlMs;

    // Periodic garbage collection every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000).unref();
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry;
  }

  setProcessing(key, ttlMs = this.defaultTtlMs) {
    this.store.set(key, {
      status: 'PROCESSING',
      createdAt: Date.now(),
      expiresAt: Date.now() + ttlMs
    });
  }

  setCompleted(key, { statusCode, headers, body }, ttlMs = this.defaultTtlMs) {
    this.store.set(key, {
      status: 'COMPLETED',
      statusCode,
      headers: {
        'content-type': headers['content-type'] || 'application/json'
      },
      body,
      createdAt: Date.now(),
      expiresAt: Date.now() + ttlMs
    });
  }

  delete(key) {
    this.store.delete(key);
  }

  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }
}

const defaultStore = new MemoryIdempotencyStore();

/**
 * Express middleware factory for Idempotency
 * @param {Object} options
 * @param {number} [options.ttlMs=900000] - Time to live in milliseconds (15 minutes default)
 * @param {boolean} [options.required=false] - If true, throws 400 when key is missing
 */
function idempotency(options = {}) {
  const ttlMs = options.ttlMs || 15 * 60 * 1000;
  const isRequired = options.required || false;
  const store = options.store || defaultStore;

  return (req, res, next) => {
    // Only apply to mutating HTTP methods
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      return next();
    }

    const key = req.headers['x-idempotency-key'] || req.headers['idempotency-key'];

    if (!key) {
      if (isRequired) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'IDEMPOTENCY_KEY_REQUIRED',
            message: 'An X-Idempotency-Key header is required for this operation.'
          }
        });
      }
      return next();
    }

    // Partition key by tenant if available to avoid cross-tenant collision
    const tenantId = req.headers['x-tenant-id'] || req.user?.tenantId || 'global';
    const storeKey = `idemp:${tenantId}:${req.baseUrl || ''}${req.path}:${key}`;

    const existing = store.get(storeKey);

    if (existing) {
      if (existing.status === 'PROCESSING') {
        return res.status(409).json({
          success: false,
          error: {
            code: 'CONCURRENT_REQUEST_IN_PROGRESS',
            message: 'A request with this idempotency key is currently being processed. Please wait.'
          }
        });
      }

      if (existing.status === 'COMPLETED') {
        // Replay cached response
        res.setHeader('X-Idempotent-Replayed', 'true');
        res.setHeader('X-Idempotency-Key', key);
        if (existing.headers) {
          for (const [hName, hVal] of Object.entries(existing.headers)) {
            res.setHeader(hName, hVal);
          }
        }
        return res.status(existing.statusCode).send(existing.body);
      }
    }

    // Mark as in-flight
    store.setProcessing(storeKey, ttlMs);

    // Intercept response methods to capture final output
    const originalSend = res.send.bind(res);
    const originalJson = res.json.bind(res);

    let capturedBody = null;

    res.json = function (body) {
      capturedBody = body;
      return originalJson(body);
    };

    res.send = function (body) {
      if (capturedBody === null) {
        capturedBody = body;
      }
      return originalSend(body);
    };

    res.on('finish', () => {
      // Only cache successful or client error responses (don't cache 500 server crashes so client can retry)
      if (res.statusCode < 500) {
        store.setCompleted(storeKey, {
          statusCode: res.statusCode,
          headers: res.getHeaders ? res.getHeaders() : {},
          body: capturedBody
        }, ttlMs);
      } else {
        store.delete(storeKey);
      }
    });

    next();
  };
}

module.exports = {
  idempotency,
  MemoryIdempotencyStore,
  defaultIdempotencyStore: defaultStore
};
