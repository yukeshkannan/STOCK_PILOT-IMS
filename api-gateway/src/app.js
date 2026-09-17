const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { SERVICES } = require('./config/services');
const { authGatewayMiddleware } = require('./middleware/authGateway');

const app = express();

// Security & Logging Middlewares
app.use(helmet());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-id', 'x-idempotency-key', 'Idempotency-Key', 'x-user-role', 'x-user-permissions'],
  exposedHeaders: ['X-Idempotent-Replayed', 'X-Idempotency-Key']
}));
app.use(morgan('dev'));

// Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    errorCode: 'RATE_LIMIT_EXCEEDED'
  }
});
app.use('/api/', limiter);

// Attach JWT Context Header Forwarding
app.use(authGatewayMiddleware);

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

// Configure Proxies for each microservice route
Object.entries(SERVICES).forEach(([name, config]) => {
  app.use(
    config.prefix,
    createProxyMiddleware({
      target: config.url,
      changeOrigin: true,
      pathRewrite: (path) => {
        const normalized = path.startsWith('/') ? path : `/${path}`;
        return `${config.prefix}${normalized === '/' ? '' : normalized}`;
      },
      onError: (err, req, res) => {
        console.error(`[Gateway Proxy Error] ${name} (${config.url}):`, err.message);
        res.status(503).json({
          success: false,
          message: `Service [${name}] is currently unavailable. Please ensure the service is running.`,
          errorCode: 'SERVICE_UNAVAILABLE',
          service: name
        });
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
