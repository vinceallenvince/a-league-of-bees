# Info Feature

This feature contains static informational pages about the application.

## Structure

- `pages/` - Contains informational pages
  - `about-page.tsx` - About page with application information
  - `contact-page.tsx` - Contact information page
- `index.ts` - Exports public API

## Usage

You can import info pages directly:

```tsx
import AboutPage from "@/features/info/pages/about-page";
import ContactPage from "@/features/info/pages/contact-page";
```

Or through the public API:

```tsx
import { AboutPage, ContactPage } from "@/features/info";
``` 