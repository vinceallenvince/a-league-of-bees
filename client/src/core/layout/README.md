# Core Layout Components

This directory contains layout components that provide the overall structure for the application.

## Components

- **CoreLayout**: Main layout component that provides a consistent structure:
  - Navbar at the top
  - Main content area
  - Footer at the bottom
  - Toaster for notifications

## Usage

```tsx
import CoreLayout from "@/core/layout/CoreLayout";

function App() {
  return (
    <CoreLayout>
      {/* Application content goes here */}
    </CoreLayout>
  );
}
```

## Adding New Layouts

If you need to create additional layouts for specific parts of the application:

1. Create a new component in this directory (e.g., `AdminLayout.tsx`)
2. Follow the same pattern as CoreLayout
3. Import and use it in your application where needed 