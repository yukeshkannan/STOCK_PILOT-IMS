const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('@stockpilot/common');

router.post('/register', (req, res, next) => authController.register(req, res, next));
router.post('/login', (req, res, next) => authController.login(req, res, next));
router.post('/dev-login', (req, res, next) => authController.devLogin(req, res, next));
router.post('/refresh', (req, res, next) => authController.refresh(req, res, next));
router.post('/logout', (req, res, next) => authController.logout(req, res, next));
router.post('/forgot-password', (req, res, next) => authController.forgotPassword(req, res, next));
router.post('/complete-profile', authenticateToken, (req, res, next) => authController.completeProfile(req, res, next));
router.get('/me', authenticateToken, (req, res, next) => authController.getMe(req, res, next));
router.get('/internal/tenant-lookups', (req, res, next) => authController.getTenantLookupsInternal(req, res, next));
router.get('/internal/pending-users', (req, res, next) => authController.getPendingUsersInternal(req, res, next));
router.delete('/internal/pending-users/:id', (req, res, next) => authController.deletePendingUserInternal(req, res, next));
router.post('/internal/sync-user', (req, res, next) => authController.syncUserInternal(req, res, next));
router.put('/internal/sync-user/:id', (req, res, next) => authController.syncUserUpdateInternal(req, res, next));
router.delete('/internal/sync-user/:id', (req, res, next) => authController.syncUserDeleteInternal(req, res, next));
router.patch('/internal/tenant-status', (req, res, next) => authController.updateTenantStatus(req, res, next));
router.patch('/internal/tenant-plan', (req, res, next) => authController.updateTenantPlan(req, res, next));

module.exports = router;

