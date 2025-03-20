import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, jest } from '@jest/globals';
import { eq } from 'drizzle-orm';
import { testDb as db, setupTestDb, teardownTestDb, cleanupDatabase, sleep } from '../../../core/test-db';
import { tournaments, users, tournamentParticipants, notifications } from '../../../../../shared/schema';
import { tournamentLifecycleJob } from '../../../../../server/features/tournament/jobs/tournamentLifecycle';
import { JobContext } from '../../../../../server/core/jobs/types';

// Mock logger to prevent noisy test output
jest.mock('../../../../../server/core/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

describe('Tournament Lifecycle Job', () => {
  jest.setTimeout(60000); // 60 second timeout
  
  // Test data
  let testUser: { id: string };
  let pendingTournament: { id: string };
  let activeTournament: { id: string };
  
  beforeAll(async () => {
    await setupTestDb();
  }, 30000);

  afterAll(async () => {
    await teardownTestDb();
  }, 30000);

  beforeEach(async () => {
    // Ensure clean state before each test
    await cleanupDatabase();
    await sleep(500);
    
    // Create test user
    const user = await db.insert(users).values({
      email: 'job-test@example.com',
      otpAttempts: 0
    }).returning();
    testUser = { id: user[0].id };
    
    // Create pending tournament with start date in the past
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const pendingTournamentData = await db.insert(tournaments).values({
      creatorId: testUser.id,
      name: 'Test Pending Tournament',
      durationDays: 7,
      startDate: yesterday,
      timezone: 'UTC',
      status: 'pending'
    }).returning();
    pendingTournament = { id: pendingTournamentData[0].id };
    
    // Create active tournament that should be completed
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
    
    const activeTournamentData = await db.insert(tournaments).values({
      creatorId: testUser.id,
      name: 'Test Active Tournament',
      durationDays: 7, // 7-day tournament started 10 days ago should be completed
      startDate: tenDaysAgo,
      timezone: 'UTC',
      status: 'in_progress'
    }).returning();
    activeTournament = { id: activeTournamentData[0].id };
    
    // Create a participant for the tournaments
    await db.insert(tournamentParticipants).values({
      userId: testUser.id,
      tournamentId: pendingTournament.id,
      status: 'joined'
    });
    
    await db.insert(tournamentParticipants).values({
      userId: testUser.id,
      tournamentId: activeTournament.id,
      status: 'joined'
    });
  });

  afterEach(async () => {
    // Clean up after each test
    await cleanupDatabase();
    await sleep(500);
  });

  it('should start pending tournaments with start date in the past', async () => {
    // Run the job
    const context: JobContext = {
      jobId: 'test-job',
      startTime: new Date(),
      attempt: 1,
      metadata: {}
    };
    
    const result = await tournamentLifecycleJob(context);
    
    // Verify job execution was successful
    expect(result.success).toBe(true);
    
    // Verify the pending tournament was started
    const updatedTournament = await db.select()
      .from(tournaments)
      .where(eq(tournaments.id, pendingTournament.id))
      .limit(1);
    
    expect(updatedTournament[0].status).toBe('in_progress');
    
    // Verify start notification was created
    const notifs = await db.select()
      .from(notifications)
      .where(eq(notifications.tournamentId, pendingTournament.id));
    
    expect(notifs.length).toBeGreaterThan(0);
    expect(notifs.some(n => n.type === 'tournament_start')).toBe(true);
  });

  it('should complete tournaments that have reached their end date', async () => {
    // Run the job
    const context: JobContext = {
      jobId: 'test-job',
      startTime: new Date(),
      attempt: 1,
      metadata: {}
    };
    
    const result = await tournamentLifecycleJob(context);
    
    // Verify job execution was successful
    expect(result.success).toBe(true);
    
    // Verify the active tournament was completed
    const updatedTournament = await db.select()
      .from(tournaments)
      .where(eq(tournaments.id, activeTournament.id))
      .limit(1);
    
    expect(updatedTournament[0].status).toBe('completed');
    
    // Verify end notification was created
    const notifs = await db.select()
      .from(notifications)
      .where(eq(notifications.tournamentId, activeTournament.id));
    
    expect(notifs.length).toBeGreaterThan(0);
    expect(notifs.some(n => n.type === 'tournament_end')).toBe(true);
  });
  
  it('should return job metrics', async () => {
    // Run the job
    const context: JobContext = {
      jobId: 'test-job',
      startTime: new Date(),
      attempt: 1,
      metadata: {}
    };
    
    const result = await tournamentLifecycleJob(context);
    
    // Verify job execution was successful
    expect(result.success).toBe(true);
    expect(result.executionTimeMs).toBeGreaterThan(0);
    
    // Verify metrics
    expect(result.data).toBeDefined();
    if (result.data) {
      expect(result.data.pendingTournamentsStarted).toBe(1);
      expect(result.data.completedTournaments).toBe(1);
    }
  });
}); 