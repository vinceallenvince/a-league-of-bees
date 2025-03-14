# Core Module

This directory contains core functionality that is shared across the application.

## Directories

- **auth**: Authentication-related functionality
- **components**: Reusable components used throughout the application
- **hooks**: Custom React hooks
- **i18n**: Internationalization setup
- **layout**: Layout components
- **pages**: Core pages (auth, etc.)
- **providers**: React context providers
- **ui**: UI components (shadcn/ui)

## Routes Organization

The application's routes are organized in the `routes.tsx` file. Routes are grouped by category:

- **Core Routes**: Authentication and other core functionality
- **Feature Routes**: Routes specific to features (profile, admin, info)
- **Main Routes**: Main application pages

### Adding New Routes

To add a new route:

1. Create your page component in the appropriate directory:
   - Core functionality: `core/pages/`
   - Feature-specific: `features/[feature-name]/pages/`

2. Import and add the route to the appropriate section in `core/routes.tsx`:

```tsx
// For a new feature
export const featureRoutes = {
  // ... existing features
  newFeature: [
    <Route key="new-page" path="/new-page" component={NewPage} />,
  ],
};

// OR add to an existing feature
featureRoutes.existingFeature.push(
  <Route key="new-page" path="/existing-feature/new-page" component={NewPage} />
);
```

3. If you're adding a completely new feature category, make sure to update the `getAllRoutes()` function as well:

```tsx
export const getAllRoutes = () => [
  ...coreRoutes,
  ...featureRoutes.profile,
  ...featureRoutes.admin,
  ...featureRoutes.info,
  ...featureRoutes.newFeature, // Add this line
  ...mainRoutes,
  notFoundRoute,
];
```

## Usage

Import the routes in your application:

```tsx
import { getAllRoutes } from "@/core/routes";

// In your Switch component:
<Switch>
  {getAllRoutes()}
</Switch>
```

## Structure

- `auth/` - Authentication related functionality
- `components/` - Reusable UI components that are used across features
- `hooks/` - Custom React hooks for core functionality
- `layout/` - Layout components like NavBar, Footer, etc.
- `providers/` - Context providers for global state
- `ui/` - Base UI components (shadcn/ui)
- `i18n/` - Internationalization setup and configuration
- `pages/` - Core pages like login, registration, etc.

## Guidelines

- Core functionality should be generic and reusable
- Avoid adding feature-specific code to the core
- Core components should be well-documented and have clear APIs
- Ensure backward compatibility when modifying core components 