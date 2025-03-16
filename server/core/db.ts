import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
// Import dotenv to load .env.test file in test environment
import * as dotenv from 'dotenv';

// Load test environment variables if we're in a test environment
if (process.env.NODE_ENV === 'test') {
  dotenv.config({ path: '.env.test' });
}

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Only log database connections in non-test environments or if DEBUG_DB_LOGS=true
if (process.env.NODE_ENV !== 'test' || process.env.DEBUG_DB_LOGS === 'true') {
  console.log(`Core connecting to database: ${process.env.DATABASE_URL?.split('@')[1]?.split('/')[1]}`);
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema }); 