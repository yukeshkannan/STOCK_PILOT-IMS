const express = require('express');
const router = express.Router();
const tenantController = require('../controllers/tenantController');
const userController = require('../controllers/userController');
const adminController = require('../controllers/adminController');
const ticketController = require('../controllers/ticketController');
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
tenantRouter.post('/internal/provision', (req, res, next) => tenantController.provisionTenantInternal(req, res, next));
tenantRouter.use(authenticateToken, requireTenant);

tenantRouter.get('/me', (req, res, next) => tenantController.getMe(req, res, next));
tenantRouter.put('/me', requirePermission(PERMISSIONS.TENANT_SETTINGS), (req, res, next) => tenantController.updateMe(req, res, next));
tenantRouter.get('/settings', (req, res, next) => tenantController.getSettings(req, res, next));
tenantRouter.put('/settings', requirePermission(PERMISSIONS.TENANT_SETTINGS), (req, res, next) => tenantController.updateSettings(req, res, next));
tenantRouter.get('/store-config', (req, res, next) => tenantController.getStoreConfig(req, res, next));
tenantRouter.put('/store-config', (req, res, next) => tenantController.updateStoreConfig(req, res, next));
tenantRouter.post('/subscription/upgrade', (req, res, next) => tenantController.upgradeSubscription(req, res, next));

// Support Tickets for Tenant
tenantRouter.get('/tickets', (req, res, next) => ticketController.getMyTickets(req, res, next));
tenantRouter.get('/tickets/my', (req, res, next) => ticketController.getMyTickets(req, res, next));
tenantRouter.post('/tickets', (req, res, next) => ticketController.createTicket(req, res, next));
tenantRouter.get('/tickets/:id', (req, res, next) => ticketController.getTicketDetails(req, res, next));
tenantRouter.post('/tickets/:id/messages', (req, res, next) => ticketController.addMessage(req, res, next));
tenantRouter.delete('/tickets/:id', (req, res, next) => ticketController.deleteTicket(req, res, next));

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

// Platform Admin & Developer Routes (/api/v1/admin)
const adminRouter = express.Router();
adminRouter.use(authenticateToken);

const requireSuperAdminOrDev = (req, res, next) => {
  if (req.user && (req.user.isSuperAdmin || req.user.isDeveloper || req.user.role === 'DEVELOPER' || req.user.roleName === 'DEVELOPER')) {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Forbidden: Requires Developer or Super Admin platform privileges' });
};

// SuperAdmin-Only Routes (Tenant isolation, suspensions, DB logs)
adminRouter.get('/dashboard', requireSuperAdmin, (req, res, next) => adminController.getDashboard(req, res, next));
adminRouter.get('/tenants', requireSuperAdmin, (req, res, next) => adminController.listTenants(req, res, next));
adminRouter.get('/pending-registrations', requireSuperAdmin, (req, res, next) => adminController.listPendingRegistrations(req, res, next));
adminRouter.delete('/pending-registrations/:id', requireSuperAdmin, (req, res, next) => adminController.deletePendingRegistration(req, res, next));
adminRouter.post('/tenants', requireSuperAdmin, (req, res, next) => adminController.createTenant(req, res, next));
adminRouter.patch('/tenants/:id/suspend', requireSuperAdmin, (req, res, next) => adminController.suspendTenant(req, res, next));
adminRouter.patch('/tenants/:id/activate', requireSuperAdmin, (req, res, next) => adminController.activateTenant(req, res, next));
adminRouter.patch('/tenants/:id/plan', requireSuperAdmin, (req, res, next) => adminController.updateTenantPlan(req, res, next));
adminRouter.delete('/tenants/:id', requireSuperAdmin, (req, res, next) => adminController.deleteTenant(req, res, next));
adminRouter.get('/audit-logs', requireSuperAdmin, (req, res, next) => adminController.getAuditLogs(req, res, next));
adminRouter.delete('/audit-logs/:id', requireSuperAdmin, (req, res, next) => adminController.deleteAuditLog(req, res, next));
adminRouter.delete('/audit-logs', requireSuperAdmin, (req, res, next) => adminController.clearAuditLogs(req, res, next));

// Support Tickets for Super Admin & Developers
adminRouter.get('/tickets', requireSuperAdminOrDev, (req, res, next) => ticketController.adminListTickets(req, res, next));
adminRouter.get('/tickets/stats', requireSuperAdminOrDev, (req, res, next) => ticketController.adminGetStats(req, res, next));
adminRouter.get('/tickets/:id', requireSuperAdminOrDev, (req, res, next) => ticketController.getTicketDetails(req, res, next));
adminRouter.patch('/tickets/:id/status', requireSuperAdminOrDev, (req, res, next) => ticketController.adminUpdateTicket(req, res, next));
adminRouter.put('/tickets/:id/status', requireSuperAdminOrDev, (req, res, next) => ticketController.adminUpdateTicket(req, res, next));
adminRouter.patch('/tickets/:id', requireSuperAdminOrDev, (req, res, next) => ticketController.adminUpdateTicket(req, res, next));
adminRouter.put('/tickets/:id', requireSuperAdminOrDev, (req, res, next) => ticketController.adminUpdateTicket(req, res, next));
adminRouter.post('/tickets/:id/messages', requireSuperAdminOrDev, (req, res, next) => ticketController.addMessage(req, res, next));
adminRouter.delete('/tickets/:id', requireSuperAdminOrDev, (req, res, next) => ticketController.deleteTicket(req, res, next));

// Developer & Support Team Management (Devs can view team, SuperAdmin can manage)
adminRouter.get('/team', requireSuperAdminOrDev, (req, res, next) => ticketController.adminGetTeam(req, res, next));
adminRouter.post('/team', requireSuperAdmin, (req, res, next) => ticketController.adminAddTeamMember(req, res, next));
adminRouter.put('/team/:id', requireSuperAdmin, (req, res, next) => ticketController.adminUpdateTeamMember(req, res, next));
adminRouter.delete('/team/:id', requireSuperAdmin, (req, res, next) => ticketController.adminDeleteTeamMember(req, res, next));
adminRouter.get('/support-members', requireSuperAdminOrDev, (req, res, next) => ticketController.adminGetTeam(req, res, next));
adminRouter.post('/support-members', requireSuperAdmin, (req, res, next) => ticketController.adminAddTeamMember(req, res, next));
adminRouter.put('/support-members/:id', requireSuperAdmin, (req, res, next) => ticketController.adminUpdateTeamMember(req, res, next));
adminRouter.delete('/support-members/:id', requireSuperAdmin, (req, res, next) => ticketController.adminDeleteTeamMember(req, res, next));

module.exports = {
  tenantRouter,
  userRouter,
  roleRouter,
  permissionRouter,
  auditRouter,
  adminRouter
};

