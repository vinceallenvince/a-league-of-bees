# Server Features

This directory contains all the domain-specific server functionality organized by feature.

## Structure

Each feature has its own directory:

- `profile/` - User profile management
  - `routes.ts` - Profile-specific route handlers

- `admin/` - Administrative functionality
  - `routes.ts` - Admin-specific route handlers

## Usage

Feature modules are imported and registered in the core routes:

```ts
// In server/core/routes.ts
import profileRoutes from "../features/profile/routes";
import adminRoutes from "../features/admin/routes";

// Register routes
app.use('/api/profile', profileRoutes);
app.use('/api/admin', adminRoutes);
```

## Adding New Features

To add a new feature:

1. Create a new directory in `server/features/`
2. Add route handlers and other feature-specific code
3. Register the feature's routes in `server/core/routes.ts`

## Guidelines

- Keep feature code isolated from other features
- Use core functionality for common operations
- Each feature should have its own set of routes
- Business logic should be in the service layer
- Controllers should be thin and focused on request/response handling
- If functionality is needed across features, consider moving it to core 