import { Request, Response, NextFunction } from 'express';
import logger from '../logger';
import { storage } from '../../storage';

/**
 * Middleware to require admin privileges
 * 
 * This middleware checks if the authenticated user has admin privileges.
 * It should be used after the requireAuth middleware.
 */
export const requireAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Check if user is authenticated
  if (!req.session.userId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  try {
    // Get user from storage
    const user = await storage.getUser(req.session.userId);
    
    // Check if user exists and has admin privileges
    if (!user || !user.isAdmin) {
      logger.warn('Non-admin user attempted to access admin-only route', {
        userId: req.session.userId,
        path: req.path,
        method: req.method
      });
      
      res.status(403).json({ error: 'Admin privileges required' });
      return;
    }

    // User is authenticated and has admin privileges
    next();
  } catch (error) {
    logger.error('Error checking admin privileges', { error, userId: req.session.userId });
    res.status(500).json({ error: 'Internal server error' });
  }
}; 