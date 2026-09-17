const { ApiResponse } = require('@stockpilot/common');
const notificationService = require('../services/notificationService');

class NotificationController {
  async listNotifications(req, res, next) {
    try {
      const { category, unreadOnly, search, limit, page } = req.query;
      const result = await notificationService.getNotifications(
        req.user?.tenantId,
        req.user?.userId,
        req.user?.isSuperAdmin,
        {
          category,
          unreadOnly: unreadOnly === 'true' || unreadOnly === true,
          search,
          limit: limit || 50,
          page: page || 1,
          user: req.user
        }
      );
      return ApiResponse.success(res, result, 'Notifications retrieved');
    } catch (err) {
      next(err);
    }
  }

  async executeAction(req, res, next) {
    try {
      const { action, comments } = req.body;
      const result = await notificationService.executeAction({
        tenantId: req.user?.tenantId,
        notificationId: req.params.id,
        action,
        user: req.user,
        authHeader: req.headers.authorization
      });
      return ApiResponse.success(res, result, `Action '${action}' executed successfully`);
    } catch (err) {
      next(err);
    }
  }

  async markRead(req, res, next) {
    try {
      const result = await notificationService.markAsRead(req.user?.tenantId, req.params.id, req.user?.isSuperAdmin);
      return ApiResponse.success(res, result, 'Notification marked as read');
    } catch (err) {
      next(err);
    }
  }

  async markAllRead(req, res, next) {
    try {
      await notificationService.markAllAsRead(req.user?.tenantId, req.user?.isSuperAdmin);
      return ApiResponse.success(res, null, 'All notifications marked as read');
    } catch (err) {
      next(err);
    }
  }

  async deleteNotification(req, res, next) {
    try {
      await notificationService.deleteNotification(req.user?.tenantId, req.params.id, req.user?.isSuperAdmin);
      return ApiResponse.success(res, null, 'Notification removed');
    } catch (err) {
      next(err);
    }
  }

  async clearRead(req, res, next) {
    try {
      await notificationService.clearReadNotifications(req.user?.tenantId, req.user?.isSuperAdmin);
      return ApiResponse.success(res, null, 'All read notifications cleared');
    } catch (err) {
      next(err);
    }
  }

  async createNotification(req, res, next) {
    try {
      const tenantId = req.user?.tenantId || req.body.tenantId || req.headers['x-tenant-id'];
      const { title, message, type, category, actionType, actionId, actionStatus, metadata, link, userId } = req.body;
      const notif = await notificationService.createNotification({
        tenantId: tenantId ? Number(tenantId) : 0,
        userId: userId || req.user?.userId || null,
        title,
        message,
        type: type || 'SYSTEM',
        category,
        actionType,
        actionId,
        actionStatus,
        metadata,
        link: link || null
      });
      return ApiResponse.created(res, notif, 'Notification created');
    } catch (err) {
      next(err);
    }
  }

  async broadcastNotification(req, res, next) {
    try {
      const { tenantId, tenantIds, title, message, type, category, link } = req.body;
      const result = await notificationService.broadcast({
        tenantId,
        tenantIds,
        title,
        message,
        type: type || 'SYSTEM',
        category: category || 'SYSTEM',
        link
      });
      return ApiResponse.success(res, result, 'Notification broadcasted successfully');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new NotificationController();

