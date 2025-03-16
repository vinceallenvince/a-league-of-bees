/**
 * Global Jest Setup
 * 
 * This file is executed once before all test files are run.
 * It sets up global teardown to ensure all database connections are closed.
 */

// Import Jest globals
import { jest, afterAll } from '@jest/globals';
// Import database connection cleanup helper
import { closeAppDbConnections } from './tests/server/core/test-helpers';

// Increase the default timeout for all tests
jest.setTimeout(30000);

// This teardown function will run after all tests
afterAll(async () => {
  // Allow time for any pending promises to settle
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Close all app database connections
  await closeAppDbConnections();
  
  console.log('Global teardown: Ensured all connections are closed');
}, 10000); 