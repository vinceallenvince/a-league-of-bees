import { Request, Response } from 'express';
import logger from '../../../core/logger';
import { dashboardService } from '../services/dashboard';

/**
 * Controller for dashboard operations
 */
export const dashboardController = {
  /**
   * Get dashboard data for the authenticated user
   */
  getDashboardHandler: async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      const dashboardData = await dashboardService.getDashboardData(userId);
      res.json(dashboardData);
    } catch (error) {
      logger.error('Error getting dashboard data', { error });
      
      if (error instanceof Error && error.message.includes('User not found')) {
        return res.status(404).json({ error: error.message });
      }
      
      res.status(500).json({
        error: 'Failed to get dashboard data',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  }
}; 