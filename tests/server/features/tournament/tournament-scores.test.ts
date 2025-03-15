import { describe, it, expect, beforeAll, afterAll, afterEach } from '@jest/globals';
import { tournaments, users, tournamentScores, adminApprovals } from '../../../../shared/schema';
import { eq } from 'drizzle-orm';
import { testDb as db, setupTestDb, teardownTestDb } from '../../core/test-db';

describe('TournamentScore Models', () => {
  beforeAll(async () => {
    console.log('Starting tournament scores test setup...');
    await setupTestDb();
    console.log('Tournament scores test setup completed');
  }, 30000);

  afterEach(async () => {
    // Clean up test data after each test in correct order
    // Make sure we delete in proper order to respect foreign key constraints
    try {
      await db.delete(tournamentScores);
      await db.delete(tournaments);
      await db.delete(adminApprovals);
      await db.delete(users);
    } catch (error) {
      console.error('Error in test cleanup:', error);
    }
  });

  afterAll(async () => {
    console.log('Starting tournament scores test teardown...');
    await teardownTestDb();
    console.log('Tournament scores test teardown completed');
  }, 30000);

  it('should create a tournament score with valid data', async () => {
    // First create a user
    const user = await db.insert(users).values({
      email: `participant_${Date.now()}@example.com`,
      otpAttempts: 0
    }).returning();

    // Then create a tournament with that user as creator
    const tournament = await db.insert(tournaments).values({
      creatorId: user[0].id,
      name: 'Test Tournament',
      durationDays: 7,
      startDate: new Date(),
      timezone: 'UTC',
    }).returning();

    // Then add a score for that tournament and user
    const score = await db.insert(tournamentScores).values({
      tournamentId: tournament[0].id,
      userId: user[0].id,
      day: 1,
      score: 100,
      screenshotUrl: 'https://example.com/screenshot.png'
    }).returning();

    expect(score[0]).toHaveProperty('id');
    expect(score[0].score).toBe(100);
    expect(score[0].day).toBe(1);
  });

  it('should enforce foreign key constraints', async () => {
    await expect(db.insert(tournamentScores).values({
      tournamentId: '00000000-0000-0000-0000-000000000000',
      userId: '00000000-0000-0000-0000-000000000000',
      day: 1,
      score: 100
    })).rejects.toThrow();
  });

  it('should update tournament score', async () => {
    // Create a test user
    const user = await db.insert(users).values({
      email: `score_update_${Date.now()}@example.com`,
      otpAttempts: 0
    }).returning();

    // Create a test tournament
    const tournament = await db.insert(tournaments).values({
      creatorId: user[0].id,
      name: 'Score Update Test Tournament',
      durationDays: 7,
      startDate: new Date(),
      timezone: 'UTC',
    }).returning();

    // Add a score
    const score = await db.insert(tournamentScores).values({
      tournamentId: tournament[0].id,
      userId: user[0].id,
      day: 1,
      score: 100
    }).returning();

    // Update the score
    const updatedScore = await db.update(tournamentScores)
      .set({ score: 150 })
      .where(eq(tournamentScores.id, score[0].id))
      .returning();

    expect(updatedScore[0].score).toBe(150);
  });
});
