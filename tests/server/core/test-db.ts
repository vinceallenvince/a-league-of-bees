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
  max: 1,
});

export const testDb = drizzle(pool, { schema });

export async function setupTestDb() {
  console.log("Setting up test database...");
  try {
    await migrate(testDb, { migrationsFolder: "./migrations" });
    console.log("Database migration completed successfully");
  } catch (error) {
    console.error("Error during database setup:", error);
    throw error;
  }
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
 * Helper function to clean all database tables in the correct order to respect foreign key constraints
 */
export async function cleanupDatabase() {
  try {
    // Use SQL to truncate all tables with CASCADE to avoid foreign key issues
    // This is safer and more efficient than deleting rows one by one
    await testDb.execute(
      `DO $$ 
      BEGIN 
        TRUNCATE TABLE "users", "tournaments", "tournament_participants", "tournament_scores", "admin_approvals" CASCADE;
        -- Add any other tables that need to be cleaned here
      EXCEPTION WHEN undefined_table THEN 
        -- If tables don't exist yet, this is a no-op
        NULL;
      END $$;`
    );
  } catch (error) {
    console.error("Error in database cleanup:", error);
  }
}
