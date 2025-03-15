
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.TEST_DB_HOST || '0.0.0.0',
  port: Number(process.env.TEST_DB_PORT) || 5432,
  user: process.env.TEST_DB_USER || 'postgres',
  password: process.env.TEST_DB_PASSWORD || 'postgres',
  database: process.env.TEST_DB_NAME || 'test_db'
});

export const testDb = drizzle(pool);

export const setupTestDb = async () => {
  await migrate(testDb, { migrationsFolder: './migrations' });
};

export const teardownTestDb = async () => {
  await pool.end();
};
