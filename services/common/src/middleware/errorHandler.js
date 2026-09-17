const { sendError } = require('../utils/response');
const { logger } = require('../utils/logger');

function errorHandler(err, req, res, next) {
  logger.error(`[Global Error] ${req.method} ${req.originalUrl}:`, err);

  if (err.name === 'ZodError') {
    const errorDetails = err.errors.map(e => ({
      field: e.path.join('.'),
      message: e.message
    }));
    return sendError(res, 'Validation Error', 400, errorDetails);
  }

  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    const errorDetails = err.errors.map(e => ({
      field: e.path,
      message: e.message
    }));
    return sendError(res, 'Database Validation Error', 400, errorDetails);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  return sendError(res, message, statusCode);
}

module.exports = { errorHandler };
