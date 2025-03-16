// Import dotenv to load .env.test file
import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

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
    
    // First try the standard migration approach
    await migrate(db, {
      migrationsFolder: './migrations'
    });
    
    // Then manually run all the SQL files that might not be in the journal
    await manuallyRunMigrations(pool);
    
    console.log('Migrations applied successfully to test database!');
    
    // Verify tables
    const tables = await listTables(pool);
    console.log('Available tables after migration:', tables);
  } catch (error) {
    console.error('Migration application failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

async function manuallyRunMigrations(pool) {
  console.log('Running additional migrations manually...');
  const migrationsDir = path.join(process.cwd(), 'migrations');
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort(); // Sort to ensure correct order

  for (const file of migrationFiles) {
    console.log(`Applying manual migration: ${file}`);
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    try {
      await pool.query(sql);
      console.log(`Successfully applied: ${file}`);
    } catch (err) {
      // Log but continue if there's an error (likely table already exists)
      console.log(`Warning applying ${file}: ${err.message}`);
    }
  }
}

async function listTables(pool) {
  const result = await pool.query(`
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
  `);
  return result.rows.map(row => row.table_name);
}

applyTestMigrations().catch((err) => {
  console.error('Migration process failed:', err);
  process.exit(1);
}); 