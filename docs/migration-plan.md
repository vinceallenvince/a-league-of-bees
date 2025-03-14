# Migration Plan

This document outlines the step-by-step process to migrate from the current architecture to the new architecture that separates boilerplate features from main application UX.

## Phase 1: Directory Structure Setup (Completed)

1. Create the following directories: (Completed)
   - `client/src/core`
   - `client/src/features`
   - `server/core` (if not already present)
   - `server/features` (if not already present)

2. Create README files in each directory explaining its purpose (Completed)
   - Add domain-specific documentation
   - Add examples of how to use the directories

3. Update tsconfig.json to add path aliases (Completed)
   - Add paths for core, features, and pages
   - Ensure all paths are properly configured in build tools

## Phase 2: Core Module Migration

1. **Authentication** (Completed)
   - Create `client/src/core/auth` directory
   - Move authentication hooks (`useAuth.ts`) to `client/src/core/hooks/useAuth.ts`
   - Move authentication components (`otp-form.tsx`) to `client/src/core/components/auth/`
   - Move authentication pages to `client/src/core/pages/`

2. **Layout** (Completed)
   - Create `client/src/core/layout` directory
   - Move NavBar from `client/src/components/navbar.tsx` to `client/src/core/components/navbar.tsx`
   - Move Footer from `client/src/components/Footer.jsx` to `client/src/core/components/footer.tsx`
   - Create CoreLayout component (completed)

3. **UI Components** (Completed)
   - Move shadcn/ui components from `client/src/components/ui` to `client/src/core/ui`
   - Update all imports across the codebase

4. **Internationalization** (Completed)
   - Move i18n setup from `client/src/i18n` to `client/src/core/i18n`
   - Move LanguageSwitcher to `client/src/core/components/language-switcher.tsx`

5. **Providers** (Completed)
   - Create `client/src/core/providers` directory
   - Move auth provider to `client/src/core/providers/auth-provider.tsx`
   - Add other providers as needed

## Phase 3: Feature Creation (Completed)

1. Identify main application features based on product specs: (Completed)
   - User Profiles
   - Admin Management
   - Info Pages (About, Contact)

2. For each feature: (Completed)
   - Create feature directory (e.g., `client/src/features/profile`)
   - Move relevant components, hooks, and services
   - Create index.ts that exports public API

3. Update all imports to use new feature paths (Partially Completed)
   - The new feature files are created with updated imports
   - Original files are still in place and need to be removed after testing

## Phase 4: Server-side Restructuring (Completed)

1. **Core Server** (Completed)
   - Create `server/core` directory
   - Move authentication logic to `server/core/auth.ts`
   - Move database setup to `server/core/db.ts`
   - Move email services to `server/core/email.ts`

2. **Feature API Endpoints** (Completed)
   - Create `server/features` directory
   - Create feature-specific route handlers
   - Update imports in server.ts/index.ts

## Phase 5: Update Application Entry Points (Completed)

This phase is divided into smaller sub-phases to reduce risk and allow for incremental testing:

### Phase 5.1: Client-side Core Layout Integration (Completed)

1. Create CoreLayout component (Completed)
   - Implement layout with Navbar, Footer, and content area
   - Add Toaster for notifications

2. Update App.tsx to use CoreLayout (Completed)
   - Keep existing route imports for now
   - Test to ensure basic layout and functionality works

### Phase 5.2: Client-side Route Reorganization (Completed)

1. Update route imports in App.tsx (Completed)
   - Update imports to use core pages for auth-related pages
   - Update imports to use feature-specific pages
   - Organize routes into logical sections (core, features, etc.)

2. Create route organization file (Completed)
   - Create `core/routes.tsx` to centralize route definitions
   - Separate routes into core, features, and other categories
   - Add helper function to get all routes as a flat array
   - Document the routes organization and how to add new routes

### Phase 5.3: Server-side Middleware Reorganization (Completed)

1. Reorganize server middleware (Completed)
   - Create `server/core/middleware` directory with specialized files:
     - `common.ts` for common middleware (JSON parsing, CORS, etc.)
     - `error-handler.ts` for error handling middleware
     - `logging.ts` for request/response logging (already migrated)
     - `index.ts` to export all middleware with setup functions
   - Update imports in server/core/index.ts
   - Simplify the application setup process

### Phase 5.4: Server-side Route Updates (Completed)

