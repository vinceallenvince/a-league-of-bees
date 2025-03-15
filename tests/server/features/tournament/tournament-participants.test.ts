
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { tournaments, users, tournamentParticipants } from '../../../../shared/schema';
import { eq } from 'drizzle-orm';
import { testDb as db, setupTestDb, teardownTestDb } from '../../core/test-db';

describe('TournamentParticipant Models', () => {
  beforeAll(async () => {
    await setupTestDb();
  }, 30000);

  afterEach(async () => {
    // Clean up test data after each test in correct order
    await db.delete(tournamentParticipants);
    await db.delete(tournaments);
    await db.delete(adminApprovals);
    await db.delete(users);
  });

  afterAll(async () => {
    await teardownTestDb();
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
    const user = await db.insert(users).values({
      email: `participant_status_${Date.now()}@example.com`,
      otpAttempts: 0
    }).returning();

    const tournament = await db.insert(tournaments).values({
      creatorId: user[0].id,
      name: 'Status Test Tournament',
      durationDays: 7,
      startDate: new Date(),
      timezone: 'UTC',
    }).returning();

    const participant = await db.insert(tournamentParticipants).values({
      tournamentId: tournament[0].id,
      userId: user[0].id,
      status: 'invited',
    }).returning();

    const updatedParticipant = await db.update(tournamentParticipants)
      .set({ status: 'joined' })
      .where(eq(tournamentParticipants.id, participant[0].id))
      .returning();

    expect(updatedParticipant[0].status).toBe('joined');
  });
});
