/**
 * Database Seed Script
 * 
 * This script populates the database with initial data for development purposes.
 */

import { db } from '../features/tournament/db';
import { users, tournaments, tournamentParticipants, notifications } from '../../shared/schema';
import { eq, sql } from 'drizzle-orm';

/**
 * Seed the database with initial data
 */
async function seedDatabase() {
  console.log('Seeding database with initial data...');
  
  try {
    // Check if we already have data
    const userCheckResult = await db.select({
      count: sql<number>`count(*)`
    }).from(users);
    
    const userCount = Number(userCheckResult[0]?.count || 0);
    
    if (userCount > 0) {
      console.log(`Database already contains ${userCount} users. Skipping seed.`);
      console.log('To reset the database, run this script with --reset flag');
      return;
    }
    
    console.log('Creating initial seed data...');
    
    // Create test user (this will be your login)
    const testUser = await db.insert(users).values({
      email: 'test@example.com',
      otpAttempts: 0,
      isAdmin: true,
    }).returning();
    
    console.log(`Created test user: ${testUser[0].email} (ID: ${testUser[0].id})`);
    
    // Create test tournaments
    const testTournaments = [];
    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(now.getDate() + 7);
    
    // Create 3 tournaments (1 active, 1 upcoming, 1 completed)
    const tournament1 = await db.insert(tournaments).values({
      creator_id: testUser[0].id,
      name: 'Active Tournament',
      description: 'This is an active tournament currently in progress',
      duration_days: 7,
      start_date: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      timezone: 'UTC',
      status: 'in_progress'
    }).returning();
    testTournaments.push(tournament1[0]);
    
    const tournament2 = await db.insert(tournaments).values({
      creator_id: testUser[0].id,
      name: 'Upcoming Tournament',
      description: 'This tournament will start next week',
      duration_days: 7,
      start_date: nextWeek,
      timezone: 'UTC',
      status: 'pending'
    }).returning();
    testTournaments.push(tournament2[0]);
    
    const tournament3 = await db.insert(tournaments).values({
      creator_id: testUser[0].id,
      name: 'Completed Tournament',
      description: 'This tournament has already been completed',
      duration_days: 7,
      start_date: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
      timezone: 'UTC',
      status: 'completed'
    }).returning();
    testTournaments.push(tournament3[0]);
    
    console.log(`Created ${testTournaments.length} sample tournaments`);
    
    // Create some notifications
    await db.insert(notifications).values({
      userId: testUser[0].id,
      tournamentId: tournament1[0].id,
      type: 'tournament_started',
      message: 'Tournament "Active Tournament" has started',
      read: false
    });
    
    await db.insert(notifications).values({
      userId: testUser[0].id,
      tournamentId: tournament2[0].id,
      type: 'tournament_reminder',
      message: 'Tournament "Upcoming Tournament" will start soon',
      read: false
    });
    
    console.log('Created sample notifications');
    
    console.log('Database seeding completed successfully!');
    console.log('You can now login with the test user: test@example.com');
    
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

/**
 * Reset the database by deleting all data
 */
async function resetDatabase() {
  console.log('Resetting database...');
  
  try {
    // Delete data in reverse order of dependencies
    await db.delete(notifications);
    await db.delete(tournamentParticipants);
    await db.delete(tournaments);
    await db.delete(users);
    
    console.log('Database reset completed');
  } catch (error) {
    console.error('Error resetting database:', error);
    process.exit(1);
  }
}

// Check for --reset flag
if (process.argv.includes('--reset')) {
  resetDatabase().then(() => {
    seedDatabase().then(() => {
      process.exit(0);
    });
  });
} else {
  seedDatabase().then(() => {
    process.exit(0);
  });
} 