import pkg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import * as dotenv from 'dotenv';

const { Pool } = pkg;
dotenv.config();

async function generateMigration() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  console.log('Connecting to database...');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
  });

  const db = drizzle(pool);

  try {
    console.log('Generating migration...');
    await migrate(db, {
      migrationsFolder: './migrations'
    });
    console.log('Migration generated successfully!');
  } catch (error) {
    console.error('Migration generation failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

generateMigration().catch((err) => {
  console.error('Migration process failed:', err);
  process.exit(1);
});