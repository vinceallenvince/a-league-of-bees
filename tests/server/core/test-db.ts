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
    // Delete in proper order to respect foreign key constraints
    await testDb.delete(notifications).execute();
    await testDb.delete(tournamentScores).execute();
    await testDb.delete(tournamentParticipants).execute();
    await testDb.delete(tournaments).execute();
    await testDb.delete(adminApprovals).execute();
    await testDb.delete(users).execute();
  } catch (error) {
    console.error("Error in database cleanup:", error);
  }
}
