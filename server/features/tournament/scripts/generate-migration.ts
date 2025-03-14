
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db } from '../db';

async function generateMigration() {
  try {
    console.log('Generating migration...');
    await migrate(db, {
      migrationsFolder: './server/features/tournament/migrations'
    });
    console.log('Migration generated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error generating migration:', error);
    process.exit(1);
  }
}

generateMigration();