1. Update main routes file (Completed)
   - Create centralized auth middleware in `core/middleware/auth.ts`
   - Refactor profile and admin routes to use centralized middleware
   - Add new info routes for application info and health status
   - Add proper error handling and logging to all routes
   - Remove old routes.ts file

## Phase 6: Test Feature Implementation (Completed)

1. Create a "Hello World" feature as a proof of concept (Completed)
   - Create `client/src/features/hello-world` directory with components and pages subdirectories
   - Implement HelloWorldCard component showcasing core UI components and state management
   - Create HelloWorldPage to demonstrate feature page structure
   - Add comprehensive documentation in README.md

2. Integrate with application architecture (Completed)
   - Add route for Hello World feature in core/routes.tsx
   - Add navigation link in the Navbar component
   - Add translations for the feature in i18n files
   - Demonstrate using Toast notifications and other core functionality

## Phase 7: Testing and Finalization (Completed)

1. Update tests to work with new structure (Completed)
   - Update import paths in test files
   - Update mocks to reflect new architecture
   - Fix useAuth hook imports in tests

2. Create comprehensive documentation (Completed)
   - Create `architecture.md` with detailed architecture overview
   - Create `adding-features.md` guide for adding new features
   - Document directory structure and code organization
   - Provide best practices for feature development

## Estimated Timeline (Story Points)

Using the Fibonacci scale (1, 2, 3, 5, 8, 13, 21) for story point estimation:

- **Phase 1**: 2 points
- **Phase 2**: 5 points
- **Phase 3**: 5 points
- **Phase 4**: 3 points
- **Phase 5**: 5 points
  - **Phase 5.1**: 1 point
  - **Phase 5.2**: 1 point
  - **Phase 5.3**: 1 point
  - **Phase 5.4**: 2 points
- **Phase 6**: 2 points
- **Phase 7**: 3 points

**Total Story Points**: 25

*Note: Story points reflect complexity and effort, not necessarily calendar time. A team's velocity will determine how many points can be completed in a given sprint.*

## Risk Mitigation

- Perform incremental changes with frequent testing
- Use feature branches for major changes
- Create a comprehensive test suite before beginning
- Maintain backwards compatibility during transition
- Consider using a feature flag system for gradual rollout 

## Conclusion

The migration has been successfully completed on 2025-03-09. All application code now follows the feature-based architecture, with core functionality separated from feature-specific code. Tests have been updated to work with the new structure, and comprehensive documentation has been created to guide future development. 

## Directory Structure Comparison

### Before Migration

```
├── client/                   # Client-side application
│   ├── src/                  # Source code
│   │   ├── components/       # All UI components
│   │   │   ├── ui/           # UI library components
│   │   │   ├── navbar.tsx    # Navigation bar
│   │   │   ├── footer.jsx    # Footer component
│   │   │   └── ...           # Other components
│   │   │
│   │   ├── pages/            # Page components
│   │   │   ├── auth-page.tsx # Auth page
│   │   │   ├── profile.tsx   # Profile page
│   │   │   ├── admin.tsx     # Admin page
│   │   │   └── ...           # Other pages
│   │   │
│   │   ├── hooks/            # React hooks
│   │   │   ├── useAuth.ts    # Authentication hook
│   │   │   ├── useToast.ts   # Toast notifications hook
│   │   │   └── ...           # Other hooks
│   │   │
│   │   ├── i18n/             # Internationalization
│   │   │   ├── index.ts      # i18n setup
│   │   │   └── translations/ # Translation files
│   │   │
│   │   ├── App.tsx           # Main application component
│   │   └── index.tsx         # Entry point
│   │
│   ├── public/               # Static assets
│   └── ...
│
├── server/                   # Server-side application
│   ├── index.ts              # Server entry point
│   ├── routes.ts             # API routes
│   ├── auth.ts               # Authentication logic
│   ├── db.ts                 # Database setup
│   ├── middleware/           # Server middleware
│   │   ├── logging.ts        # Logging middleware
│   │   └── ...               # Other middleware
│   └── ...
│
└── shared/                   # Shared code
    ├── schema.ts             # Type definitions
    └── ...
```

### After Migration

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
│   │   ├── App.tsx           # Main application component
│   │   └── index.tsx         # Entry point
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
│   └── index.ts              # Server entry point
│
├── shared/                   # Shared code between client and server
│   ├── schema.ts             # Type definitions and schemas
│   └── ...
│
└── docs/                     # Documentation
    ├── migration-plan.md     # Migration plan
    ├── architecture.md       # Architecture documentation
    └── adding-features.md    # Guide for adding features
``` 