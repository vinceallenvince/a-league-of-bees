import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { testDb as db, setupTestDb, teardownTestDb, cleanupDatabase, sleep } from '../../core/test-db';
import { users, tournaments, tournamentParticipants, tournamentScores } from '../../../../shared/schema';

// Determine if running in CI environment
const isCI = process.env.CI === 'true' || process.env.CI_ENVIRONMENT === 'true';

// Adjust delay times based on environment
const CLEANUP_DELAY = isCI ? 2000 : 1000;
const DB_OPERATION_DELAY = isCI ? 1000 : 500; 
const VERIFICATION_DELAY = isCI ? 500 : 200;

describe('Score Management Flow', () => {
  jest.setTimeout(60000); // 60 second timeout for the whole suite
  
  beforeAll(async () => {
    console.log('Starting score integration test setup...');
    await setupTestDb();
    // Run cleanup after setup to ensure a clean database
    await cleanupDatabase();
    console.log('Score integration test setup completed');
  }, 30000);

  afterAll(async () => {
    console.log('Starting score integration test teardown...');
    await teardownTestDb();
    console.log('Score integration test teardown completed');
  }, 30000);

  beforeEach(async () => {
    // Ensure clean state before each test
    await cleanupDatabase();
    // Wait for cleanup to fully complete
    await sleep(CLEANUP_DELAY);
  });

  afterEach(async () => {
    // Clean up after each test
    await cleanupDatabase();
    // Wait for cleanup to fully complete
    await sleep(CLEANUP_DELAY);
  });

  it('should handle the complete score submission → leaderboard flow', async () => {
    console.log('Starting test: should handle the complete score submission → leaderboard flow');
    
    try {
      // 1. Create tournament creator
      const creatorEmail = `creator-${Date.now()}@example.com`;
      const creator = await db.insert(users).values({
        id: uuidv4(),
        email: creatorEmail,
        otpAttempts: 0
      }).returning();
      console.log('Created creator user:', creator[0].id);

      // 2. Create participants
      const participant1Email = `participant1-${Date.now()}@example.com`;
      const participant1 = await db.insert(users).values({
        id: uuidv4(),
        email: participant1Email,
        otpAttempts: 0
      }).returning();
      console.log('Created participant 1:', participant1[0].id);
      
      const participant2Email = `participant2-${Date.now()}@example.com`;
      const participant2 = await db.insert(users).values({
        id: uuidv4(),
        email: participant2Email,
        otpAttempts: 0
      }).returning();
      console.log('Created participant 2:', participant2[0].id);
      
      await sleep(DB_OPERATION_DELAY);

      // 3. Create a tournament
      const tournamentId = uuidv4();
      const tournament = await db.insert(tournaments).values({
        id: tournamentId,
        creatorId: creator[0].id,
        name: `Score Flow Tournament ${Date.now()}`,
        durationDays: 7,
        startDate: new Date(),
        timezone: 'UTC',
        status: 'in_progress' // Important for score submission
      }).returning();
      console.log('Created tournament:', tournament[0].id);
      
      await sleep(DB_OPERATION_DELAY);

      // 4. Add participants to the tournament
      await db.insert(tournamentParticipants).values({
        id: uuidv4(),
        tournamentId: tournamentId,
        userId: participant1[0].id,
        status: 'joined',
        joinedAt: new Date()
      });
      
      await db.insert(tournamentParticipants).values({
        id: uuidv4(),
        tournamentId: tournamentId,
        userId: participant2[0].id,
        status: 'joined',
        joinedAt: new Date()
      });
      console.log('Added participants to tournament');
      
      await sleep(DB_OPERATION_DELAY);

      // 5. Participant 1 submits scores for day 1 and 2
      const participant1Day1 = await db.insert(tournamentScores).values({
        tournamentId: tournamentId,
        userId: participant1[0].id,
        day: 1,
        score: 100
      }).returning();
      console.log('Participant 1 submitted score for day 1:', participant1Day1[0].id);
      
      const participant1Day2 = await db.insert(tournamentScores).values({
        tournamentId: tournamentId,
        userId: participant1[0].id,
        day: 2,
        score: 150
      }).returning();
      console.log('Participant 1 submitted score for day 2:', participant1Day2[0].id);
      
      await sleep(VERIFICATION_DELAY);

      // 6. Participant 2 submits a score for day 1 (higher than participant 1)
      const participant2Day1 = await db.insert(tournamentScores).values({
        tournamentId: tournamentId,
        userId: participant2[0].id,
        day: 1,
        score: 200
      }).returning();
      console.log('Participant 2 submitted score for day 1:', participant2Day1[0].id);
      
      await sleep(VERIFICATION_DELAY);

      // 7. Verify participant scores
      const p1Scores = await db.select()
        .from(tournamentScores)
        .where(and(
          eq(tournamentScores.tournamentId, tournamentId),
          eq(tournamentScores.userId, participant1[0].id)
        ))
        .orderBy(tournamentScores.day);
      
      expect(p1Scores.length).toBe(2);
      expect(p1Scores[0].day).toBe(1);
      expect(p1Scores[0].score).toBe(100);
      expect(p1Scores[1].day).toBe(2);
      expect(p1Scores[1].score).toBe(150);
      console.log('Verified participant 1 scores');
      
      const p2Scores = await db.select()
        .from(tournamentScores)
        .where(and(
          eq(tournamentScores.tournamentId, tournamentId),
          eq(tournamentScores.userId, participant2[0].id)
        ))
        .orderBy(tournamentScores.day);
      
      expect(p2Scores.length).toBe(1);
      expect(p2Scores[0].day).toBe(1);
      expect(p2Scores[0].score).toBe(200);
      console.log('Verified participant 2 scores');
      
      // 8. Update a score and verify the update
      await db.update(tournamentScores)
        .set({ score: 180 })
        .where(eq(tournamentScores.id, participant1Day1[0].id))
        .execute();
      console.log('Updated participant 1 day 1 score');
      
      await sleep(VERIFICATION_DELAY);
      
      const updatedScore = await db.select()
        .from(tournamentScores)
        .where(eq(tournamentScores.id, participant1Day1[0].id));
      
      expect(updatedScore[0].score).toBe(180);
      console.log('Verified participant 1 score update');
      
      // At this point, scores should be:
      // Participant 1: Day 1 = 180, Day 2 = 150, Total = 330
      // Participant 2: Day 1 = 200, Total = 200
      
      console.log('Test completed: should handle the complete score submission → leaderboard flow');
    } catch (error) {
      console.error('Test failed with error:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      throw error;
    }
  }, 30000);

  it('should handle score submission with verification requirements', async () => {
    console.log('Starting test: should handle score submission with verification requirements');
    
    try {
      // 1. Create tournament creator
      const creator = await db.insert(users).values({
        id: uuidv4(),
        email: `creator-verif-${Date.now()}@example.com`,
        otpAttempts: 0
      }).returning();
      
      // 2. Create participant
      const participant = await db.insert(users).values({
        id: uuidv4(),
        email: `participant-verif-${Date.now()}@example.com`,
        otpAttempts: 0
      }).returning();
      
      await sleep(DB_OPERATION_DELAY);
      
      // 3. Create a tournament requiring verification
      const tournamentId = uuidv4();
      const tournament = await db.insert(tournaments).values({
        id: tournamentId,
        creatorId: creator[0].id,
        name: `Verification Tournament ${Date.now()}`,
        durationDays: 7,
        startDate: new Date(),
        timezone: 'UTC',
        status: 'in_progress',
        requiresVerification: true
      }).returning();
      
      await sleep(DB_OPERATION_DELAY);
      
      // 4. Add participant to the tournament
      await db.insert(tournamentParticipants).values({
        id: uuidv4(),
        tournamentId: tournamentId,
        userId: participant[0].id,
        status: 'joined',
        joinedAt: new Date()
      });
      
      await sleep(DB_OPERATION_DELAY);
      
      // 5. Submit score with screenshot URL
      const scoreWithScreenshot = await db.insert(tournamentScores).values({
        tournamentId: tournamentId,
        userId: participant[0].id,
        day: 1,
        score: 250,
        screenshotUrl: 'https://example.com/screenshot.jpg'
      }).returning();
      
      // 6. Verify score has screenshot URL
      expect(scoreWithScreenshot[0].screenshotUrl).toBe('https://example.com/screenshot.jpg');
      
      console.log('Test completed: should handle score submission with verification requirements');
    } catch (error) {
      console.error('Test failed with error:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      throw error;
    }
  }, 15000);
}); 