/**
 * Database utilities for performance testing
 * 
 * Manages isolated DB connections and operations for performance tests
 */

import pg from 'pg';
const { Pool } = pg;

// Isolated connection pool for performance tests
let perfTestPool = null;

/**
 * Initialize the performance test database connection
 * @returns {Promise<void>}
 */
export const initPerfTestDb = async () => {
  // Create a dedicated connection pool for performance tests
  perfTestPool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'aleagueofbees',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    // Smaller pool size for performance tests to control connection usage
    max: 5,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 5000,
  });
  
  try {
    // Test the connection
    const client = await perfTestPool.connect();
    client.release();
    console.log('Performance test DB connection established');
  } catch (err) {
    console.error('Error establishing performance test DB connection:', err);
    throw err;
  }
};

/**
 * Execute a database query for performance testing
 * @param {string} text - SQL query text 
 * @param {Array} params - Query parameters
 * @returns {Promise<any>} - Query results
 */
export const query = async (text, params) => {
  if (!perfTestPool) {
    await initPerfTestDb();
  }
  
  const start = Date.now();
  const result = await perfTestPool.query(text, params);
  const duration = Date.now() - start;
  
  if (process.env.VERBOSE_PERF_TESTS === 'true') {
    console.log('Executed query', { text, duration, rows: result.rowCount });
  }
  
  return result;
};

/**
 * Close database connections when tests are complete
 * @returns {Promise<void>}
 */
export const closePerfTestDb = async () => {
  if (perfTestPool) {
    await perfTestPool.end();
    perfTestPool = null;
    console.log('Performance test DB connections closed');
  }
};

/**
 * Clean up test data created during performance tests
 * @param {string} table - Table name to clean
 * @param {string} condition - WHERE condition for deletion
 * @returns {Promise<void>}
 */
export const cleanupTestData = async (table, condition) => {
  if (!perfTestPool) {
    await initPerfTestDb();
  }
  
  try {
    const deleteQuery = `DELETE FROM ${table} WHERE ${condition}`;
    await perfTestPool.query(deleteQuery);
    console.log(`Cleaned up test data from ${table}`);
  } catch (err) {
    console.error(`Error cleaning up test data from ${table}:`, err);
  }
}; 