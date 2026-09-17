const express = require('express');
const router = express.Router();
const tenantController = require('../controllers/tenantController');
const userController = require('../controllers/userController');
const adminController = require('../controllers/adminController');
const {
  authenticateToken,
  requireTenant,
  requireSuperAdmin,
  requirePermission,
  PERMISSIONS
} = require('@stockpilot/common');

// Tenant Routes (/api/v1/tenants)
const tenantRouter = express.Router();
tenantRouter.get('/internal/:id', (req, res, next) => tenantController.getTenantInternal(req, res, next));
tenantRouter.use(authenticateToken, requireTenant);
tenantRouter.get('/me', (req, res, next) => tenantController.getMe(req, res, next));
tenantRouter.put('/me', requirePermission(PERMISSIONS.TENANT_SETTINGS), (req, res, next) => tenantController.updateMe(req, res, next));
tenantRouter.get('/settings', (req, res, next) => tenantController.getSettings(req, res, next));
tenantRouter.put('/settings', requirePermission(PERMISSIONS.TENANT_SETTINGS), (req, res, next) => tenantController.updateSettings(req, res, next));
tenantRouter.post('/subscription/upgrade', (req, res, next) => tenantController.upgradeSubscription(req, res, next));

// Users Routes (/api/v1/users)
const userRouter = express.Router();
userRouter.use(authenticateToken, requireTenant);
userRouter.get('/', requirePermission(PERMISSIONS.USER_VIEW), (req, res, next) => userController.listUsers(req, res, next));
userRouter.post('/', requirePermission(PERMISSIONS.USER_CREATE), (req, res, next) => userController.createUser(req, res, next));
userRouter.get('/:id', requirePermission(PERMISSIONS.USER_VIEW), (req, res, next) => userController.getUser(req, res, next));
userRouter.put('/:id', requirePermission(PERMISSIONS.USER_UPDATE), (req, res, next) => userController.updateUser(req, res, next));
userRouter.patch('/:id/status', requirePermission(PERMISSIONS.USER_UPDATE), (req, res, next) => userController.toggleStatus(req, res, next));
userRouter.delete('/:id', requirePermission(PERMISSIONS.USER_DELETE), (req, res, next) => userController.deleteUser(req, res, next));

// Roles & Permissions (/api/v1/roles, /api/v1/permissions)
const roleRouter = express.Router();
roleRouter.use(authenticateToken, requireTenant);
roleRouter.get('/', (req, res, next) => userController.listRoles(req, res, next));

const permissionRouter = express.Router();
permissionRouter.use(authenticateToken, requireTenant);
permissionRouter.get('/', (req, res, next) => userController.listPermissions(req, res, next));

// Audit Logs (/api/v1/audit-logs)
const auditRouter = express.Router();
auditRouter.use(authenticateToken, requireTenant);
auditRouter.get('/', (req, res, next) => userController.getAuditLogs(req, res, next));

// Platform Admin Routes (/api/v1/admin)
const adminRouter = express.Router();
adminRouter.use(authenticateToken, requireSuperAdmin);
adminRouter.get('/dashboard', (req, res, next) => adminController.getDashboard(req, res, next));
adminRouter.get('/tenants', (req, res, next) => adminController.listTenants(req, res, next));
adminRouter.get('/pending-registrations', (req, res, next) => adminController.listPendingRegistrations(req, res, next));
adminRouter.delete('/pending-registrations/:id', (req, res, next) => adminController.deletePendingRegistration(req, res, next));
adminRouter.post('/tenants', (req, res, next) => adminController.createTenant(req, res, next));
adminRouter.patch('/tenants/:id/suspend', (req, res, next) => adminController.suspendTenant(req, res, next));
adminRouter.patch('/tenants/:id/activate', (req, res, next) => adminController.activateTenant(req, res, next));
adminRouter.patch('/tenants/:id/plan', (req, res, next) => adminController.updateTenantPlan(req, res, next));
adminRouter.delete('/tenants/:id', (req, res, next) => adminController.deleteTenant(req, res, next));
adminRouter.get('/audit-logs', (req, res, next) => adminController.getAuditLogs(req, res, next));
adminRouter.delete('/audit-logs/:id', (req, res, next) => adminController.deleteAuditLog(req, res, next));
adminRouter.delete('/audit-logs', (req, res, next) => adminController.clearAuditLogs(req, res, next));

module.exports = {
  tenantRouter,
  userRouter,
  roleRouter,
  permissionRouter,
  auditRouter,
  adminRouter
};
