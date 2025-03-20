import { db } from '../db';
import * as queries from '../queries';
import { desc, and, eq, inArray, not, sql } from 'drizzle-orm';
import { notifications, tournaments } from '../../../../shared/schema';
import logger from '../../../core/logger';
import { NotificationType } from '../types';

/**
 * Notification service for managing user notifications
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
  ) {
    try {
      const offset = (page - 1) * pageSize;
      
      // Build query conditions
      let conditions = [eq(notifications.userId, userId)];
      
      if (type) {
        conditions.push(eq(notifications.type, type as NotificationType));
      }
      
      if (read !== undefined) {
        conditions.push(eq(notifications.read, read));
      }
      
      // Get notifications with pagination
      const notificationsList = await db.select()
        .from(notifications)
        .where(and(...conditions))
        .orderBy(desc(notifications.createdAt))
        .limit(pageSize)
        .offset(offset);
      
      // Get total count for pagination
      const countResult = await db.select({ count: sql`COUNT(*)` })
        .from(notifications)
        .where(and(...conditions));
      
      const total = Number(countResult[0].count);
      
      // Enhance notifications with tournament names
      const enhancedNotifications = await Promise.all(
        notificationsList.map(async (notification) => {
          const tournament = await db.query.tournaments.findFirst({
            where: eq(tournaments.id, notification.tournamentId)
          });
          
          return {
            ...notification,
            tournamentName: tournament?.name || 'Unknown Tournament'
          };
        })
      );
      
      return {
        notifications: enhancedNotifications,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      };
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
      // Verify user owns these notifications
      const userNotifications = await db.select()
        .from(notifications)
        .where(and(
          eq(notifications.userId, userId),
          inArray(notifications.id, notificationIds)
        ));
      
      // Check if all requested notifications belong to the user
      if (userNotifications.length !== notificationIds.length) {
        const userNotificationIds = userNotifications.map(n => n.id);
        const unauthorizedIds = notificationIds.filter(id => !userNotificationIds.includes(id));
        
        if (unauthorizedIds.length > 0) {
          throw new Error('Unauthorized: Cannot mark notifications that do not belong to you');
        }
      }
      
      // Mark notifications as read
      await db.update(notifications)
        .set({ read: true })
        .where(and(
          inArray(notifications.id, notificationIds),
          eq(notifications.userId, userId)
        ))
        .execute();
      
      // Return updated notifications
      const updatedNotifications = await db.select()
        .from(notifications)
        .where(inArray(notifications.id, notificationIds));
      
      return updatedNotifications;
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
      const result = await db.select({ count: sql`COUNT(*)` })
        .from(notifications)
        .where(and(
          eq(notifications.userId, userId),
          eq(notifications.read, false)
        ));
      
      return Number(result[0].count);
    } catch (error) {
      logger.error('Error getting unread notifications count', { error, userId });
      throw error;
    }
  }
}; 