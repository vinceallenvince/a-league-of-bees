# Adding New Features

This guide explains how to add new features to the application following our feature-based architecture.

## Feature Structure

Each feature should be self-contained in its own directory under `client/src/features/` with the following structure:

```
feature-name/
├── components/    # Feature-specific components
├── pages/         # Page components for the feature
├── hooks/         # Feature-specific hooks (optional)
├── types.ts       # Type definitions (optional)
├── utils.ts       # Utility functions (optional)
├── index.ts       # Public API exports (optional)
└── README.md      # Documentation
```

## Step-by-Step Guide

### 1. Create the Feature Directory

Create a new directory for your feature under `client/src/features/`:

```bash
mkdir -p client/src/features/my-feature/components
mkdir -p client/src/features/my-feature/pages
```

### 2. Create Feature Components

Create components specific to your feature in the `components/` directory:

```tsx
// client/src/features/my-feature/components/feature-card.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/ui/card';

export function FeatureCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>My Feature</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Feature content goes here.</p>
      </CardContent>
    </Card>
  );
}
```

### 3. Create Feature Pages

Create page components for your feature in the `pages/` directory:

```tsx
// client/src/features/my-feature/pages/feature-page.tsx
import React from 'react';
import { FeatureCard } from '../components/feature-card';

export default function FeaturePage() {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">My Feature</h1>
      <FeatureCard />
    </div>
  );
}
```

### 4. Add Routes

Add routes for your feature in `client/src/core/routes.tsx`:

```tsx
// Import your feature page
const FeaturePage = lazy(() => import("@/features/my-feature/pages/feature-page"));

// Add to featureRoutes
export const featureRoutes = {
  // ... existing features
  myFeature: [
    <Route key="my-feature" path="/my-feature" component={FeaturePage} />,
  ],
};

// Update getAllRoutes function
export const getAllRoutes = () => [
  ...coreRoutes,
  ...featureRoutes.profile,
  ...featureRoutes.admin,
  ...featureRoutes.info,
  ...featureRoutes.myFeature, // Add this line
  ...mainRoutes,
  notFoundRoute,
];
```

### 5. Add Navigation Link

Add a link to your feature in the Navbar or other navigation components:

```tsx
// In client/src/core/components/navbar.tsx
<Link 
  href="/my-feature" 
  className={location.pathname === "/my-feature" ? "text-foreground font-bold" : "text-muted-foreground font-normal"}
  aria-current={location.pathname === "/my-feature" ? "page" : undefined}
>
  My Feature
</Link>
```

### 6. Add Translations

Add translations for your feature in the i18n files:

```json
// In client/src/core/i18n/translations/en.json
{
  "navigation": {
    // ... existing navigation items
    "myFeature": "My Feature"
  },
  "myFeature": {
    "title": "My Feature",
    "description": "This is my new feature."
  }
}
```

### 7. Add Server-side API (if needed)

If your feature requires server-side API endpoints:

1. Create a feature directory in the server:

```bash
mkdir -p server/features/my-feature
```

2. Create routes file:

```typescript
// server/features/my-feature/routes.ts
import { Router, Request, Response } from 'express';
import logger from '../../core/logger';

const router = Router();

// Get feature data
router.get('/', async (req: Request, res: Response) => {
  try {
    // Implementation goes here
    res.json({ message: 'My feature data' });
  } catch (error) {
    logger.error('Error in my feature', { error });
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

export default router;
```

3. Register the routes in `server/core/routes.ts`:

```typescript
import myFeatureRoutes from '../features/my-feature/routes';

export function registerRoutes(app: Express): Server {
  // ... existing code
  
  try {
    // ... existing routes
    app.use('/api/my-feature', myFeatureRoutes);
    
    // Update logging
    logger.info('Routes registered successfully', {
      routes: ['/api/profile', '/api/admin', '/api/info', '/api/my-feature']
    });
  } catch (error) {
    // ... error handling
  }
  
  // ... rest of the function
}
```

### 8. Add Documentation

Create a README.md file for your feature:

```markdown
# My Feature

Description of what this feature does and how it works.

## Components

- **FeatureCard**: Display feature information in a card format

## Pages

- **FeaturePage**: Main page for the feature

## API Endpoints

- `GET /api/my-feature`: Get feature data

## Usage

The feature is accessible at the `/my-feature` route.
```

## Best Practices

1. **Follow the Pattern**: Use the Hello World feature as a reference
2. **Keep Features Independent**: Avoid dependencies between features
3. **Use Core Functionality**: Leverage the core module for shared functionality
4. **Add Tests**: Write tests for your feature components and API endpoints
5. **Document Everything**: Add comments and documentation to explain your code
6. **Error Handling**: Implement proper error handling in both client and server code
7. **Responsive Design**: Ensure your feature works on all devices

## Example

For a complete example of a properly structured feature, refer to the Hello World feature:

- Client-side: `client/src/features/hello-world/`
- Server-side: `server/features/info/` (for API endpoints)

The Hello World feature demonstrates:
- Component organization
- Page structure
- Route configuration
- Translations
- Documentation
- Error handling 