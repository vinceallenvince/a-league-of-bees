import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import profileRoutes from "../features/profile/routes";
import adminRoutes from "../features/admin/routes";
import infoRoutes from "../features/info/routes";
import { tournamentRoutes } from "../features/tournament/routes";
import { dashboardRoutes } from "../features/dashboard/routes";
import { notificationRoutes } from "../features/notification/routes";
import { jobRoutes } from "./jobs/routes";
import logger from "./logger";
import { syncUserIds } from './middleware/auth';

/**
 * API-specific 404 handler
 * This only handles 404s for /api routes, allowing client routes to be handled by Vite/static
 */
function apiNotFoundHandler(req: Request, res: Response) {
  if (req.path.startsWith('/api')) {
    logger.debug('API 404', { path: req.path, method: req.method });
    res.status(404).json({ error: 'API endpoint not found' });
  } else {
    // Let Vite/static handle non-API routes
    res.status(404).end();
  }
}

export function registerRoutes(app: Express): Server {
  // Set up authentication
  setupAuth(app);

  // Apply the sync user IDs middleware to all API routes
  app.use('/api', syncUserIds);

  // Register feature routes
  try {
    app.use('/api/profile', profileRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api/info', infoRoutes);
    app.use('/api/tournaments', tournamentRoutes);
    app.use('/api/dashboard', dashboardRoutes);
    app.use('/api/notifications', notificationRoutes);
    app.use('/api/jobs', jobRoutes);
    
    // API 404 handler - only applied to /api routes
    app.use('/api/*', apiNotFoundHandler);
    
    // Log successful route registration
    logger.info('Routes registered successfully', {
      routes: ['/api/profile', '/api/admin', '/api/info', '/api/tournaments', 
              '/api/dashboard', '/api/notifications', '/api/jobs']
    });
  } catch (error) {
    logger.error('Error registering routes', { error });
    throw error;
  }

  // Create and return the HTTP server
  return createServer(app);
} 