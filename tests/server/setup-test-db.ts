import { db } from '../../server/core/db';
import { users } from '@shared/schema';
import dotenv from 'dotenv';

// Ensure test environment
process.env.NODE_ENV = 'test';

// Load test environment variables
dotenv.config({ path: '.env.test' });

/**
 * Sets up the test database
 */
export async function setupTestDb() {
  try {
    // Create tables if they don't exist
    await createTables();
  } catch (error) {
    console.error('Error setting up test database:', error);
    throw error;
  }
}

/**
 * Tears down the test database
 */
export async function teardownTestDb() {
  try {
    // Clean up all test data
    await cleanupDatabase();
  } catch (error) {
    console.error('Error tearing down test database:', error);
    throw error;
  }
}

/**
 * Creates the necessary tables for testing
 */
async function createTables() {
  try {
    // Verify connection is working
    const result = await db.execute('SELECT 1 as test');
    if (!result || !result.rows || !result.rows[0] || result.rows[0].test !== 1) {
      throw new Error('Database connection check failed');
    }
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  }
}

/**
 * Cleans up the database by deleting all test data
 */
export async function cleanupDatabase() {
  try {
    // Delete all users
    await db.delete(users);
  } catch (error) {
    console.error('Error cleaning up database:', error);
    throw error;
  }
} 