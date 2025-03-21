import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, jest } from '@jest/globals';
import { eq, and } from 'drizzle-orm';
import { testDb as db, setupTestDb, teardownTestDb, cleanupDatabase, sleep } from '../../../core/test-db';
import { tournaments, users, tournamentParticipants, notifications, tournamentScores } from '../../../../../shared/schema';
import { reminderNotificationJob } from '../../../../../server/features/tournament/jobs/reminderNotification';
import { JobContext } from '../../../../../server/core/jobs/types';
import { jobScheduler } from '../../../../../server/core/jobs/scheduler';
import { closeAppDbConnections } from '../../../core/test-helpers';

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

// Mock node-cron to prevent real scheduling
jest.mock('node-cron', () => {
  return {
    schedule: jest.fn().mockImplementation(() => ({
      stop: jest.fn()
    })),
    validate: jest.fn().mockReturnValue(true)
  };
});

describe('Reminder Notification Job', () => {
  // Increase timeout for the entire test suite
  jest.setTimeout(30000);
  
  // Test data
  let testUser: { id: string };
  let activeTournament: { id: string };
  let upcomingTournament: { id: string };
  
  beforeAll(async () => {
    // First setup the DB with real timers
    await setupTestDb();
    // Only after DB setup use fake timers
    jest.useFakeTimers();
  }, 60000); // Increase timeout for beforeAll

  afterAll(async () => {
    // Clean up any lingering timers
    jest.clearAllTimers(); 
    
    // Restore real timers before closing connections
    jest.useRealTimers();
    
    // Make sure to reset the scheduler
    jobScheduler.reset();
    
    // Close all database connections
    await closeAppDbConnections();
    await teardownTestDb();
  }, 60000); // Increase timeout for afterAll

  beforeEach(async () => {
    // Use real timers for the async operations
    jest.useRealTimers();
    
    // Reset jobs before each test
    jobScheduler.reset();
    
    // Ensure clean state before each test
    await cleanupDatabase();
    await sleep(500);
    
    // Create test user
    const user = await db.insert(users).values({
      email: 'reminder-test@example.com',
      otpAttempts: 0
    }).returning();
    testUser = { id: user[0].id };
    
    // Create active tournament for daily reminders
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const activeTournamentData = await db.insert(tournaments).values({
      creatorId: testUser.id,
      name: 'Test Active Tournament',
      durationDays: 7,
      startDate: yesterday,
      timezone: 'UTC',
      status: 'in_progress'
    }).returning();
    activeTournament = { id: activeTournamentData[0].id };
    
    // Create upcoming tournament (starting tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    // Reset time to midnight for consistent testing
    tomorrow.setHours(0, 0, 0, 0);
    
    const upcomingTournamentData = await db.insert(tournaments).values({
      creatorId: testUser.id,
      name: 'Test Upcoming Tournament',
      durationDays: 7,
      startDate: tomorrow,
      timezone: 'UTC',
      status: 'pending'
    }).returning();
    upcomingTournament = { id: upcomingTournamentData[0].id };
    
    // Create a participant for both tournaments
    await db.insert(tournamentParticipants).values({
      userId: testUser.id,
      tournamentId: activeTournament.id,
      status: 'joined'
    });
    
    await db.insert(tournamentParticipants).values({
      userId: testUser.id,
      tournamentId: upcomingTournament.id,
      status: 'joined'
    });
    
    // Switch back to fake timers for the tests
    jest.useFakeTimers();
  }, 45000);

  afterEach(async () => {
    // Clean up any lingering timers
    jest.clearAllTimers();
    
    // Switch to real timers for cleanup
    jest.useRealTimers();
    
    // Reset jobs after each test
    jobScheduler.reset();
    
    // Clean up after each test
    await cleanupDatabase();
    await sleep(500);
  }, 45000);

  it('should send daily score reminders for active tournaments', async () => {
    // Use real timers for the test execution
    jest.useRealTimers();
    
    // Run the job
    const context: JobContext = {
      jobId: 'test-job',
      startTime: new Date(),
      attempt: 1,
      metadata: {}
    };
    
    const result = await reminderNotificationJob(context);
    
    // Verify job execution was successful
    expect(result.success).toBe(true);
    
    // Verify daily reminder was created
    const notifs = await db.select()
      .from(notifications)
      .where(and(
        eq(notifications.tournamentId, activeTournament.id),
        eq(notifications.type, 'reminder')
      ));
    
    expect(notifs.length).toBeGreaterThan(0);
    expect(notifs[0].message).toContain("Don't forget to submit your score");
    
    // Verify metrics
    expect(result.data).toBeDefined();
    if (result.data) {
      expect(result.data.dailyRemindersSent).toBeGreaterThan(0);
    }
  });

  it('should not send daily reminders if score is already submitted', async () => {
    // Use real timers for the test execution
    jest.useRealTimers();
    
    // Submit a score for day 0 (yesterday)
    await db.insert(tournamentScores).values({
      userId: testUser.id,
      tournamentId: activeTournament.id,
      day: 0, // Day 0 is yesterday (tournament started yesterday)
      score: 100
    });
    
    // Run the job
    const context: JobContext = {
      jobId: 'test-job',
      startTime: new Date(),
      attempt: 1,
      metadata: {}
    };
    
    const result = await reminderNotificationJob(context);
    
    // Verify job execution was successful
    expect(result.success).toBe(true);
    
    // Verify no daily reminder was created (since score was already submitted)
    const notifs = await db.select()
      .from(notifications)
      .where(and(
        eq(notifications.tournamentId, activeTournament.id),
        eq(notifications.type, 'reminder')
      ));
    
    expect(notifs.length).toBe(0);
  });

  it('should send upcoming tournament reminders', async () => {
    // Use real timers for the test execution
    jest.useRealTimers();
    
    // Run the job
    const context: JobContext = {
      jobId: 'test-job',
      startTime: new Date(),
      attempt: 1,
      metadata: {}
    };
    
    const result = await reminderNotificationJob(context);
    
    // Verify job execution was successful
    expect(result.success).toBe(true);
    
    // Verify upcoming tournament reminder was created
    const notifs = await db.select()
      .from(notifications)
      .where(and(
        eq(notifications.tournamentId, upcomingTournament.id),
        eq(notifications.type, 'tournament_start')
      ));
    
    expect(notifs.length).toBeGreaterThan(0);
    expect(notifs[0].message).toContain("will start tomorrow");
    
    // Verify metrics
    expect(result.data).toBeDefined();
    if (result.data) {
      expect(result.data.upcomingTournamentRemindersSent).toBeGreaterThan(0);
    }
  });
}); 