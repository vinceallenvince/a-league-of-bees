# Tournament Query Performance Tests

This document describes the query performance tests for the tournament feature. These tests measure the execution time of critical database queries with realistic data volumes to ensure the application maintains good performance.

## Purpose

The performance tests:

1. Create a test database with sample data (users, tournaments, participants)
2. Execute optimized queries and measure their execution time
3. Assert that each query completes within defined time limits
4. Help identify performance regressions before they impact users

## Implementation Structure

The performance testing infrastructure is completely isolated from the regular test suite:

- `tests/performance/` - Main directory for all performance test files
  - `utils/` - Utility functions for database connections, test data, metrics
  - `config/` - Configuration settings for performance tests
  - `fixtures/` - Test data templates and schemas
  - `run-performance-tests.js` - Main script to run all performance tests
  - `tournament-performance.test.js` - Test suite for tournament queries

## Running Performance Tests

Performance tests are **excluded from the regular test suite** to avoid slowing down the development workflow. They should be run manually when:

- Making significant changes to database schema
- Modifying query implementations
- Implementing new database indexes
- Before deploying to production

### Run with npm script (recommended)

```bash
npm run test:performance
```

This script:
- Sets up the test environment
- Runs only the performance tests
- Captures and displays query execution times
- Verifies that queries meet performance thresholds
- Cleans up test data and connections when complete

### Run with verbose output

To see all console output for debugging purposes:

```bash
VERBOSE_TESTS=true npm run test:performance
```

This mode shows all console logs, which is useful when troubleshooting database setup issues or investigating unexpected test behavior.

## Test Data Creation

The test creates a dataset with:

- Multiple users (typically 20+)
- Several tournaments (5+)
- Multiple participants per tournament
- Various tournament statuses (pending, in_progress, completed)

The data creation is handled by the `createPerformanceTestData()` function in `utils/test-data.js`.

## Queries Tested

The performance test suite currently tests these critical queries:

1. **GetActive** - Retrieves all active tournaments
2. **GetByID** - Gets a specific tournament by ID
3. **GetParts** - Retrieves all participants for a tournament
4. **CountByStatus** - Counts participants by status for a tournament

## Performance Thresholds

The tests assert that queries execute within these time limits:

- Active tournaments query: < 100ms
- Tournament by ID query: < 50ms
- Tournament participants query: < 100ms
- Count by status query: < 50ms

These thresholds are configured in the `config/test-config.js` file and can be adjusted based on your development environment.

## Isolation from Regular Tests

The performance testing infrastructure is completely isolated from regular tests:

- Uses dedicated database connection utilities in `utils/db-connection.js`
- Has standalone database setup and cleanup functions
- Runs in a separate process from Jest tests
- Maintains its own performance measurement utilities
- Uses explicit connection management with proper cleanup

## Troubleshooting

If tests fail due to threshold violations:

1. Check the database indexes for the affected queries
2. Review the query implementation for optimization opportunities
3. Consider adjusting thresholds if necessary based on your environment

If tests fail due to setup or connection issues:

1. Run with verbose output: `VERBOSE_TESTS=true npm run test:performance`
2. Check database connection settings in `utils/db-connection.js`
3. Verify that test data creation is working correctly
4. Look for errors in table creation or schema compatibility 