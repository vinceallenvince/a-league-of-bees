import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema';

// Import dotenv to load .env.test file in test environment
import * as dotenv from 'dotenv';

// Load test environment variables if we're in a test environment
if (process.env.NODE_ENV === 'test') {
  dotenv.config({ path: '.env.test' });
}

// Only log database connections in non-test environments or if DEBUG_DB_LOGS=true
if (process.env.NODE_ENV !== 'test' || process.env.DEBUG_DB_LOGS === 'true') {
  console.log(`Tournament feature connecting to database: ${process.env.DATABASE_URL?.split('@')[1]?.split('/')[1]}`);
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
});

export const db = drizzle(pool, { schema });
