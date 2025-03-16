// Import dotenv to load .env.test file
import * as dotenv from "dotenv";

// Load test environment variables from .env.test
dotenv.config({ path: ".env.test" });

import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import * as schema from "../../../shared/schema";
import {
  users,
  tournaments,
  tournamentParticipants,
  tournamentScores,
  notifications,
  adminApprovals,
} from "../../../shared/schema";

// Import from test-helpers to coordinate pool closures
import { getPoolsClosed, markPoolClosed } from './test-helpers';

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL environment variable is required for tests. Please check your .env.test file.",
  );
}

// Create a connection pool with a maximum of 10 connections
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10, // Increase max connections to avoid connection issues
});

export const testDb = drizzle(pool, { schema });

// Helper function to sleep for a specified number of milliseconds
export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function setupTestDb() {
  console.log("Setting up test database...");
  // Log the test database URL
  console.log(`Test database URL: ${process.env.DATABASE_URL?.split('@')[1]?.split('/')[1]}`);
  
  try {
    // Use correct path to migrations folder from project root
    await migrate(testDb, { migrationsFolder: "./migrations" });
    console.log("Database migration completed successfully");
    
    // Verify tables exist
    const tables = await verifyTables();
    console.log("Tables verified:", tables);
    
    // Allow some time for database to settle after migrations
    await sleep(500);
  } catch (error) {
    console.error("Error during database setup:", error);
    throw error;
  }
}

// Helper function to verify tables exist
async function verifyTables() {
  const result = await testDb.execute(
    `SELECT table_name FROM information_schema.tables 
     WHERE table_schema = 'public' 
     AND table_type = 'BASE TABLE';`
  );
  return result.rows.map(row => row.table_name);
}

export async function teardownTestDb() {
  console.log("Tearing down test database...");
  try {
    // Ensure all operations are completed before closing the pool
    await sleep(500);
    
    // Check if the pool was already closed elsewhere
    const poolsClosed = getPoolsClosed();
    
    if (!poolsClosed.testDb) {
      await pool.end();
      markPoolClosed('testDb', true);
      console.log("Database connection closed");
    } else {
      console.log("Database connection already closed");
    }
  } catch (error) {
    console.error("Error during database teardown:", error);
    throw error;
  }
}

/**
 * Helper function to clean all database tables
 */
export async function cleanupDatabase() {
  try {
    console.log("Cleaning up database tables...");
    
    // Add a small delay before cleanup to ensure all operations are completed
    await sleep(200);
    
    // Delete data in reverse order of dependencies
    await testDb.execute(`
      DO $$ 
      BEGIN 
        -- First try to delete from dependent tables
        DELETE FROM notifications;
        DELETE FROM tournament_scores;
        DELETE FROM tournament_participants;
        DELETE FROM tournaments;
        DELETE FROM "adminApprovals";
        DELETE FROM users;
      EXCEPTION WHEN OTHERS THEN
        -- If deleting doesn't work, truncate with CASCADE
        TRUNCATE TABLE 
          notifications,
          tournament_scores, 
          tournament_participants, 
          tournaments, 
          "adminApprovals", 
          users 
        CASCADE;
      END $$;
    `).catch(async (err) => {
      console.warn("Error during database cleanup:", err instanceof Error ? err.message : String(err));
      
      // As a last resort, try individual deletes with explicit column names
      try {
        await testDb.execute(`DELETE FROM notifications;`);
        await testDb.execute(`DELETE FROM tournament_scores;`);
        await testDb.execute(`DELETE FROM tournament_participants;`);
        await testDb.execute(`DELETE FROM tournaments;`);
        await testDb.execute(`DELETE FROM "adminApprovals";`);
        await testDb.execute(`DELETE FROM users;`);
      } catch (error) {
        console.warn("Error with individual deletes:", error instanceof Error ? error.message : String(error));
      }
    });
    
    // Add a small delay after cleanup to ensure transactions are committed
    await sleep(200);
    
    console.log("Database cleanup completed");
  } catch (error) {
    console.error("Error in database cleanup:", error instanceof Error ? error.message : String(error));
    // Don't throw here, just log - we don't want test failures due to cleanup issues
  }
}
