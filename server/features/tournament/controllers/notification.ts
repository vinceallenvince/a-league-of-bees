import { Request, Response } from 'express';
import logger from '../../../core/logger';
import { notificationService } from '../services/notification';
import { validateMarkAsRead } from '../validators/notification';

/**
 * Controller for notification operations
 */
export const notificationController = {
  /**
   * Get notifications for the authenticated user
   */
  getNotificationsHandler: async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      // Parse pagination parameters
      const page = parseInt(req.query.page as string || '1', 10);
      const pageSize = parseInt(req.query.pageSize as string || '10', 10);
      
      // Parse filters
      const type = req.query.type as string | undefined;
      
      // Parse read status filter
      let read: boolean | undefined = undefined;
      if (req.query.read !== undefined) {
        read = req.query.read === 'true';
      }
      
      const notifications = await notificationService.getNotifications(
        userId,
        page,
        pageSize,
        type,
        read
      );
      
      res.json(notifications);
    } catch (error) {
      logger.error('Error getting notifications', { error });
      
      res.status(500).json({
        error: 'Failed to get notifications',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  },
  
  /**
   * Mark notifications as read
   */
  markAsReadHandler: async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      const validationResult = validateMarkAsRead(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({
          error: 'Invalid notification data',
          details: validationResult.error.format()
        });
      }
      
      const updatedNotifications = await notificationService.markAsRead(
        userId,
        validationResult.data.notificationIds
      );
      
      res.json(updatedNotifications);
    } catch (error) {
      logger.error('Error marking notifications as read', { error });
      
      if (error instanceof Error && error.message.includes('Unauthorized')) {
        return res.status(403).json({ error: error.message });
      }
      
      res.status(500).json({
        error: 'Failed to mark notifications as read',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  }
}; 