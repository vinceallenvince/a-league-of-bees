/**
 * Query Performance Test
 * 
 * This test measures the performance of tournament queries with different data volumes.
 * It validates the effectiveness of the database optimizations.
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { testDb as db, setupTestDb, teardownTestDb, cleanupDatabase } from '../../core/test-db';
import {
  users,
  tournaments,
  tournamentParticipants,
  tournamentScores,
  notifications
} from '../../../../shared/schema';
import { v4 as uuidv4 } from 'uuid';

// Import the query functions we want to test
import * as queries from '../../../../server/features/tournament/queries';

describe('Tournament Query Performance Tests', () => {
  // Test data volumes
  const NUM_USERS = 50;
  const NUM_TOURNAMENTS = 10;
  const NUM_PARTICIPANTS_PER_TOURNAMENT = 20;
  const NUM_SCORES_PER_PARTICIPANT = 7; // One score per day for a week
  const NUM_NOTIFICATIONS = 100;
  
  // Test data references
  const testUsers: any[] = [];
  const testTournaments: any[] = [];
  
  // Set up a larger timeout for this test suite
  jest.setTimeout(120000); // 2 minutes

  beforeAll(async () => {
    console.log('Setting up database for performance testing...');
    await setupTestDb();
    await cleanupDatabase();
    
    // Generate test data
    await generateTestData();
    
    console.log('Test data generated successfully');
  }, 60000);

  afterAll(async () => {
    console.log('Cleaning up after performance tests...');
    await cleanupDatabase();
    await teardownTestDb();
  }, 30000);

  /**
   * Helper function to measure query execution time
   */
  async function measureQueryTime<T>(queryName: string, queryFn: () => Promise<T>): Promise<{ result: T, executionTime: number }> {
    const start = performance.now();
    const result = await queryFn();
    const end = performance.now();
    const executionTime = end - start;
    
    console.log(`Query '${queryName}' executed in ${executionTime.toFixed(2)}ms`);
    
    return { result, executionTime };
  }

  /**
   * Helper function to generate test data
   */
  async function generateTestData() {
    console.log('Generating test users...');
    // Create test users
    for (let i = 0; i < NUM_USERS; i++) {
      const user = await db.insert(users).values({
        email: `user${i}@example.com`,
        username: `user${i}`,
        firstName: `First${i}`,
        lastName: `Last${i}`,
        otpAttempts: 0
      }).returning();
      testUsers.push(user[0]);
    }
    
    console.log('Generating test tournaments...');
    // Create test tournaments
    const tournamentStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
    for (let i = 0; i < NUM_TOURNAMENTS; i++) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + i);
      
      const tournament = await db.insert(tournaments).values({
        creatorId: testUsers[i % NUM_USERS].id,
        name: `Tournament ${i}`,
        description: `This is test tournament ${i} for performance testing`,
        durationDays: 7,
        startDate,
        status: tournamentStatuses[i % tournamentStatuses.length] as any,
        timezone: 'UTC'
      }).returning();
      testTournaments.push(tournament[0]);
      
      // Add participants to this tournament
      console.log(`Adding participants to tournament ${i}...`);
      const participantStatuses = ['invited', 'joined', 'declined'];
      for (let j = 0; j < NUM_PARTICIPANTS_PER_TOURNAMENT; j++) {
        const userIndex = (i + j) % NUM_USERS;
        await db.insert(tournamentParticipants).values({
          tournamentId: tournament[0].id,
          userId: testUsers[userIndex].id,
          status: participantStatuses[j % participantStatuses.length]
        });
        
        // Add scores for this participant if they've joined
        if (j % participantStatuses.length === 1) { // 'joined' status
          for (let day = 1; day <= NUM_SCORES_PER_PARTICIPANT; day++) {
            await db.insert(tournamentScores).values({
              tournamentId: tournament[0].id,
              userId: testUsers[userIndex].id,
              day,
              score: Math.floor(Math.random() * 1000)
            });
          }
        }
      }
    }
    
    console.log('Generating test notifications...');
    // Create test notifications
    const notificationTypes = ['invitation', 'reminder', 'tournament_start', 'tournament_end', 'tournament_cancelled'];
    for (let i = 0; i < NUM_NOTIFICATIONS; i++) {
      const userIndex = i % NUM_USERS;
      const tournamentIndex = i % NUM_TOURNAMENTS;
      const read = i % 3 === 0; // Make 1/3 of notifications read
      
      await db.insert(notifications).values({
        userId: testUsers[userIndex].id,
        tournamentId: testTournaments[tournamentIndex].id,
        type: notificationTypes[i % notificationTypes.length],
        message: `Notification ${i} for performance testing`,
        read
      });
    }
  }

  it('should efficiently retrieve active tournaments with pagination', async () => {
    const { executionTime } = await measureQueryTime('getActiveTournaments', 
      () => queries.getActiveTournaments(1, 10)
    );
    
    // A reasonable performance expectation (adjust based on hardware)
    expect(executionTime).toBeLessThan(200);
  });

  it('should efficiently retrieve tournament participants', async () => {
    const tournamentId = testTournaments[0].id;
    
    const { executionTime } = await measureQueryTime('getTournamentParticipants',
      () => queries.getTournamentParticipants(tournamentId)
    );
    
    expect(executionTime).toBeLessThan(100);
  });

  it('should efficiently retrieve tournament leaderboard', async () => {
    const tournamentId = testTournaments[0].id;
    
    const { executionTime } = await measureQueryTime('getTournamentLeaderboard',
      () => queries.getTournamentLeaderboard(tournamentId)
    );
    
    expect(executionTime).toBeLessThan(150);
  });

  it('should efficiently retrieve unread notifications for a user', async () => {
    const userId = testUsers[0].id;
    
    const { executionTime } = await measureQueryTime('getUnreadNotifications',
      () => queries.getUnreadNotifications(userId)
    );
    
    expect(executionTime).toBeLessThan(50);
  });

  it('should efficiently search tournaments by text', async () => {
    const { executionTime } = await measureQueryTime('searchTournaments',
      () => queries.searchTournaments('Tournament')
    );
    
    expect(executionTime).toBeLessThan(100);
  });

  it('should efficiently retrieve tournaments starting soon', async () => {
    const { executionTime } = await measureQueryTime('getTournamentsStartingSoon',
      () => queries.getTournamentsStartingSoon()
    );
    
    expect(executionTime).toBeLessThan(50);
  });

  it('should efficiently retrieve tournament daily stats', async () => {
    const tournamentId = testTournaments[0].id;
    
    const { executionTime } = await measureQueryTime('getTournamentDailyStats',
      () => queries.getTournamentDailyStats(tournamentId)
    );
    
    expect(executionTime).toBeLessThan(100);
  });
}); 