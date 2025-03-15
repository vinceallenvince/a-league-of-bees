# Test Suite Overview

This document provides a concise overview of all test suites and their expectations in the WebAuthScaffold project.

## Server Tests

### User Management

Tests for user creation, lookup, and admin role management functionality.

#### User Creation
- ✓ should automatically make the first user an admin
- ✓ should not make subsequent users admins
- ✓ should create user with minimal required fields
- ✓ should create user with provided optional fields

#### User Lookup
- ✓ should find user by email
- ✓ should return undefined for non-existent email
- ✓ should find user by ID
- ✓ should return undefined for non-existent ID
- ✓ should find distinct users by email when multiple users exist

#### Admin Approval
- ✓ should allow an admin to approve another user as admin
- ✓ should throw error if approver is not an admin
- ✓ should throw error if user to be approved does not exist
- ✓ should throw error if approver does not exist
- ✓ should allow multiple admins in the system
- ✓ should allow newly approved admin to approve other users

### OTP Verification

Tests for OTP (One-Time Password) generation, verification, and security features.

#### Verify OTP
- ✓ should accept a valid OTP that is within expiry time
- ✓ should reject an OTP when expired
- ✓ should reject an invalid OTP
- ✓ should reject when no OTP has been requested
- ✓ should track attempt count for failed verifications
- ✓ should implement rate limiting after max attempts

#### OTP Request
- ✓ should generate and store a new OTP for existing users
- ✓ should create a new user if requesting OTP for unknown email
- ✓ should send an email with the OTP
- ✓ should reject requests during cooldown period
- ✓ should allow a new OTP after cooldown period expires

### Authentication

Tests for the authentication system and related API endpoints.

#### OTP Authentication
- ✓ should accept a valid OTP that is within expiry time
- ✓ should reject expired OTPs
- ✓ should reject invalid OTPs
- ✓ should clear OTP and update last login after successful verification
- ✓ should create session for user after successful verification

#### Magic Link Authentication
- ✓ should generate a secure token for the magic link
- ✓ should send an email with the magic link
- ✓ should validate the token when user clicks the link
- ✓ should create session after successful verification
- ✓ should reject invalid or expired tokens

#### Session Management
- ✓ should create session with user ID after successful authentication
- ✓ should clear session on logout
- ✓ should provide user information for authenticated sessions
- ✓ should reject requests for user information without authentication

### Tournament Management

Tests for tournament creation, participation, and related functionality.

#### Tournament Models
- ✓ should create a tournament with valid data
- ✓ should enforce foreign key constraint on creator_id
- ✓ should create admin approval with valid data

#### Tournament Participants
- ✓ should create a tournament participant with valid data
- ✓ should enforce foreign key constraints
- ✓ should update participant status

#### Tournament Scores
- ✓ should create a tournament score with valid data
- ✓ should enforce foreign key constraints
- ✓ should update tournament score

#### Notifications
- ✓ should create a notification with valid data
- ✓ should enforce foreign key constraints

## Client Tests

### Authentication Hooks

Currently contains placeholder tests to be implemented in future PRs.

#### useAuth Hook
- ✓ placeholder test (will be replaced with actual tests in future PRs)

### Auth Page

Tests for the authentication page component.

#### Auth Page Rendering and Redirection
- ✓ should render auth form when user is not logged in
- ✓ should redirect to home page when user is logged in

### OTP Form

Tests for the OTP Form component that handles email authentication and one-time password verification.

#### Email Form
- ✓ should render the email form initially
- ✓ should validate email input
- ✓ should submit email and switch to OTP form
- ✓ should show loading state during email submission
- ✓ should fallback to OTP if requestAuthMutation fails

#### Magic Link
- ✓ should show magic link sent screen when auth method is magic-link
- ✓ should allow trying a different email from magic link screen
- ✓ should allow resending magic link

#### OTP Input and Verification
- ✓ should allow changing email from OTP form
- ✓ should handle OTP input correctly
- ✓ should handle backspace navigation in OTP inputs
- ✓ should resend auth when clicking resend button
- ✓ should show loading state during OTP verification

### UI Components

Tests for UI components to ensure proper rendering and behavior.

#### Form Components
- ✓ should render form elements correctly
- ✓ should render without description
- ✓ should render custom children when no error
- ✓ should render error message when error exists
- ✓ should not render when no error and no children
- ✓ should have correct aria attributes when no error
- ✓ should have correct aria attributes when error exists
- ✓ should throw error when useFormField used outside FormField

## Test Coverage

See output from test runs in https://github.com/vinceallenvince/a-league-of-bees/actions

## Test Utilities

The project includes various test utilities and mocks:

- `test-utils.tsx`: Provides testing utilities for React components
- `setup.ts`: Sets up the test environment
- `test-db.ts`: Provides database setup and teardown for server tests
- `__mocks__`: Contains mock implementations for external dependencies

## Running Tests

To run all tests:
```bash
npm test
```

To run a specific test file:
```bash
npm test -- tests/server/user-management.test.ts
```

To run with coverage:
```bash
npm run test:coverage
```

The `test:coverage` script will run the complete test suite and generate a full coverage report. Using `npm test -- --coverage` will only show coverage for files imported by the tests that were executed in that specific run. 