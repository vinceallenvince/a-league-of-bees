import { Request, Response, NextFunction, Express } from 'express';
import logger from '../logger';

/**
 * Global error handler middleware
 */
export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction): void {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  // Log the error with Winston
  logger.error("Unhandled error", {
    status,
    message,
    stack: err.stack,
  });

  // Send the error response
  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
}

/**
 * Setup error handling middleware for the Express app
 */
export function setupErrorHandling(app: Express): void {
  // Error handler should be the last middleware
  app.use(errorHandler);
}

/**
 * Middleware to handle 404 errors
 */
export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ error: "Not Found" });
}

/**
 * Setup 404 handler middleware for the Express app
 */
export function setupNotFoundHandler(app: Express): void {
  // This should be added after all routes are registered
  app.use(notFoundHandler);
} 