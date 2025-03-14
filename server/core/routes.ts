import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import profileRoutes from "../features/profile/routes";
import adminRoutes from "../features/admin/routes";
import infoRoutes from "../features/info/routes";
import logger from "./logger";

/**
 * API-specific 404 handler
 * This only handles 404s for /api routes, allowing client routes to be handled by Vite/static
 */
function apiNotFoundHandler(req: Request, res: Response) {
  if (req.path.startsWith('/api')) {
    logger.debug('API 404', { path: req.path, method: req.method });
    res.status(404).json({ error: "API endpoint not found" });
  } else {
    // Let non-API requests pass through to be handled by Vite/static middleware
    res.status(404).end();
  }
}

export function registerRoutes(app: Express): Server {
  // Set up authentication
  setupAuth(app);

  // Register feature routes
  try {
    app.use('/api/profile', profileRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api/info', infoRoutes);
    
    // API 404 handler - only applied to /api routes
    app.use('/api/*', apiNotFoundHandler);
    
    // Log successful route registration
    logger.info('Routes registered successfully', {
      routes: ['/api/profile', '/api/admin', '/api/info']
    });
  } catch (error) {
    logger.error('Error registering routes', { error });
    throw error;
  }

  // Create and return the HTTP server
  return createServer(app);
} 