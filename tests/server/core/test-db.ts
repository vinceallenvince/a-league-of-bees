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

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL environment variable is required for tests. Please check your .env.test file.",
  );
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 1, // Keep connections limited for tests
});

export const testDb = drizzle(pool, { schema });

export async function setupTestDb() {
  console.log("Setting up test database...");
  try {
    // Use correct path to migrations folder from project root
    await migrate(testDb, { migrationsFolder: "./migrations" });
    console.log("Database migration completed successfully");
    
    // Verify tables exist
    const tables = await verifyTables();
    console.log("Tables verified:", tables);
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
    await pool.end();
    console.log("Database connection closed");
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
    
    // Simpler implementation - just truncate all tables with CASCADE
    await testDb.execute(`
      TRUNCATE TABLE 
        "notifications",
        "tournament_scores", 
        "tournament_participants", 
        "tournaments", 
        "adminApprovals", 
        "users" 
      CASCADE;
    `).catch(async (err) => {
      console.warn("Error with truncate cascade, trying individual deletes:", err instanceof Error ? err.message : String(err));
      
      // Try individual deletes in correct order
      try {
        await testDb.execute(`DELETE FROM "notifications";`);
        await testDb.execute(`DELETE FROM "tournament_scores";`);
        await testDb.execute(`DELETE FROM "tournament_participants";`);
        await testDb.execute(`DELETE FROM "tournaments";`);
        await testDb.execute(`DELETE FROM "adminApprovals";`);
        await testDb.execute(`DELETE FROM "users";`);
      } catch (error) {
        console.warn("Error with individual deletes:", error instanceof Error ? error.message : String(error));
      }
    });
    
    console.log("Database cleanup completed");
  } catch (error) {
    console.error("Error in database cleanup:", error instanceof Error ? error.message : String(error));
    // Don't throw here, just log - we don't want test failures due to cleanup issues
  }
}
