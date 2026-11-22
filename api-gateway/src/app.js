const express = require('express');
const dns = require('dns');
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { SERVICES } = require('./config/services');
const { authGatewayMiddleware } = require('./middleware/authGateway');

const app = express();

// Security & Logging Middlewares
app.use(helmet());

// Dynamic Production CORS
const corsOrigin = process.env.CORS_ORIGIN
  ? (process.env.CORS_ORIGIN.includes(',') ? process.env.CORS_ORIGIN.split(',').map(s => s.trim()) : process.env.CORS_ORIGIN)
  : '*';

app.use(cors({
  origin: corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'x-tenant-id',
    'x-idempotency-key',
    'Idempotency-Key',
    'x-user-role',
    'x-user-permissions',
    'x-request-id'
  ],
  exposedHeaders: ['X-Idempotent-Replayed', 'X-Idempotency-Key', 'X-Request-Id']
}));

// Distributed Tracing: Inject unique Request ID
app.use((req, res, next) => {
  const requestId = req.headers['x-request-id'] || `sp-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
});

app.use(morgan('dev'));

// Strict Rate Limiting for Auth & Public OTP (Brute-force & Brevo OTP spam protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication or OTP attempts from this IP. Please try again after 15 minutes.',
    errorCode: 'AUTH_RATE_LIMIT_EXCEEDED'
  }
});
app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/sales/public/otp', authLimiter);

// General IP Rate Limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    errorCode: 'RATE_LIMIT_EXCEEDED'
  }
});
app.use('/api/', globalLimiter);

// Attach JWT Context Header Forwarding
app.use(authGatewayMiddleware);

// Tenant-Aware Rate Limiting (Prevents noisy-neighbor SaaS degradation)
const tenantLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 600,
  keyGenerator: (req) => req.headers['x-tenant-id'] || req.ip,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => !req.headers['x-tenant-id'],
  message: {
    success: false,
    message: 'Tenant API rate limit exceeded (600 req/min). Please throttle requests.',
    errorCode: 'TENANT_RATE_LIMIT_EXCEEDED'
  }
});
app.use('/api/', tenantLimiter);

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    service: 'API Gateway',
    timestamp: new Date().toISOString(),
    services: Object.keys(SERVICES).reduce((acc, key) => {
      acc[key] = SERVICES[key].url;
      return acc;
    }, {})
  });
});

// Instant AI Copilot Suggested Prompts Fallback (prevents 504 timeout when AI service is idle)
app.get('/api/v1/ai/suggested-prompts', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: '1', label: "Today's Sales", prompt: "Show me today's sales summary and total revenue.", icon: 'TrendingUp' },
      { id: '2', label: 'Low Stock Alert', prompt: 'Which products are low on stock right now?', icon: 'AlertTriangle' },
      { id: '3', label: 'Store Health Check', prompt: 'Give me a quick financial health check for this month.', icon: 'DollarSign' }
    ]
  });
});

// Configure Proxies for each microservice route
Object.entries(SERVICES).forEach(([name, config]) => {
  app.use(
    config.prefix,
    createProxyMiddleware({
      target: config.url,
      changeOrigin: true,
      proxyTimeout: 30000,
      timeout: 30000,
      pathRewrite: (path) => {
        const normalized = path.startsWith('/') ? path : `/${path}`;
        return `${config.prefix}${normalized === '/' ? '' : normalized}`;
      },
      on: {
        error: (err, req, res) => {
          console.error(`[Gateway Proxy Error] ${name} (${config.url}):`, err.message);
          if (res && !res.headersSent) {
            res.status(503).json({
              success: false,
              message: `Service [${name}] is currently unavailable. Please ensure the service is running.`,
              errorCode: 'SERVICE_UNAVAILABLE',
              service: name
            });
          }
        }
      },
      onError: (err, req, res) => {
        console.error(`[Gateway Proxy Error] ${name} (${config.url}):`, err.message);
        if (res && !res.headersSent) {
          res.status(503).json({
            success: false,
            message: `Service [${name}] is currently unavailable. Please ensure the service is running.`,
            errorCode: 'SERVICE_UNAVAILABLE',
            service: name
          });
        }
      }
    })
  );
});

// 404 Handler for unmatched routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API Route [${req.method} ${req.originalUrl}] not found on API Gateway.`,
    errorCode: 'ROUTE_NOT_FOUND'
  });
});

module.exports = app;
