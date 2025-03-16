# Database Integration Tests

This directory contains database integration tests for the tournament features. These tests were previously excluded from the normal test run due to dependency issues, but they have now been fixed and are working correctly.

## Running Database Tests

To run the database integration tests:

```bash
# Make sure the test database is properly set up
npm run db:migrate:test

# Run all tests including database tests
npm test

# Run only the database integration tests
npm run test:db
```

## Fixed Issues

The following issues have been resolved:

1. ✅ Added TypeScript type declarations for modules (`drizzle-orm`, `pg`, `@jest/globals`) in tsconfig.json
2. ✅ Fixed table existence issues by ensuring all required tables are created in test migrations
3. ✅ Resolved schema mismatches between code and database (e.g., `submittedAt` vs `created_at`)
4. ✅ Improved database cleanup between tests to avoid foreign key constraint violations

## Test Files

- `integration.test.ts`: General database integration tests (still skipped, can be enabled later)
- `tournament-participants.test.ts`: Tests for tournament participant functionality
- `tournament-scores.test.ts`: Tests for tournament scoring functionality  
- `notifications.test.ts`: Tests for notification functionality

## Integration Test

The main integration test (`integration.test.ts`) is still skipped by default as it contains more complex tests that may need additional work. You can enable it by removing it from the `testPathIgnorePatterns` in `jest.config.js` and removing the `.skip` in the test file. 