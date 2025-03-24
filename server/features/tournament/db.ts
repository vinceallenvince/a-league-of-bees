import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema';
import logger from '../../core/logger';

// Import dotenv to load .env.test file in test environment
import * as dotenv from 'dotenv';

// Load test environment variables if we're in a test environment
if (process.env.NODE_ENV === 'test') {
  dotenv.config({ path: '.env.test' });
} else {
  // Ensure we load the .env file in development mode as well
  dotenv.config();
}

// Make absolutely sure we're using the correct connection string
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not defined in environment variables');
}

// Determine if we're connecting to a local database or a remote instance
const isLocalDatabase = connectionString.includes('localhost') || 
                       connectionString.includes('127.0.0.1');

// Only log database connections in non-test environments or if DEBUG_DB_LOGS=true
if (process.env.NODE_ENV !== 'test' || process.env.DEBUG_DB_LOGS === 'true') {
  console.log(`Tournament feature connecting to database: ${connectionString?.split('@')[1]?.split('/')[1]}`);
  console.log(`Using DATABASE_URL from env: ${connectionString?.split('@')[0]}@****/${connectionString?.split('/').pop()}`);
  
  if (isLocalDatabase) {
    console.log('Using standard PostgreSQL connection for local database');
  }
}

// Configure the connection appropriately for the environment
const pool = new pg.Pool({
  connectionString,
  // Only use SSL in production and not for local connections
  ssl: process.env.NODE_ENV === 'production' && !isLocalDatabase
});

export const db = drizzle(pool, { schema });
