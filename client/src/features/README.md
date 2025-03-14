# Features

This directory contains all the domain-specific features of the application. Each feature is a self-contained module that includes its own components, hooks, and services.

## Structure

Each feature should follow this structure:

```
features/
  ├── feature-name/
  │   ├── components/    # UI components specific to this feature
  │   ├── hooks/         # Custom React hooks for this feature
  │   ├── services/      # API services related to this feature
  │   ├── types/         # TypeScript types and interfaces
  │   ├── utils/         # Utility functions
  │   ├── index.ts       # Public API exports
  │   └── routes.tsx     # Feature-specific routes
```

## Usage

Features should be imported using the path alias:

```tsx
// Import a feature component
import { FeatureComponent } from "@/features/feature-name/components/FeatureComponent";

// Import a feature hook
import { useFeature } from "@/features/feature-name/hooks/useFeature";
```

Or through the public API:

```tsx
import { FeatureComponent, useFeature } from "@/features/feature-name";
```

## Guidelines

- Keep features self-contained and independent of each other
- Feature-specific components should not be imported by other features directly
- If multiple features need similar functionality, consider moving it to the core
- Each feature should have its own routes defined in a routes.tsx file
- Features should export their public API through index.ts 