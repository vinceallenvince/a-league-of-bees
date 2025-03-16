# Tournament Database Integration Tests

This directory contains database integration tests for the tournament feature. These tests were previously excluded from the test suite due to issues with TypeScript type declarations and database setup, but they are now functioning correctly.

## Running the Tests

To run these tests, you'll need a test database. Here's how to set up and run the tests:

1. Set up the test database environment variables (see `.env.example`)
2. Run the following commands:

```bash
npm run db:migrate:test  # Apply migrations to the test database
npm test                 # Run all tests, including database tests
```

To run only the database tests:

```bash
npm test -- tests/server/features/tournament  # Run only tournament database tests
```

To run a specific test file:

```bash
npm test -- tests/server/features/tournament/integration.test.ts  # Run only integration tests
```

## Resolved Issues

The following issues have been addressed:

- TypeScript type declarations for external modules
- Table existence issues (all required tables are created)
- Schema mismatches between code and database
- Database cleanup between tests to prevent interference
- Added sufficient timeouts to prevent test failures
- Added delay functions to ensure database operations complete
- Implemented cascade delete tests to verify referential integrity

## Test Files

This directory contains several test files:

- `integration.test.ts`: Verifies foreign key relationships, cascade operations, and constraints
- `models.test.ts`: Tests the tournament model operations
- `tournament-participants.test.ts`: Tests tournament participant operations
- `tournament-scores.test.ts`: Tests tournament score operations
- `notifications.test.ts`: Tests notification operations

## Integration Test Categories

The integration tests verify critical database functionality:

1. **Foreign Key Relationships**: Tests that references between tables are enforced
2. **Cascade Operations**: Tests that deleting a parent record properly cascades to child records
3. **Constraint Validations**: Tests unique constraints, non-null constraints, and other database rules

Each test category ensures the database schema is correctly implemented and relationships between tables are maintained properly. 