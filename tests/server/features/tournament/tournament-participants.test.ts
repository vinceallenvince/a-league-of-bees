import { describe, it, expect, beforeAll, afterAll, afterEach } from '@jest/globals';
import { tournaments, users, tournamentParticipants, tournamentScores, adminApprovals } from '../../../../shared/schema';
import { eq } from 'drizzle-orm';
import { testDb as db, setupTestDb, teardownTestDb } from '../../core/test-db';

describe('TournamentParticipant Models', () => {
  beforeAll(async () => {
    console.log('Starting tournament participants test setup...');
    await setupTestDb();
    console.log('Tournament participants test setup completed');
  }, 30000);

  // Helper function to clean database tables
  async function cleanupTables() {
    try {
      // Delete in proper order to respect foreign key constraints
      await db.delete(tournamentScores).execute();
      await db.delete(tournamentParticipants).execute();
      await db.delete(tournaments).execute();
      await db.delete(adminApprovals).execute();
      await db.delete(users).execute();
    } catch (error) {
      console.error('Error in test cleanup:', error);
    }
  }

  afterEach(async () => {
    // Clean up test data after each test
    await cleanupTables();
  });

  afterAll(async () => {
    console.log('Starting tournament participants test teardown...');
    await teardownTestDb();
    console.log('Tournament participants test teardown completed');
  }, 30000);

  it('should create a tournament participant with valid data', async () => {
    // Create a test user
    const user = await db.insert(users).values({
      email: `participant_${Date.now()}@example.com`,
      otpAttempts: 0
    }).returning();

    // Create a test tournament
    const tournament = await db.insert(tournaments).values({
      creatorId: user[0].id,
      name: 'Test Tournament',
      durationDays: 7,
      startDate: new Date(),
      timezone: 'UTC',
    }).returning();

    // Create a tournament participant
    const participant = await db.insert(tournamentParticipants).values({
      tournamentId: tournament[0].id,
      userId: user[0].id,
      status: 'invited',
    }).returning();

    expect(participant[0]).toHaveProperty('id');
    expect(participant[0].status).toBe('invited');
  });

  it('should enforce foreign key constraints', async () => {
    await expect(db.insert(tournamentParticipants).values({
      tournamentId: '00000000-0000-0000-0000-000000000000',
      userId: '00000000-0000-0000-0000-000000000000',
      status: 'invited',
    })).rejects.toThrow();
  });

  it('should update participant status', async () => {
    // Create a test user
    const user = await db.insert(users).values({
      email: `participant_status_${Date.now()}@example.com`,
      otpAttempts: 0
    }).returning();

    // Create a test tournament
    const tournament = await db.insert(tournaments).values({
      creatorId: user[0].id,
      name: 'Status Test Tournament',
      durationDays: 7,
      startDate: new Date(),
      timezone: 'UTC',
    }).returning();

    // Create a participant
    const participant = await db.insert(tournamentParticipants).values({
      tournamentId: tournament[0].id,
      userId: user[0].id,
      status: 'invited',
    }).returning();

    // Update the participant status
    const updatedParticipant = await db.update(tournamentParticipants)
      .set({ status: 'joined' })
      .where(eq(tournamentParticipants.id, participant[0].id))
      .returning();

    expect(updatedParticipant[0].status).toBe('joined');
  });
});
