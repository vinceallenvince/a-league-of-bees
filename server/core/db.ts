import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import ws from "ws";
import * as schema from "@shared/schema";
// Import dotenv to load .env.test file in test environment
import * as dotenv from 'dotenv';
import logger from './logger';

// Load test environment variables if we're in a test environment
if (process.env.NODE_ENV === 'test') {
  dotenv.config({ path: '.env.test' });
} else {
  // Ensure we load the .env file in development mode
  dotenv.config();
}

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Make absolutely sure we're using the correct connection string
const connectionString = process.env.DATABASE_URL;

// Determine if we're connecting to a local database or a Neon serverless instance
const isLocalDatabase = connectionString.includes('localhost') || 
                        connectionString.includes('127.0.0.1');

let db;

if (isLocalDatabase) {
  // For local development, use standard pg driver
  logger.info('Using standard PostgreSQL connection for local development');
  const pgPool = new pg.Pool({ connectionString });
  db = drizzlePg(pgPool, { schema });
} else {
  // For production/serverless environments, use Neon's driver
  logger.info('Using Neon serverless PostgreSQL connection');
  neonConfig.webSocketConstructor = ws;
  const pool = new Pool({ connectionString });
  db = drizzle({ client: pool, schema });
}

// Log connection details
logger.info(`Connecting to database: ${connectionString?.split('@')[1]?.split('/')[1] || 'unknown'}`);

export { db }; 