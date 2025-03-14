import { Express } from 'express';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';

/**
 * Setup common middleware for the Express app
 */
export function setupCommonMiddleware(app: Express): void {
  // Parse JSON request bodies
  app.use(express.json());
  
  // Parse URL-encoded request bodies
  app.use(express.urlencoded({ extended: false }));
  
  // Enable CORS
  app.use(cors());
  
  // Add security headers with Helmet
  app.use(helmet({
    // Content Security Policy
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https://via.placeholder.com'],
        connectSrc: ["'self'", 'https://api.example.com'],
      },
    },
    // Disable X-Powered-By header
    hidePoweredBy: true,
  }));
  
  // Compress responses
  app.use(compression());
} 