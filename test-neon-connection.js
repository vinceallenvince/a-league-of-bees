// Test script for Neon Serverless PostgreSQL
import dotenv from 'dotenv';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

dotenv.config();

// Configure Neon to use ws for WebSockets
neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL;
console.log('Using connection string:', connectionString.replace(/:[^:]*@/, ':****@'));

// Create a pool using the Neon driver
const pool = new Pool({ connectionString });

async function testConnection() {
  try {
    console.log('Attempting to connect to Neon database...');
    const result = await pool.query('SELECT COUNT(*) FROM "users"');
    console.log('Database query successful. Found users:', result.rows[0].count);
    console.log('Connection successful!');
  } catch (err) {
    console.error('Error connecting to the Neon database:', err);
  } finally {
    // Close the pool
    await pool.end();
  }
}

testConnection(); 