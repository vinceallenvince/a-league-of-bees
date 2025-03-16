/**
 * Global Jest Setup
 * 
 * This file is executed once before all test files are run.
 * It sets up global teardown to ensure all database connections are closed.
 * It also controls console output during tests for cleaner output.
 */

// Set environment to test
process.env.NODE_ENV = 'test';

// Import Jest globals
import { jest, afterAll, beforeAll } from '@jest/globals';
// Import database connection cleanup helper
import { closeAppDbConnections } from './tests/server/core/test-helpers';
// Import console output control functions
import { suppressConsoleOutput, restoreConsoleOutput } from './tests/server/core/test-logger';

// Increase the default timeout for all tests
jest.setTimeout(30000);

// Control console output with VERBOSE_TESTS environment variable
const VERBOSE_TESTS = process.env.VERBOSE_TESTS === 'true';

// This setup function will run before all tests
beforeAll(() => {
  if (!VERBOSE_TESTS) {
    // Suppress console output, but keep timing messages
    suppressConsoleOutput(true);
    console.log('Console logs are suppressed. Run with VERBOSE_TESTS=true to see all logs.');
  } else {
    console.log('Verbose logging is enabled.');
  }
});

// This teardown function will run after all tests
afterAll(async () => {
  if (!VERBOSE_TESTS) {
    // Restore console output before final messages
    restoreConsoleOutput();
  }
  
  // Allow time for any pending promises to settle
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Close all app database connections
  await closeAppDbConnections();
  
  console.log('Global teardown: Ensured all connections are closed');
}, 10000); 