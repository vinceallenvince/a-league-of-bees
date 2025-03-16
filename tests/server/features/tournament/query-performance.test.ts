/**
 * Query Performance Test
 * 
 * This test measures the performance of tournament queries with different data volumes.
 * It validates the effectiveness of the database optimizations.
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { testDb as db, setupTestDb, teardownTestDb, cleanupDatabase, sleep } from '../../core/test-db';
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
import { sql } from 'drizzle-orm';
// Import helper for closing app db connection
import { closeAppDbConnections } from '../../core/test-helpers';

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

  // Create necessary database views for testing
  async function createTestViews() {
    console.log('Creating test database views...');
    
    // Create active_tournaments view
    await db.execute(sql`
      CREATE OR REPLACE VIEW active_tournaments AS
      SELECT 
        t.*,
        u.email as creator_email,
        u.username as creator_username,
        u."firstName" as creator_first_name,
        u."lastName" as creator_last_name,
        COUNT(tp.id) as participant_count
      FROM tournaments t
      LEFT JOIN users u ON t.creator_id = u.id
      LEFT JOIN tournament_participants tp ON t.id = tp.tournament_id
      WHERE t.status = 'in_progress'
      GROUP BY t.id, u.email, u.username, u."firstName", u."lastName"
    `);
    
    // Create tournament_leaderboard view
    await db.execute(sql`
      CREATE OR REPLACE VIEW tournament_leaderboard AS
      SELECT 
        tp.tournament_id,
        t.name as tournament_name,
        tp.user_id,
        u.username,
        u.email,
        COALESCE(SUM(ts.score), 0) as total_score,
        COALESCE(MAX(ts.score), 0) as highest_score,
        COUNT(DISTINCT ts.day) as days_participated
      FROM tournament_participants tp
      JOIN tournaments t ON tp.tournament_id = t.id
      JOIN users u ON tp.user_id = u.id
      LEFT JOIN tournament_scores ts ON tp.user_id = ts.user_id AND tp.tournament_id = ts.tournament_id
      GROUP BY tp.tournament_id, t.name, tp.user_id, u.username, u.email
    `);
    
    // Create unread_notifications_summary view
    await db.execute(sql`
      CREATE OR REPLACE VIEW unread_notifications_summary AS
      SELECT 
        user_id,
        type,
        COUNT(*) as notification_count
      FROM notifications
      WHERE read = false
      GROUP BY user_id, type
    `);
    
    // Create tournament_daily_stats view
    await db.execute(sql`
      CREATE OR REPLACE VIEW tournament_daily_stats AS
      SELECT 
        tournament_id,
        day,
        COUNT(DISTINCT user_id) as participants,
        AVG(score) as average_score,
        MAX(score) as highest_score,
        MIN(score) as lowest_score
      FROM tournament_scores
      GROUP BY tournament_id, day
      ORDER BY tournament_id, day
    `);
    
    // Create user_tournaments view
    await db.execute(sql`
      CREATE OR REPLACE VIEW user_tournaments AS
      SELECT 
        u.id as user_id,
        u.email,
        u.username,
        t.id as tournament_id,
        t.name as tournament_name,
        t.status as tournament_status,
        t.start_date,
        t.duration_days,
        tp.status as participation_status,
        tp.joined_at,
        COUNT(ts.id) as score_submissions,
        SUM(ts.score) as total_score
      FROM users u
      JOIN tournament_participants tp ON u.id = tp.user_id
      JOIN tournaments t ON tp.tournament_id = t.id
      LEFT JOIN tournament_scores ts ON u.id = ts.user_id AND t.id = ts.tournament_id
      GROUP BY u.id, u.email, u.username, t.id, t.name, t.status, t.start_date, t.duration_days, tp.status, tp.joined_at
    `);
    
    console.log('Test views created successfully');
  }

  beforeAll(async () => {
    console.log('Setting up database for performance testing...');
    await setupTestDb();
    await cleanupDatabase();
    
    // Generate test data
    await generateTestData();
    
    // Create necessary views after data is generated
    await createTestViews();
    
    console.log('Test data generated successfully');
  }, 60000);

  afterAll(async () => {
    console.log('Cleaning up after performance tests...');
    
    // Ensure all database operations are complete
    await sleep(1000);
    
    // Clean up all test data
    await cleanupDatabase();
    
    // Close the app db pools
    await closeAppDbConnections();
    
    // Teardown the test db
    await teardownTestDb();
  }, 30000); // Increase timeout to ensure proper cleanup

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