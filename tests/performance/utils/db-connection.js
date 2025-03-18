/**
 * Performance Testing Database Connection
 * 
 * This module provides a dedicated database connection for performance tests,
 * completely isolated from the regular test database connections.
 */

import pkg from 'pg';
const { Pool } = pkg;
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema.js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.test' });

// Database URL validation
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL environment variable is required for performance tests."
  );
}

// Create a dedicated pool for performance tests
const performancePool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5, // Limit connections to prevent leaks
  idleTimeoutMillis: 10000 // Shorter idle timeout
});

// Flag to track if this connection has been closed
let isPoolClosed = false;

// Export a standalone database instance
export const perfDb = drizzle(performancePool, { schema });

// Helper function to sleep for a specified number of milliseconds
export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Completely separate cleanup function for performance tests
 */
export async function cleanupPerformanceDb() {
  if (!isPoolClosed) {
    console.log("Closing performance test database connection...");
    await performancePool.end();
    isPoolClosed = true;
    console.log("Performance test database connection closed");
  }
}

// Register process shutdown handler specifically for performance tests
process.on('exit', () => {
  if (!isPoolClosed) {
    console.log('Warning: Performance DB connection not properly closed');
    performancePool.end();
  }
}); 