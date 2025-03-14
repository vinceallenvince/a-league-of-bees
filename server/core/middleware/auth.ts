import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';
import logger from '../logger';

/**
 * Middleware to verify the user is authenticated
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  try {
    if (!req.session.userId) {
      logger.debug('Authentication failed - No user session', { 
        path: req.path, 
        method: req.method 
      });
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Add userId to the request for logging
    req.log = { 
      ...req.log,
      userId: req.session.userId
    };
    
    next();
  } catch (error) {
    logger.error('Authentication middleware error', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Middleware to verify the user is an admin
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  try {
    if (!req.session.userId) {
      logger.debug('Admin authentication failed - No user session', { 
        path: req.path, 
        method: req.method 
      });
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    storage.getUser(req.session.userId).then(user => {
      if (!user?.isAdmin) {
        logger.debug('Admin access denied', { 
          userId: req.session.userId,
          path: req.path, 
          method: req.method 
        });
        return res.status(403).json({ error: 'Admin access required' });
      }
      
      // Add userId and admin status to the request for logging
      req.log = { 
        ...req.log,
        userId: req.session.userId,
        isAdmin: true
      };
      
      next();
    }).catch(error => {
      logger.error('Admin middleware error', { error });
      res.status(500).json({ error: 'Internal server error' });
    });
  } catch (error) {
    logger.error('Admin middleware error', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
} 