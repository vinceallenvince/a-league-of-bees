import { Request, Response } from 'express';
import logger from '../../../core/logger';
import { dashboardService } from '../services/dashboardService';
import { db } from '../../../core/db';
import { users } from '../../../../shared/schema';
import { eq } from 'drizzle-orm';
import { storage } from '../../../core/storage';

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
      
      try {
        // Use the dashboardService to get real data from the database
        const dashboardData = await dashboardService.getDashboardData(userId);
        return res.json(dashboardData);
      } catch (initialError: any) {
        // If this is a unique constraint violation, it means the user exists in the database
        // with a different ID than what's in the session
        if (initialError.code === '23505' && initialError.constraint === 'users_email_unique') {
          try {
            // Get user from memory storage to find email
            const memUser = await storage.getUserById(userId);
            if (!memUser) {
              return res.status(401).json({ error: 'User not found' });
            }
            
            // Find user in database by email
            const dbUser = await db.select().from(users).where(eq(users.email, memUser.email)).limit(1);
            if (dbUser.length > 0) {
              // Update session with the correct database ID
              logger.info('Updating session with database user ID', {
                oldId: userId,
                newId: dbUser[0].id,
                email: memUser.email
              });
              
              // Update the session
              req.session.userId = dbUser[0].id;
              
              // Now try again with the correct ID
              const dashboardData = await dashboardService.getDashboardData(dbUser[0].id);
              return res.json(dashboardData);
            }
          } catch (retryError) {
            logger.error('Failed to handle user ID mismatch', { error: retryError });
            // Fall through to the general error handler
          }
        }
        
        // Handle general errors
        logger.error('Error getting dashboard data', { error: initialError });
        
        res.status(500).json({
          error: 'Failed to get dashboard data',
          details: initialError instanceof Error ? initialError.message : String(initialError)
        });
      }
    } catch (error) {
      logger.error('Error getting dashboard data', { error });
      
      res.status(500).json({
        error: 'Failed to get dashboard data',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  }
}; 