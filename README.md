# Web Authentication Scaffold

A modern web authentication scaffold with OTP and Magic Link authentication options. Use it as a starter app to build more feature-rich web applications.

## Features

- OTP (One-Time Password) authentication
- Magic Link authentication
- User management
- Admin role management
- Session management
- Structured logging

For detailed product specifications, see the [product-specs.md](./specs/product-specs.md) file.

## Accessibility

This application is built with accessibility as a core principle, conforming to WCAG 2.1 Level AA standards and Section 508 requirements.

### Key Accessibility Features

- **Keyboard Navigation**: All interactive elements are fully navigable without a mouse
- **Screen Reader Support**: Compatible with NVDA, VoiceOver, and JAWS
- **Visual Design**: 
  - Minimum 4.5:1 contrast ratio for text
  - Minimum 16px font size for body text
  - Clear focus states for all interactive elements
  - Support for 200% text resizing

### Technical Implementation

- Automated accessibility testing with jest-axe
- ESLint jsx-a11y rules enforcement
- Proper semantic HTML structure with appropriate ARIA attributes
- Accessible form controls with clear labels and error messages

### Validation Process

- Continuous automated testing during development
- Manual testing with assistive technologies
- Regular accessibility audits

For detailed accessibility specifications, see the [accessibility-specs.md](./specs/accessibility-specs.md) file.

## Localization

This application supports internationalization and localization to make it accessible to users from different regions and language backgrounds.

### Key Localization Features

- **Multi-language Support**: Interface text is available in multiple languages
- **i18next Integration**: Uses i18next and react-i18next for translation management
- **Language Detection**: Automatically detects user's preferred language
- **Locale-aware Formatting**: Dates, numbers, and currencies are formatted according to the user's locale

### Implementation Details

- Translation keys stored in structured JSON files
- Language switching without page reload
- Right-to-left (RTL) text support for appropriate languages
- Pluralization rules handling

For detailed localization guidelines, see the [localization-specs.md](./specs/localization-specs.md) file.

## Logging System

This application uses Winston for structured logging, capturing various levels of log messages and outputting them to multiple destinations. Key features include:

- **Log Levels**: error, warn, info, debug
- **Log Outputs**: Console, error.log, combined.log, exceptions.log, rejections.log
- **Log Format**: JSON format with timestamp, level, message, and additional context

For detailed logging specifications, see the [logging-specs.md](./specs/logging-specs.md) file.

## Development

### Prerequisites

- Node.js 16+
- npm or yarn

### Setup

1. Clone the repository
2. Install dependencies: `npm install`
   - If you face issues with company npm registry, use: `npm install --registry=https://registry.npmjs.org/`
   - Note: A local `.npmrc` file is included that configures npm to use the public registry for this project
3. Start the development server: `npm run dev`

### Environment Variables

- `NODE_ENV`: Set to 'production' for production mode
- `SENDGRID_API_KEY`: SendGrid API key for email sending
- `AUTH_METHOD`: 'otp' or 'magic-link'
- `BASE_URL`: Base URL for magic links
- `MAX_OTP_ATTEMPTS`: Maximum OTP attempts before cooldown
- `OTP_COOLDOWN_HOURS`: Cooldown hours after max attempts

## Testing

### Unit Tests

This project includes comprehensive unit tests covering all core functionality:

- **Authentication Tests**: Verify OTP and Magic Link flows work correctly
- **User Management Tests**: Ensure user creation, updating, and deletion work properly
- **Role-based Access Tests**: Confirm proper enforcement of role-based permissions
- **Session Management Tests**: Validate session creation, validation, and expiration

### Running Tests

- Run all tests: `npm test`
- Run with coverage: `npm run test:coverage`
- Run specific test suite: `npm test -- --testPathPattern=auth`

### Test Structure

Tests are organized following the application structure:
- `__tests__/auth/`: Authentication functionality tests
- `__tests__/users/`: User management tests
- `__tests__/roles/`: Role and permission tests
- `__tests__/sessions/`: Session management tests

### Test Suite Overview

For a comprehensive overview of all test suites, their expectations, and current coverage metrics, see the [test-suite-overview.md](./tests/test-suite-overview.md) file. This document provides detailed information about:

- All test suites and their test cases
- Current test coverage statistics
- Areas needing improvement
- Recent coverage improvements

### Test Mocks

Tests use mocks for:
- Email services
- Database connections
- External APIs

## License

MIT 