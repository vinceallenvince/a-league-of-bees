
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import * as dotenv from 'dotenv';

dotenv.config();

async function generateMigration() {
  try {
    console.log('Generating migration...');
    
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
    
    const db = drizzle(pool);
    
    await migrate(db, {
      migrationsFolder: './server/features/tournament/migrations/sql'
    });
    
    console.log('Migration generated successfully!');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Error generating migration:', error);
    process.exit(1);
  }
}

generateMigration();
