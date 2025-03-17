# Tournament Query Performance Tests

This document describes the query performance tests for the tournament feature. These tests measure the execution time of critical database queries with realistic data volumes to ensure the application maintains good performance.

## Purpose

The performance tests:

1. Create a test database with sample data (users, tournaments, participants, scores, notifications)
2. Execute optimized queries and measure their execution time
3. Assert that each query completes within defined time limits
4. Help identify performance regressions before they impact users

## Running Performance Tests

Performance tests are **excluded from the regular test suite** to avoid slowing down the development workflow. They should be run manually when:

- Making significant changes to database schema
- Modifying query implementations
- Implementing new database indexes
- Before deploying to production

> **Note:** Performance tests always run in sequential mode (with `--runInBand`) to ensure consistent timing measurements and prevent resource conflicts.

### Option 1: Run with script (recommended)

Use the provided shell script:

```bash
./run-performance-tests.sh
```

This script:
- Sets up the test environment
- Runs only the performance tests
- Captures the output to a log file
- Displays a summary of query execution times
- Suppresses non-essential console output

### Option 2: Run with direct script

If you want to see the output directly in the terminal:

```bash
./run-perf-test-direct.sh
```

This script runs the tests with output displayed directly in the terminal, which can be helpful for debugging.

### Option 3: Run with verbose output

To see all console output for debugging purposes:

```bash
VERBOSE_TESTS=true ./run-perf-test-direct.sh
```

This mode shows all console logs, which is useful when troubleshooting database setup issues or investigating unexpected test behavior.

### Option 4: Run with npm

```bash
npm run test:performance
```

## Test Configuration

The test creates a realistic dataset with:

- 50 users
- 10 tournaments
- 20 participants per tournament
- 7 scores per participant (one score per day for a week)
- 100 notifications

You can adjust these values in the test file if needed:

```typescript
// Test data volumes
const NUM_USERS = 50;
const NUM_TOURNAMENTS = 10;
const NUM_PARTICIPANTS_PER_TOURNAMENT = 20;
const NUM_SCORES_PER_PARTICIPANT = 7;
const NUM_NOTIFICATIONS = 100;
```

## Console Output Control

By default, the tests suppress most console output to make it easier to focus on performance results. The only messages displayed are:

- Performance timing results (e.g., "Query 'getActiveTournaments' executed in 45.23ms")
- Test failures and errors
- Test summary information

To see all console output, use the `VERBOSE_TESTS=true` environment variable when running the tests.

## Performance Expectations

The tests assert that queries execute within these time limits:

- Active tournaments query: < 200ms
- Tournament participants query: < 100ms
- Tournament leaderboard query: < 150ms
- Unread notifications query: < 50ms
- Tournament search query: < 100ms
- Tournaments starting soon query: < 50ms
- Tournament daily stats query: < 100ms

These limits are baseline expectations and may need adjustment based on your development environment and hardware. They are not strict performance requirements but rather guidelines to identify significant performance degradations.

## Troubleshooting

If tests fail due to timeout or connection issues:

1. Check the database connection pool settings
2. Ensure adequate delays between database operations
3. Verify that all database views are created successfully
4. Try increasing the Jest timeout value (`jest.setTimeout()`)
5. Run in verbose mode to see all console output: `VERBOSE_TESTS=true ./run-perf-test-direct.sh`

If query performance doesn't meet expectations:

1. Review database indexes
2. Analyze query plans with `EXPLAIN ANALYZE`
3. Consider optimizing view definitions
4. Check database server configuration 