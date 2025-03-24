// Simple script to test PostgreSQL connectivity
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();
const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;
console.log('Using connection string:', connectionString.replace(/:[^:]*@/, ':****@'));

const pool = new Pool({ connectionString });

async function testConnection() {
  try {
    console.log('Attempting to connect to database...');
    const client = await pool.connect();
    console.log('Successfully connected to database!');
    
    const result = await client.query('SELECT COUNT(*) FROM "users"');
    console.log('Database query successful. Found users:', result.rows[0].count);
    
    client.release();
    console.log('Connection released.');
  } catch (err) {
    console.error('Error connecting to the database:', err);
  } finally {
    // Close the pool
    await pool.end();
  }
}

testConnection(); 