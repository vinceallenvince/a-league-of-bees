# Profile Feature

This feature handles user profile management functionality.

## Structure

- `components/` - Contains profile-specific components
  - `profile-form.tsx` - Form for users to update their profile information
- `pages/` - Contains profile-related pages
  - `profile-page.tsx` - Main profile page
- `index.ts` - Exports public API

## Usage

You can import profile components directly:

```tsx
import { ProfileForm } from "@/features/profile/components/profile-form";
```

Or through the public API:

```tsx
import { ProfileForm, ProfilePage } from "@/features/profile";
``` 