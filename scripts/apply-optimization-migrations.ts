/**
 * Script to apply database optimization migrations
 * 
 * This script runs the SQL migration to create indexes and materialized views
 * that optimize query performance for the tournament feature.
 */

import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';

// Load environment variables
config();

async function main() {
  console.log('Applying database optimization migrations...');
  
  // Create database connection
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  
  try {
    // Read migration file
    const migrationPath = path.join(__dirname, '..', 'migrations', 'tournament-indexes.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');
    
    // Begin transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      console.log('Executing migration...');
      
      // Execute migration - may raise errors if some objects already exist, which is fine
      // We're using IF NOT EXISTS to make this idempotent
      await client.query(migrationSql);
      
      console.log('Migration executed successfully');
      
      // Commit transaction
      await client.query('COMMIT');
      
      console.log('Optimization migration completed successfully!');
    } catch (error) {
      // Rollback transaction on error
      await client.query('ROLLBACK');
      console.error('Error applying migration:', error);
      throw error;
    } finally {
      // Release client back to pool
      client.release();
    }
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    // Close pool
    await pool.end();
  }
}

// Run the migration
main()
  .then(() => {
    console.log('Migration process completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration process failed:', error);
    process.exit(1);
  }); 