/**
 * StockPilot Resilient HTTP Client
 * - Enforces request timeout via AbortController to prevent connection leaks
 * - Automatically retries on 502/503/504 and transient network errors with exponential backoff
 * - Injects and propagates distributed tracing headers (x-request-id, x-tenant-id)
 */

async function resilientFetch(url, options = {}) {
  const {
    timeout = 8000,
    retries = 2,
    backoffMs = 400,
    requestId = null,
    tenantId = null,
    headers = {},
    ...restOptions
  } = options;

  const mergedHeaders = {
    ...headers
  };

  if (requestId && !mergedHeaders['x-request-id']) {
    mergedHeaders['x-request-id'] = requestId;
  }
  if (tenantId && !mergedHeaders['x-tenant-id']) {
    mergedHeaders['x-tenant-id'] = String(tenantId);
  }

  let lastError = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...restOptions,
        headers: mergedHeaders,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Transient gateway/server error -> retry if attempts remaining
      if ([502, 503, 504].includes(response.status) && attempt < retries) {
        const delay = backoffMs * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      return response;
    } catch (err) {
      clearTimeout(timeoutId);
      lastError = err;

      if (err.name === 'AbortError') {
        lastError = new Error(`Request to ${url} timed out after ${timeout}ms`);
      }

      if (attempt < retries) {
        const delay = backoffMs * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

module.exports = {
  resilientFetch
};
