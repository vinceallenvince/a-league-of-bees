import { Express } from 'express';
import { setupRequestLogging, setupErrorLogging, captureResponseBody } from './logging';
import { setupErrorHandling, setupNotFoundHandler } from './error-handler';
import { setupCommonMiddleware } from './common';

/**
 * Setup all middleware for the Express app
 */
export function setupMiddleware(app: Express): void {
  // Setup common middleware first
  setupCommonMiddleware(app);
  
  // Setup request logging
  setupRequestLogging(app);
  
  // Setup response body capture for API routes
  app.use(captureResponseBody);
}

/**
 * Setup error handling middleware
 * This should be called after all routes are registered
 */
export function setupErrorMiddleware(app: Express): void {
  // Setup error logging
  setupErrorLogging(app);
  
  // Setup 404 handler
  setupNotFoundHandler(app);
  
  // Setup error handler (should be last)
  setupErrorHandling(app);
}

// Export all middleware for direct use if needed
export * from './logging';
export * from './error-handler';
export * from './common';
export * from './auth'; 