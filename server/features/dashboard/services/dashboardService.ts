import { dashboardService as tournamentDashboardService } from '../../tournament/services/dashboard';
import logger from '../../../core/logger';
import { DashboardData } from '../types';
import { NotificationType } from '../../tournament/types';

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
        recentActivity: tournamentDashboardData.recentActivity.map(activity => ({
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
      throw error;
    }
  }
}; 