import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { eq } from 'drizzle-orm';
import { testDb as db, setupTestDb, teardownTestDb, cleanupDatabase } from '../../core/test-db';
import { users, tournaments, tournamentParticipants } from '../../../../shared/schema';

// Re-enabling test, removing the skip
describe('Tournament Participants', () => {
  beforeAll(async () => {
    console.log('Starting tournament participants test setup...');
    await setupTestDb();
    console.log('Tournament participants test setup completed');
  }, 30000);

  afterAll(async () => {
    console.log('Starting tournament participants test teardown...');
    await teardownTestDb();
    console.log('Tournament participants test teardown completed');
  }, 30000);

  beforeEach(async () => {
    // Clean up before each test
    await cleanupDatabase();
  });

  afterEach(async () => {
    // Clean up after each test
    await cleanupDatabase();
  });

  it('should create tournament participant', async () => {
    console.log('Starting test: should create tournament participant');
    // Create a test user
    const user = await db.insert(users).values({
      email: 'participant@example.com',
      otpAttempts: 0
    }).returning();
    console.log('Created test user:', user[0].id);

    // Create a test tournament
    const tournament = await db.insert(tournaments).values({
      creatorId: user[0].id,
      name: 'Test Tournament',
      durationDays: 7,
      startDate: new Date(),
      timezone: 'UTC',
    }).returning();
    console.log('Created test tournament:', tournament[0].id);

    // Create tournament participant
    const participant = await db.insert(tournamentParticipants).values({
      tournamentId: tournament[0].id,
      userId: user[0].id,
      status: 'invited'
    }).returning();
    console.log('Created tournament participant:', participant[0].id);

    expect(participant[0].tournamentId).toBe(tournament[0].id);
    expect(participant[0].userId).toBe(user[0].id);
    expect(participant[0].status).toBe('invited');
    console.log('Test completed: should create tournament participant');
  }, 10000);

  it('should update tournament participant status', async () => {
    console.log('Starting test: should update tournament participant status');
    // Create a test user
    const user = await db.insert(users).values({
      email: 'participant-update@example.com',
      otpAttempts: 0
    }).returning();
    console.log('Created test user:', user[0].id);

    // Create a test tournament
    const tournament = await db.insert(tournaments).values({
      creatorId: user[0].id,
      name: 'Test Tournament for Status Update',
      durationDays: 7,
      startDate: new Date(),
      timezone: 'UTC',
    }).returning();
    console.log('Created test tournament:', tournament[0].id);

    // Create tournament participant
    const participantData = {
      tournamentId: tournament[0].id,
      userId: user[0].id,
      status: 'invited'
    };
    await db.insert(tournamentParticipants).values(participantData);
    console.log('Created tournament participant');

    // Update participant status
    await db.update(tournamentParticipants)
      .set({ status: 'accepted' })
      .where(eq(tournamentParticipants.userId, user[0].id))
      .execute();
    console.log('Updated participant status');

    // Fetch updated participant
    const updatedParticipant = await db.select()
      .from(tournamentParticipants)
      .where(eq(tournamentParticipants.userId, user[0].id));
    console.log('Retrieved updated participant');

    expect(updatedParticipant[0].status).toBe('accepted');
    console.log('Test completed: should update tournament participant status');
  }, 10000);
});
