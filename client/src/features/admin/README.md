# Admin Feature

This feature provides administrative functionality for managing users and application settings.

## Structure

- `pages/` - Contains admin-related pages
  - `admin-page.tsx` - Main admin page for user management
- `index.ts` - Exports public API

## Usage

You can import admin components directly:

```tsx
import AdminPage from "@/features/admin/pages/admin-page";
```

Or through the public API:

```tsx
import { AdminPage } from "@/features/admin";
```

## Access Control

The admin feature is only accessible to users with the `isAdmin` flag set to `true`.
The UI itself enforces this by checking the current user's admin status. 