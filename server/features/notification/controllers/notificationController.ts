import { Request, Response } from 'express';
import logger from '../../../core/logger';
import { notificationService } from '../services/notificationService';
import { validateMarkAsRead } from '../validators/notificationValidator';

/**
 * Controller for notification operations
 */
export const notificationController = {
  /**
   * Get notifications for the authenticated user with pagination
   */
  getNotificationsHandler: async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      // Get pagination parameters
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      
      // Get actual notifications from the service
      const result = await notificationService.getNotifications(userId, page, pageSize);
      
      res.json(result);
    } catch (error) {
      logger.error('Error getting notifications', { error, userId: req.session.userId });
      
      res.status(500).json({
        error: 'Failed to fetch notifications',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  },
  
  /**
   * Mark a notification as read
   */
  markAsReadHandler: async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      const notificationId = req.params.id;
      
      // Use the service to mark the notification as read
      const result = await notificationService.markAsRead(userId, [notificationId]);
      res.json({ id: notificationId, read: true });
    } catch (error) {
      logger.error('Error marking notification as read', { error, userId: req.session.userId });
      
      res.status(500).json({
        error: 'Failed to mark notification as read',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  },
  
  /**
   * Mark all notifications as read for a user
   */
  markAllAsReadHandler: async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      // First get all notifications for the user
      const notificationsResult = await notificationService.getNotifications(userId, 1, 100, undefined, false);
      const notificationIds = notificationsResult.notifications.map(n => n.id);
      
      // Then mark them all as read if there are any
      if (notificationIds.length > 0) {
        await notificationService.markAsRead(userId, notificationIds);
      }
      
      res.json({ count: notificationIds.length });
    } catch (error) {
      logger.error('Error marking all notifications as read', { error, userId: req.session.userId });
      
      res.status(500).json({
        error: 'Failed to mark all notifications as read',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  }
}; 