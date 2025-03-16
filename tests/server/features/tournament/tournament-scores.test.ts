import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { eq } from 'drizzle-orm';
import { testDb as db, setupTestDb, teardownTestDb, cleanupDatabase, sleep } from '../../core/test-db';
import { users, tournaments, tournamentScores } from '../../../../shared/schema';

// Re-enabling test, removing the skip
describe('Tournament Scores', () => {
  jest.setTimeout(60000); // 60 second timeout for the whole suite
  
  beforeAll(async () => {
    console.log('Starting tournament scores test setup...');
    await setupTestDb();
    // Run cleanup after setup to ensure a clean database
    await cleanupDatabase();
    console.log('Tournament scores test setup completed');
  }, 30000);

  afterAll(async () => {
    console.log('Starting tournament scores test teardown...');
    await teardownTestDb();
    console.log('Tournament scores test teardown completed');
  }, 30000);

  beforeEach(async () => {
    // Ensure clean state before each test
    await cleanupDatabase();
    // Wait for cleanup to fully complete
    await sleep(500);
  });

  afterEach(async () => {
    // Clean up after each test
    await cleanupDatabase();
    // Wait for cleanup to fully complete
    await sleep(500);
  });

  it('should create tournament score', async () => {
    console.log('Starting test: should create tournament score');
    // Create a test user
    const user = await db.insert(users).values({
      email: 'score-test@example.com',
      otpAttempts: 0
    }).returning();
    console.log('Created test user:', user[0].id);

    // Create a test tournament
    const tournament = await db.insert(tournaments).values({
      creatorId: user[0].id,
      name: 'Score Test Tournament',
      durationDays: 7,
      startDate: new Date(),
      timezone: 'UTC',
    }).returning();
    console.log('Created test tournament:', tournament[0].id);

    // Create tournament score with the correct column names
    const score = await db.insert(tournamentScores).values({
      tournamentId: tournament[0].id,
      userId: user[0].id,
      day: 1,
      score: 100
      // Let the database set created_at and updated_at defaults
    }).returning();
    console.log('Created tournament score:', score[0].id);

    expect(score[0].tournamentId).toBe(tournament[0].id);
    expect(score[0].userId).toBe(user[0].id);
    expect(score[0].day).toBe(1);
    expect(score[0].score).toBe(100);
    console.log('Test completed: should create tournament score');
  }, 10000);

  it('should update tournament score', async () => {
    console.log('Starting test: should update tournament score');
    // Create a test user
    const user = await db.insert(users).values({
      email: 'score-update@example.com',
      otpAttempts: 0
    }).returning();
    console.log('Created test user:', user[0].id);

    // Create a test tournament
    const tournament = await db.insert(tournaments).values({
      creatorId: user[0].id,
      name: 'Score Update Tournament',
      durationDays: 7,
      startDate: new Date(),
      timezone: 'UTC',
    }).returning();
    console.log('Created test tournament:', tournament[0].id);

    // Create initial score with the correct column names
    const initialScore = await db.insert(tournamentScores).values({
      tournamentId: tournament[0].id,
      userId: user[0].id,
      day: 1,
      score: 100
      // Let the database set created_at and updated_at defaults
    }).returning();
    console.log('Created initial score:', initialScore[0].id);

    // Update the score
    await db.update(tournamentScores)
      .set({ score: 150 })
      .where(eq(tournamentScores.id, initialScore[0].id))
      .execute();
    console.log('Updated score');

    // Fetch updated score
    const updatedScore = await db.select()
      .from(tournamentScores)
      .where(eq(tournamentScores.id, initialScore[0].id));
    console.log('Retrieved updated score');

    expect(updatedScore[0].score).toBe(150);
    console.log('Test completed: should update tournament score');
  }, 10000);
});
