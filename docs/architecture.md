# Application Architecture

This document describes the architecture of the application after the migration to a feature-based structure.

## Overview

The application follows a feature-based architecture that separates core functionality (boilerplate, reusable components, etc.) from feature-specific code. This separation makes the codebase more maintainable, scalable, and easier to understand.

## Directory Structure

```
├── client/                   # Client-side application
│   ├── src/                  # Source code
│   │   ├── core/             # Core functionality (boilerplate)
│   │   │   ├── components/   # Reusable UI components
│   │   │   ├── hooks/        # Shared React hooks
│   │   │   ├── layout/       # Layout components
│   │   │   ├── pages/        # Core pages (auth, etc.)
│   │   │   ├── providers/    # Context providers
│   │   │   ├── ui/           # UI components (shadcn/ui)
│   │   │   ├── i18n/         # Internationalization
│   │   │   └── routes.tsx    # Route definitions
│   │   │
│   │   ├── features/         # Feature-specific code
│   │   │   ├── profile/      # Profile feature
│   │   │   ├── admin/        # Admin feature
│   │   │   ├── info/         # Info feature
│   │   │   └── hello-world/  # Hello World feature (example)
│   │   │
│   │   ├── pages/            # Legacy page components
│   │   └── hooks/            # Legacy hooks
│   │
│   ├── public/               # Static assets
│   └── ...
│
├── server/                   # Server-side application
│   ├── core/                 # Core server functionality
│   │   ├── middleware/       # Server middleware
│   │   │   ├── common.ts     # Common middleware
│   │   │   ├── error-handler.ts # Error handling middleware
│   │   │   ├── logging.ts    # Logging middleware
│   │   │   └── auth.ts       # Authentication middleware
│   │   │
│   │   ├── auth.ts           # Authentication logic
│   │   ├── db.ts             # Database setup
│   │   ├── logger.ts         # Logging setup
│   │   └── routes.ts         # API route registration
│   │
│   ├── features/             # Feature-specific API endpoints
│   │   ├── profile/          # Profile feature API
│   │   ├── admin/            # Admin feature API
│   │   └── info/             # Info feature API
│   │
│   └── ...
│
├── shared/                   # Shared code between client and server
│   ├── schema.ts             # Type definitions and schemas
│   └── ...
│
└── docs/                     # Documentation
    ├── migration-plan.md     # Migration plan
    └── architecture.md       # This file
```

## Core Module

The core module contains all shared functionality that is used across multiple features. It includes:

- **UI Components**: Basic UI components from shadcn/ui
- **Layout Components**: Navbar, Footer, and the CoreLayout
- **Authentication**: Auth hooks, components, and providers
- **Routing**: Centralized route definitions
- **Providers**: Context providers for global state
- **Internationalization**: i18n setup and translations

## Feature Modules

Each feature module contains all the code related to a specific feature. This includes:

- **Components**: Feature-specific UI components
- **Pages**: Page components for the feature
- **Hooks**: Feature-specific hooks
- **API**: Server-side API endpoints for the feature

Features are self-contained and only depend on the core module, not on other features. This ensures separation of concerns and prevents circular dependencies.

## Routing

Routes are defined in `client/src/core/routes.tsx` and organized by category:

- **Core Routes**: Authentication-related routes
- **Feature Routes**: Feature-specific routes
- **Main Routes**: Main application routes

Each feature can define its own routes, which are then imported and used in the central routes file.

## Server Architecture

The server follows a similar architecture, with core functionality separated from feature-specific code:

- **Core**: Authentication, database setup, logging, middleware
- **Features**: Feature-specific API endpoints
- **Middleware**: Centralized middleware for request/response handling

API endpoints follow a RESTful structure, organized by feature:

- `/api/profile/` - Profile feature endpoints
- `/api/admin/` - Admin feature endpoints
- `/api/info/` - Info feature endpoints

## Adding New Features

To add a new feature:

1. Create a new directory under `client/src/features/`
2. Add components, pages, and hooks specific to the feature
3. Add routes for the feature in `client/src/core/routes.tsx`
4. Create API endpoints under `server/features/` if needed
5. Register API routes in `server/core/routes.ts`

See the Hello World feature (`client/src/features/hello-world/`) for an example of a properly structured feature.

## Best Practices

- Keep features independent from each other
- Use the core module for shared functionality
- Keep related code together in the same feature directory
- Follow the established pattern for naming and organization
- Document feature-specific code with README files
- Use proper error handling and logging

## Migration Status

The migration from the old architecture to the new feature-based architecture is completed. All functionality now follows the new structure, and the application has been tested to ensure it works as expected. 