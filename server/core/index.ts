import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import logger from "./logger";
import { setupMiddleware, setupErrorLogging } from "./middleware";
import { setupErrorHandling } from "./middleware/error-handler";

export function createApp() {
  const app = express();
  
  // Set up all middleware
  setupMiddleware(app);

  // Register all routes
  const server = registerRoutes(app);

  // Set up error logging middleware (after routes)
  setupErrorLogging(app);
  
  // Set up global error handler but NOT the 404 handler
  // This allows Vite/static file middleware to handle client-side routes
  setupErrorHandling(app);

  return { app, server };
} 