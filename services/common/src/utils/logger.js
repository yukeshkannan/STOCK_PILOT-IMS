const logger = {
  info: (msg, meta = '') => console.log(`[${new Date().toISOString()}] [INFO] ${msg}`, meta),
  warn: (msg, meta = '') => console.warn(`[${new Date().toISOString()}] [WARN] ${msg}`, meta),
  error: (msg, meta = '') => console.error(`[${new Date().toISOString()}] [ERROR] ${msg}`, meta),
  debug: (msg, meta = '') => {
    if (process.env.DEBUG) {
      console.log(`[${new Date().toISOString()}] [DEBUG] ${msg}`, meta);
    }
  }
};

function createLogger(moduleName = 'App') {
  return {
    info: (msg, meta = '') => console.log(`[${new Date().toISOString()}] [INFO] [${moduleName}] ${msg}`, meta),
    warn: (msg, meta = '') => console.warn(`[${new Date().toISOString()}] [WARN] [${moduleName}] ${msg}`, meta),
    error: (msg, meta = '') => console.error(`[${new Date().toISOString()}] [ERROR] [${moduleName}] ${msg}`, meta),
    debug: (msg, meta = '') => {
      if (process.env.DEBUG) {
        console.log(`[${new Date().toISOString()}] [DEBUG] [${moduleName}] ${msg}`, meta);
      }
    }
  };
}

logger.logger = logger;
logger.createLogger = createLogger;

module.exports = logger;
module.exports.logger = logger;
module.exports.createLogger = createLogger;

