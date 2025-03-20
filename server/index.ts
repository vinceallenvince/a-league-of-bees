// Load environment variables from .env file
import * as dotenv from 'dotenv';
dotenv.config();

import { createApp } from "./core";
import { setupVite, serveStatic } from "./vite";
import logger from "./core/logger";
import { createServer } from "net";
import { initializeTournamentJobs } from './features/tournament/jobs';

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const HMR_PORT = process.env.HMR_PORT ? Number(process.env.HMR_PORT) : 24678;

// Check if a port is in use
function isPortInUse(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer()
      .once('error', () => {
        resolve(true);
      })
      .once('listening', () => {
        server.close();
        resolve(false);
      })
      .listen(port, '0.0.0.0');
  });
}

async function startServer() {
  const { app, server } = createApp();

  // Check if HMR port is in use
  if (process.env.NODE_ENV !== 'production' && await isPortInUse(Number(HMR_PORT))) {
    logger.warn(`HMR WebSocket port ${HMR_PORT} is already in use. Try using a different port by setting HMR_PORT environment variable.`, { service: 'web-service' });
  }

  // Set up Vite for development or serve static files for production
  if (process.env.NODE_ENV === 'production') {
    // In production, API routes are handled before static files
    // This allows both API and client-side routes to work
    serveStatic(app);
  } else {
    try {
      // In development, Vite needs to handle all non-API routes
      await setupVite(app, server);
    } catch (error) {
      logger.error('Failed to set up Vite', { error, service: 'web-service' });
      if ((error as Error).message.includes('Port is already in use')) {
        logger.error('Try restarting the application or use a different HMR port by setting HMR_PORT environment variable', { service: 'web-service' });
      }
      throw error;
    }
  }

  // Initialize background jobs
  if (process.env.ENABLE_JOBS !== 'false') {
    try {
      initializeTournamentJobs();
      logger.info('Background jobs initialized successfully', { service: 'jobs' });
    } catch (error) {
      logger.error('Failed to initialize background jobs', { error, service: 'jobs' });
    }
  } else {
    logger.info('Background jobs disabled via ENABLE_JOBS environment variable', { service: 'jobs' });
  }

  // Start the server - listen on all interfaces to be accessible externally
  server.listen(PORT, '0.0.0.0', () => {
    logger.info(`Server is running on port ${PORT}`, { service: 'web-service' });
  });
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error });
  // Don't exit process in production to maintain uptime,
  // but log the error for investigation
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection', { reason });
});

// Start the server
startServer().catch((error) => {
  logger.error('Failed to start server', { error });
  process.exit(1);
});
