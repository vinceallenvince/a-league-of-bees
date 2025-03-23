import { dashboardService as tournamentDashboardService } from '../../tournament/services/dashboard';
import logger from '../../../core/logger';
import { DashboardData } from '../types';
import { NotificationType } from '../../tournament/types';
import { storage } from '../../../core/storage';

/**
 * Service for dashboard data aggregation
 */
export const dashboardService = {
  /**
   * Get dashboard data for a user
   */
  async getDashboardData(userId: string): Promise<DashboardData> {
    try {
      // Use the existing tournament dashboard service
      const tournamentDashboardData = await tournamentDashboardService.getDashboardData(userId);
      
      // Ensure proper type conversion
      const dashboardData: DashboardData = {
        userInfo: tournamentDashboardData.userInfo,
        tournamentSummary: tournamentDashboardData.tournamentSummary,
        participation: tournamentDashboardData.participation,
        recentActivity: tournamentDashboardData.recentActivity.map((activity: any) => ({
          ...activity,
          type: activity.type as NotificationType,
          timestamp: activity.timestamp as Date
        })),
        upcomingTournaments: tournamentDashboardData.upcomingTournaments,
        unreadNotificationsCount: tournamentDashboardData.unreadNotificationsCount
      };
      
      return dashboardData;
    } catch (error) {
      logger.error('Error getting dashboard data', { error, userId });
      
      // If the error is due to database connectivity issues,
      // try to provide at least minimal information from memory storage
      try {
        // Get basic user info from memory storage as fallback
        const memUser = await storage.getUserById(userId);
        if (memUser) {
          logger.info('Database error, falling back to minimal dashboard from memory', { userId });
          
          // Return minimal dashboard data using only in-memory user info
          return {
            userInfo: {
              id: memUser.id,
              username: memUser.username || memUser.email.split('@')[0],
              email: memUser.email
            },
            tournamentSummary: {
              active: 0,
              pending: 0,
              completed: 0,
              cancelled: 0
            },
            participation: {
              hosting: 0,
              joined: 0,
              invited: 0
            },
            recentActivity: [],
            upcomingTournaments: [],
            unreadNotificationsCount: 0
          };
        }
      } catch (fallbackError) {
        logger.error('Failed to provide fallback dashboard data', { 
          originalError: error, 
          fallbackError, 
          userId 
        });
      }
      
      // Re-throw the original error if we couldn't provide a fallback
      throw error;
    }
  }
}; 