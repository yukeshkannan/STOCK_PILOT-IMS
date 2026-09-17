const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticateToken, requireTenant } = require('@stockpilot/common');

// Support inter-service creation route
router.post('/internal', (req, res, next) => notificationController.createNotification(req, res, next));

router.use(authenticateToken, requireTenant);

router.get('/', (req, res, next) => notificationController.listNotifications(req, res, next));
router.post('/', (req, res, next) => notificationController.createNotification(req, res, next));
router.post('/broadcast', (req, res, next) => notificationController.broadcastNotification(req, res, next));
router.post('/:id/action', (req, res, next) => notificationController.executeAction(req, res, next));
router.patch('/read-all', (req, res, next) => notificationController.markAllRead(req, res, next));
router.delete('/clear-read', (req, res, next) => notificationController.clearRead(req, res, next));
router.patch('/:id/read', (req, res, next) => notificationController.markRead(req, res, next));
router.delete('/:id', (req, res, next) => notificationController.deleteNotification(req, res, next));

module.exports = router;

