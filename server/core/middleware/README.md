# Server Middleware

This directory contains middleware functions used throughout the server application.

## Files

- **index.ts**: Exports all middleware and provides setup functions
- **common.ts**: Common middleware (JSON parsing, CORS, compression, etc.)
- **error-handler.ts**: Error handling middleware
- **logging.ts**: Request and response logging middleware

## Usage

The middleware is organized into two main setup functions:

### 1. Setup Regular Middleware

```typescript
import { setupMiddleware } from './middleware';

// In your app setup
const app = express();
setupMiddleware(app);
```

This sets up:
- Common middleware (JSON parsing, CORS, etc.)
- Request logging
- Response body capture for API routes

### 2. Setup Error Handling Middleware

```typescript
import { setupErrorMiddleware } from './middleware';

// After registering all routes
setupErrorMiddleware(app);
```

This sets up:
- Error logging
- 404 handler
- Global error handler

## Individual Middleware

You can also import and use individual middleware functions:

```typescript
import { captureResponseBody } from './middleware/logging';
import { errorHandler } from './middleware/error-handler';

// Use specific middleware
app.use('/api', captureResponseBody);
app.use(errorHandler);
```

## Adding New Middleware

To add new middleware:

1. Create a new file in this directory or add to an existing file
2. Export the middleware function
3. Update the index.ts file to re-export the middleware
4. Add the middleware to the appropriate setup function if needed 