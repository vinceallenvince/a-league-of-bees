// Import dotenv to load .env.test file
import * as dotenv from 'dotenv';

// Load test environment variables from .env.test
dotenv.config({ path: '.env.test' });

import pkg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';

const { Pool } = pkg;

async function applyTestMigrations() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required in .env.test");
  }

  console.log('Connecting to test database...');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
  });

  const db = drizzle(pool);

  try {
    console.log('Applying migrations to test database...');
    await migrate(db, {
      migrationsFolder: './migrations'
    });
    console.log('Migrations applied successfully to test database!');
  } catch (error) {
    console.error('Migration application failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

applyTestMigrations().catch((err) => {
  console.error('Migration process failed:', err);
  process.exit(1);
}); 