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
// Import scheduler for global cleanup
import { jobScheduler } from './server/core/jobs/scheduler';

// Store original process listeners to restore later if needed
const originalProcessListeners = {
  SIGTERM: [...process.listeners('SIGTERM')],
  SIGINT: [...process.listeners('SIGINT')],
  unhandledRejection: [...process.listeners('unhandledRejection')],
  uncaughtException: [...process.listeners('uncaughtException')]
};

// Increase the default timeout for all tests
jest.setTimeout(30000);

// Control console output with environment variables
const VERBOSE_TESTS = process.env.VERBOSE_TESTS === 'true';
const DEBUG_DB_LOGS = process.env.DEBUG_DB_LOGS === 'true';
const SILENT_TESTS = process.env.SILENT_TESTS === 'true';

// This setup function will run before all tests
beforeAll(() => {
  if (!VERBOSE_TESTS) {
    // Configure console output based on mode
    suppressConsoleOutput({
      keepTiming: true,
      keepErrors: true,
      keepWarnings: !SILENT_TESTS,
      keepSetupTeardown: false,
      keepTestResults: !SILENT_TESTS,
      keepDatabaseLogs: DEBUG_DB_LOGS,
      keepTeardownLogs: DEBUG_DB_LOGS
    });
    
    // Only log the suppression message if not in silent mode
    if (!SILENT_TESTS) {
      console.log('Console logs are suppressed. Options for more output:');
      console.log('- VERBOSE_TESTS=true: Show all logs');
      console.log('- DEBUG_DB_LOGS=true: Show database-related logs');
    }
  } else {
    console.log('Verbose logging is enabled.');
  }
});

// This teardown function will run after all tests
afterAll(async () => {
  // Allow time for any pending promises to settle
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Reset the job scheduler
  if (jobScheduler) {
    try {
      jobScheduler.reset();
    } catch (error) {
      console.warn('Error resetting job scheduler:', error);
    }
  }
  
  // Close all app database connections
  await closeAppDbConnections();
  
  // Clean up event listeners
  removeAllProcessListeners();
  
  // Only log the global teardown message in verbose or debug mode
  if (VERBOSE_TESTS || DEBUG_DB_LOGS) {
    console.log('Global teardown: Ensured all connections are closed');
  }
  
  // Now restore console output after all tests are complete
  if (!VERBOSE_TESTS) {
    restoreConsoleOutput();
  }
}, 10000); 

/**
 * Remove all process event listeners added during tests
 */
function removeAllProcessListeners() {
  // First, get all current listeners
  const currentListeners = {
    SIGTERM: process.listeners('SIGTERM'),
    SIGINT: process.listeners('SIGINT'),
    unhandledRejection: process.listeners('unhandledRejection'),
    uncaughtException: process.listeners('uncaughtException')
  };
  
  // Remove all current listeners for these events
  process.removeAllListeners('SIGTERM');
  process.removeAllListeners('SIGINT');
  process.removeAllListeners('unhandledRejection');
  process.removeAllListeners('uncaughtException');
  
  // Restore original listeners if needed
  originalProcessListeners.SIGTERM.forEach(listener => {
    process.on('SIGTERM', listener);
  });
  
  originalProcessListeners.SIGINT.forEach(listener => {
    process.on('SIGINT', listener);
  });
  
  originalProcessListeners.unhandledRejection.forEach(listener => {
    process.on('unhandledRejection', listener);
  });
  
  originalProcessListeners.uncaughtException.forEach(listener => {
    process.on('uncaughtException', listener);
  });
  
  if (VERBOSE_TESTS || DEBUG_DB_LOGS) {
    console.log('Removed process listeners added during tests');
  }
} 