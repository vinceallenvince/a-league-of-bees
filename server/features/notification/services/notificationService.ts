import { notificationService as tournamentNotificationService } from '../../tournament/services/notification';
import logger from '../../../core/logger';
import { NotificationData, PaginatedNotifications } from '../types';
import { NotificationType } from '../../tournament/types';

/**
 * Service for notification management
 */
export const notificationService = {
  /**
   * Get paginated notifications for a user with optional filters
   */
  async getNotifications(
    userId: string,
    page = 1,
    pageSize = 10,
    type?: string,
    read?: boolean
  ): Promise<PaginatedNotifications> {
    try {
      // Use the existing tournament notification service
      const result = await tournamentNotificationService.getNotifications(
        userId,
        page,
        pageSize,
        type,
        read
      );
      
      // Ensure proper type conversions
      const enhancedResult: PaginatedNotifications = {
        notifications: result.notifications.map(notification => ({
          ...notification,
          type: notification.type as NotificationType
        })) as NotificationData[],
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        totalPages: result.totalPages
      };
      
      return enhancedResult;
    } catch (error) {
      logger.error('Error getting notifications', { error, userId });
      throw error;
    }
  },
  
  /**
   * Mark notifications as read
   */
  async markAsRead(userId: string, notificationIds: string[]) {
    try {
      return await tournamentNotificationService.markAsRead(userId, notificationIds);
    } catch (error) {
      logger.error('Error marking notifications as read', { error, userId, notificationIds });
      throw error;
    }
  },
  
  /**
   * Get count of unread notifications for a user
   */
  async getUnreadCount(userId: string) {
    try {
      return await tournamentNotificationService.getUnreadCount(userId);
    } catch (error) {
      logger.error('Error getting unread notifications count', { error, userId });
      throw error;
    }
  }
}; 