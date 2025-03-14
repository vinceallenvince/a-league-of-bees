import expressWinston from 'express-winston';
import { Express, Request, Response, NextFunction } from 'express';
import logger from '../logger';

/**
 * Configure request logging middleware
 */
export function setupRequestLogging(app: Express): void {
  // Log all requests
  app.use(expressWinston.logger({
    winstonInstance: logger,
    meta: true,
    msg: 'HTTP {{req.method}} {{req.url}} {{res.statusCode}} {{res.responseTime}}ms',
    expressFormat: false,
    colorize: false,
    // Don't log body for security reasons by default
    // Enable selectively for specific routes if needed
    requestWhitelist: ['url', 'method', 'httpVersion', 'originalUrl', 'query'],
    // Skip logging for static assets and health checks if needed
    ignoredRoutes: ['/health', '/favicon.ico'],
    // Skip binary responses
    ignoreRoute: (req: Request, res: Response) => {
      const contentType = res.get('Content-Type') || '';
      return contentType.includes('image') || 
             contentType.includes('font') || 
             contentType.includes('audio') || 
             contentType.includes('video');
    }
  }));
}

/**
 * Configure error logging middleware
 */
export function setupErrorLogging(app: Express): void {
  app.use(expressWinston.errorLogger({
    winstonInstance: logger,
    msg: 'HTTP {{req.method}} {{req.url}} {{err.message}} {{res.statusCode}}',
    // Include stack trace in the metadata
    dumpExceptions: true,
    showStack: true
  }));
}

/**
 * Middleware to capture response body for logging purposes
 * This is useful for debugging API responses
 */
export function captureResponseBody(req: Request, res: Response, next: NextFunction): void {
  // Skip for non-api routes, streaming responses, and binary content
  if (!req.path.startsWith('/api')) {
    return next();
  }
  
  const contentType = res.get('Content-Type') || '';
  if (contentType.includes('stream') || 
      contentType.includes('image') || 
      contentType.includes('font') ||
      contentType.includes('audio') ||
      contentType.includes('video') ||
      contentType.includes('application/octet-stream')) {
    return next();
  }

  // Skip for large responses to avoid memory issues
  const contentLength = parseInt(res.get('Content-Length') || '0', 10);
  if (contentLength > 10 * 1024 * 1024) { // Skip if > 10MB
    return next();
  }

  // Store the original methods
  const originalSend = res.send;
  const originalJson = res.json;
  const originalEnd = res.end;
  
  // Capture for send
  res.send = function(body): Response {
    try {
      res.locals.responseBody = body;
      
      // Only log responses with status codes >= 400 (errors) or debug mode
      if (res.statusCode >= 400 || process.env.DEBUG) {
        const safeBody = sanitizeResponse(
          typeof body === 'string' ? 
            // Try to parse JSON string
            body.startsWith('{') || body.startsWith('[') ? 
              JSON.parse(body) : 
              body : 
            body
        );

        logger.debug('Response body captured', {
          method: req.method,
          url: req.originalUrl,
          statusCode: res.statusCode,
          responseBody: safeBody
        });
      }
    } catch (err) {
      // Don't let errors in our logging affect the response
      logger.error('Error capturing response body', { error: err });
    }
    
    return originalSend.apply(res, arguments as any);
  };
  
  // Handle JSON responses
  res.json = function(body): Response {
    try {
      res.locals.responseBody = body;
      
      if (res.statusCode >= 400 || process.env.DEBUG) {
        logger.debug('Response body captured (json)', {
          method: req.method,
          url: req.originalUrl,
          statusCode: res.statusCode,
          responseBody: sanitizeResponse(body)
        });
      }
    } catch (err) {
      logger.error('Error capturing JSON response body', { error: err });
    }
    
    return originalJson.apply(res, arguments as any);
  };
  
  next();
}

/**
 * Remove sensitive data from logged responses
 */
function sanitizeResponse(data: any): any {
  if (!data) return data;
  
  // If it's a string, return it directly
  if (typeof data === 'string') return data;
  
  // If it's not an object, return it directly
  if (typeof data !== 'object') return data;
  
  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => sanitizeResponse(item));
  }
  
  // Create a copy to avoid modifying the original
  const sanitized = { ...data };
  
  // Remove sensitive fields
  const sensitiveFields = [
    'password', 'token', 'secret', 'apiKey', 'api_key',
    'authorization', 'auth', 'credentials', 'credit_card'
  ];
  
  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }
  
  // Recursively sanitize nested objects
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeResponse(sanitized[key]);
    }
  }
  
  return sanitized;
} 