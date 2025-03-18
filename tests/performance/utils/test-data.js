/**
 * Performance Test Data Utilities
 * 
 * Handles the creation and cleanup of test data specifically for performance tests.
 * This is isolated from the regular test data functions.
 */

import { perfDb, sleep } from './db-connection.js';
import { v4 as uuidv4 } from 'uuid';
import { users, tournaments, tournamentParticipants } from './schema.js';

/**
 * Creates a minimal dataset for performance testing
 */
export async function createPerformanceTestData() {
  console.log('Creating performance test data...');
  
  try {
    // Check if we already have data - users and tournaments
    const userCheckResult = await perfDb.execute(
      `SELECT COUNT(*) as count FROM users`
    );
    
    const userCount = parseInt(userCheckResult.rows[0]?.count?.toString() || '0', 10);
    
    const tournamentCheckResult = await perfDb.execute(
      `SELECT COUNT(*) as count FROM tournaments`
    );
    
    const tournamentCount = parseInt(tournamentCheckResult.rows[0]?.count?.toString() || '0', 10);
    
    console.log(`Found ${userCount} users and ${tournamentCount} tournaments in database`);
    
    // If we have both users and tournaments, we can use existing data
    if (userCount > 0 && tournamentCount > 0) {
      console.log(`Using existing performance test data (${userCount} users, ${tournamentCount} tournaments found)`);
      return;
    }
    
    // If we have users but no tournaments, clean up first and recreate everything
    if (userCount > 0 && tournamentCount === 0) {
      console.log('Found users but no tournaments, cleaning database before creating new test data...');
      await cleanPerformanceTestData();
      await sleep(500); // Wait for cleanup to complete
    }
    
    console.log('Creating new test data...');
    
    // Create test users
    const adminUser = await perfDb.insert(users).values({
      email: `admin-${Date.now()}@example.com`,
      otpAttempts: 0,
      isAdmin: true,
    }).returning();
    
    // Create test users (20 users)
    const testUsers = [];
    for (let i = 0; i < 20; i++) {
      const user = await perfDb.insert(users).values({
        email: `user-${Date.now()}-${i}@example.com`,
        otpAttempts: 0,
      }).returning();
      testUsers.push(user[0]);
    }
    
    console.log(`Created ${testUsers.length + 1} users for performance testing`);
    
    // Create test tournaments (5 tournaments)
    const testTournaments = [];
    for (let i = 0; i < 5; i++) {
      const tournament = await perfDb.insert(tournaments).values({
        creatorId: adminUser[0].id,
        name: `Performance Test Tournament ${i}`,
        durationDays: 7,
        startDate: new Date(),
        timezone: 'UTC',
      }).returning();
      testTournaments.push(tournament[0]);
      console.log(`Created tournament: ${tournament[0].name} (ID: ${tournament[0].id})`);
    }
    
    console.log(`Created ${testTournaments.length} tournaments for performance testing`);
    
    // Create tournament participants (multiple users per tournament)
    let totalParticipants = 0;
    for (const tournament of testTournaments) {
      // Add a random number of participants (between 5-15) to each tournament
      const participantCount = 5 + Math.floor(Math.random() * 11);
      
      for (let i = 0; i < participantCount; i++) {
        // Pick a random user
        const randomUser = testUsers[Math.floor(Math.random() * testUsers.length)];
        
        // Add as participant (avoid duplicates)
        try {
          await perfDb.insert(tournamentParticipants).values({
            tournamentId: tournament.id,
            userId: randomUser.id,
            status: Math.random() > 0.3 ? 'joined' : 'invited', // 70% joined, 30% invited
          });
          totalParticipants++;
        } catch (err) {
          // Ignore duplicate participants
        }
      }
    }
    
    console.log(`Created ${totalParticipants} tournament participants for performance testing`);
    console.log('Performance test data setup completed successfully');
    
    // Double check that we have tournaments
    const verifyTournaments = await perfDb.execute(
      `SELECT COUNT(*) as count FROM tournaments`
    );
    
    const verifyCount = parseInt(verifyTournaments.rows[0]?.count?.toString() || '0', 10);
    console.log(`Verification: Found ${verifyCount} tournaments in database after setup`);
    
  } catch (error) {
    console.error('Error creating performance test data:', error);
    throw error;
  }
}

/**
 * Cleans up all performance test data
 */
export async function cleanPerformanceTestData() {
  console.log('Cleaning up performance test data...');
  
  try {
    // Small delay before cleanup
    await sleep(200);
    
    // Delete data in reverse order of dependencies
    await perfDb.execute(`
      DO $$ 
      BEGIN 
        -- Disable triggers to avoid foreign key issues
        SET session_replication_role = 'replica';
        
        -- Clear tables in reverse dependency order
        DELETE FROM tournament_scores;
        DELETE FROM tournament_participants;
        DELETE FROM tournaments;
        DELETE FROM notifications;
        DELETE FROM "adminApprovals";
        DELETE FROM users;
        
        -- Re-enable triggers
        SET session_replication_role = 'origin';
      END $$;
    `);
    
    console.log('Performance test data cleanup completed');
  } catch (error) {
    console.error('Error cleaning up performance test data:', error);
    throw error;
  }
} 