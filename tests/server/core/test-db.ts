
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import * as schema from '../../../shared/schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 1
});

export const testDb = drizzle(pool, { schema });

export async function setupTestDb() {
  await migrate(testDb, { migrationsFolder: './migrations' });
}

export async function teardownTestDb() {
  await pool.end();
}
