import { Request, Response, NextFunction } from 'express';
import expressSession from 'express-session';
import logger from '../core/logger';

// Type definition for session with custom properties
declare module 'express-session' {
  interface SessionData {
    userId: string;
    isAuthenticated: boolean;
  }
}

/**
 * Session middleware configuration
 * This sets up session management for the application
 */
export const sessionMiddleware = expressSession({
  secret: process.env.SESSION_SECRET || 'test-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
});

// Additional middleware to log session information
export const sessionLoggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (req.session && req.session.userId) {
    logger.debug('Session active', { userId: req.session.userId, path: req.path });
  }
  next();
}; 