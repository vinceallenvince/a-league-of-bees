# Hello World Feature

This is a simple example feature that demonstrates the new feature-based architecture. It's designed to serve as a proof of concept and template for creating new features.

## Directory Structure

```
hello-world/
├── components/          # Feature-specific components
│   └── hello-world-card.tsx
├── pages/               # Feature pages
│   └── hello-world-page.tsx
└── README.md            # Feature documentation
```

## Components

- **HelloWorldCard**: An interactive card component that demonstrates:
  - Using core UI components
  - Managing local state
  - Using toast notifications
  - Using translations

## Pages

- **HelloWorldPage**: A simple page that demonstrates:
  - Feature page structure
  - Composing feature components
  - Using translations

## Usage

The Hello World feature is accessible at the `/hello-world` route.

## Adding Similar Features

To create a new feature following this pattern:

1. Create a new directory under `features/`
2. Add component-specific files in a `components/` subdirectory
3. Add page components in a `pages/` subdirectory
4. Add the page to the route configuration in `core/routes.tsx`
5. Add a link to the navigation if needed

## Translations

Translations for this feature are stored in the i18n files. The feature uses the following translation keys:

- `helloWorld.title`: The main page title
- `helloWorld.description`: The page description
- `helloWorld.cardTitle`: The card title
- `helloWorld.cardDescription`: The card description
- `helloWorld.counterValue`: The counter value text
- `helloWorld.counterUpdated`: Toast notification title
- `helloWorld.newValue`: Toast notification description
- `helloWorld.increment`: Button text 