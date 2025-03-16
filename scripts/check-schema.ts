// Import dotenv to load .env.test file
import * as dotenv from 'dotenv';

// Load test environment variables from .env.test
dotenv.config({ path: '.env.test' });

import pkg from 'pg';
const { Pool } = pkg;

async function checkSchema() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required in .env.test");
  }

  console.log('Connecting to test database...');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
  });

  try {
    console.log('Checking tournament_scores table schema...');
    
    // Get table schema
    const result = await pool.query(`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'tournament_scores'
      ORDER BY ordinal_position;
    `);
    
    console.log('Tournament scores table schema:');
    console.table(result.rows);
    
  } catch (error) {
    console.error('Schema check failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

checkSchema().catch((err) => {
  console.error('Schema check process failed:', err);
  process.exit(1);
}); 