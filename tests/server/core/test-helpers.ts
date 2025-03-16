/**
 * Test Helpers
 * 
 * Utility functions for test setup and teardown
 */

// Dynamically import database connections to avoid errors if they don't exist
let appDb: any;
let corePool: any;

try {
  // Try to import the tournament database
  const tournamentDb = require('../../../server/features/tournament/db');
  appDb = tournamentDb.db;
} catch (error) {
  console.warn('Tournament database module not available:', error instanceof Error ? error.message : String(error));
}

try {
  // Try to import the core database
  const coreDb = require('../../../server/core/db');
  corePool = coreDb.pool;
} catch (error) {
  console.warn('Core database module not available:', error instanceof Error ? error.message : String(error));
}

/**
 * Close all app database connections
 * This should be called in afterAll hooks when tests import query functions
 */
export async function closeAppDbConnections() {
  let success = true;
  
  // Close tournament feature database pool
  if (appDb?.driver?.pool) {
    try {
      // @ts-ignore - access internal pool to close it
      await appDb.driver.pool.end();
      console.log('Tournament feature database pool closed');
    } catch (error) {
      console.warn('Could not close tournament database pool:', error);
      success = false;
    }
  }
  
  // Close core database pool
  if (corePool) {
    try {
      await corePool.end();
      console.log('Core database pool closed');
    } catch (error) {
      console.warn('Could not close core database pool:', error);
      success = false;
    }
  }
  
  return success;
} 