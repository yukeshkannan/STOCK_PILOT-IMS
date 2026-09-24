const constants = require('./constants');
const db = require('./db/connection');
const eventBus = require('./events/eventBus');
const auth = require('./middleware/auth');
const tenantIsolation = require('./middleware/tenantIsolation');
const rbac = require('./middleware/rbac');
const errorHandler = require('./middleware/errorHandler');
const idempotency = require('./middleware/idempotency');
const response = require('./utils/response');
const logger = require('./utils/logger');
const sequence = require('./utils/sequence');
const cache = require('./cache/cacheClient');

module.exports = {
  ...constants,
  ...db,
  ...eventBus,
  ...auth,
  ...tenantIsolation,
  ...rbac,
  ...errorHandler,
  ...idempotency,
  ...response,
  ...logger,
  ...sequence,
  ...cache
};
