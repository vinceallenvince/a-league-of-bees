
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import * as dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

async function generateAndPushMigration() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  console.log('Connecting to database...');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  const db = drizzle(pool);

  try {
    console.log('Pushing migration to database...');
    await migrate(db, {
      migrationsFolder: './server/features/tournament/migrations'
    });
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

generateAndPushMigration().catch((err) => {
  console.error('Migration process failed:', err);
  process.exit(1);
});
