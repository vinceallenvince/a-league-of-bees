import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { testDb as db, setupTestDb, teardownTestDb, cleanupDatabase, sleep } from '../../core/test-db';
import { users, tournaments, tournamentParticipants } from '../../../../shared/schema';

// Determine if running in CI environment
const isCI = process.env.CI === 'true' || process.env.CI_ENVIRONMENT === 'true';

// Adjust delay times based on environment
const CLEANUP_DELAY = isCI ? 2000 : 1000;
const DB_OPERATION_DELAY = isCI ? 1000 : 500; 
const VERIFICATION_DELAY = isCI ? 500 : 200;

describe('Participant Management Flow', () => {
  jest.setTimeout(60000); // 60 second timeout for the whole suite
  
  beforeAll(async () => {
    console.log('Starting participant integration test setup...');
    await setupTestDb();
    // Run cleanup after setup to ensure a clean database
    await cleanupDatabase();
    console.log('Participant integration test setup completed');
  }, 30000);

  afterAll(async () => {
    console.log('Starting participant integration test teardown...');
    await teardownTestDb();
    console.log('Participant integration test teardown completed');
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

  it('should handle the complete invitation → join flow', async () => {
    console.log('Starting test: should handle the complete invitation → join flow');
    
    try {
      // 1. Create creator user
      const creatorEmail = `creator-${Date.now()}@example.com`;
      const creator = await db.insert(users).values({
        id: uuidv4(),
        email: creatorEmail,
        otpAttempts: 0
      }).returning();
      console.log('Created creator user:', creator[0].id);

      // 2. Create participant user
      const participantEmail = `participant-${Date.now()}@example.com`;
      const participant = await db.insert(users).values({
        id: uuidv4(),
        email: participantEmail,
        otpAttempts: 0
      }).returning();
      console.log('Created participant user:', participant[0].id);
      
      await sleep(DB_OPERATION_DELAY);

      // 3. Create a tournament
      const tournamentName = `Integration Test Tournament ${Date.now()}`;
      const tournament = await db.insert(tournaments).values({
        id: uuidv4(),
        creatorId: creator[0].id,
        name: tournamentName,
        durationDays: 7,
        startDate: new Date(Date.now() + 86400000), // tomorrow
        timezone: 'UTC',
        status: 'pending'
      }).returning();
      console.log('Created tournament:', tournament[0].id);
      
      await sleep(DB_OPERATION_DELAY);

      // 4. Invite the participant
      const invitation = await db.insert(tournamentParticipants).values({
        id: uuidv4(),
        tournamentId: tournament[0].id,
        userId: participant[0].id,
        status: 'invited',
        joinedAt: new Date()
      }).returning();
      console.log('Created invitation:', invitation[0].id);
      
      // Verify invitation
      const verifyInvitation = await db.select()
        .from(tournamentParticipants)
        .where(eq(tournamentParticipants.id, invitation[0].id));
      
      expect(verifyInvitation[0].status).toBe('invited');
      
      await sleep(VERIFICATION_DELAY);

      // 5. Accept the invitation (join the tournament)
      await db.update(tournamentParticipants)
        .set({ status: 'joined' })
        .where(eq(tournamentParticipants.id, invitation[0].id))
        .execute();
      
      // Verify joined status
      const verifyJoined = await db.select()
        .from(tournamentParticipants)
        .where(eq(tournamentParticipants.id, invitation[0].id));
      
      expect(verifyJoined[0].status).toBe('joined');
      
      console.log('Test completed: should handle the complete invitation → join flow');
    } catch (error) {
      console.error('Test failed with error:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      throw error;
    }
  }, 15000);

  it('should handle the invitation → decline flow', async () => {
    console.log('Starting test: should handle the invitation → decline flow');
    
    try {
      // 1. Create creator user
      const creatorEmail = `creator-decline-${Date.now()}@example.com`;
      const creator = await db.insert(users).values({
        id: uuidv4(),
        email: creatorEmail,
        otpAttempts: 0
      }).returning();
      
      // 2. Create participant user
      const participantEmail = `participant-decline-${Date.now()}@example.com`;
      const participant = await db.insert(users).values({
        id: uuidv4(),
        email: participantEmail,
        otpAttempts: 0
      }).returning();
      
      await sleep(DB_OPERATION_DELAY);

      // 3. Create a tournament
      const tournament = await db.insert(tournaments).values({
        id: uuidv4(),
        creatorId: creator[0].id,
        name: `Decline Flow Tournament ${Date.now()}`,
        durationDays: 7,
        startDate: new Date(Date.now() + 86400000), // tomorrow
        timezone: 'UTC',
        status: 'pending'
      }).returning();
      
      await sleep(DB_OPERATION_DELAY);

      // 4. Invite the participant
      const invitation = await db.insert(tournamentParticipants).values({
        id: uuidv4(),
        tournamentId: tournament[0].id,
        userId: participant[0].id,
        status: 'invited',
        joinedAt: new Date()
      }).returning();
      
      // Verify invitation
      const verifyInvitation = await db.select()
        .from(tournamentParticipants)
        .where(eq(tournamentParticipants.id, invitation[0].id));
      
      expect(verifyInvitation[0].status).toBe('invited');
      
      await sleep(VERIFICATION_DELAY);

      // 5. Decline the invitation
      await db.update(tournamentParticipants)
        .set({ status: 'declined' })
        .where(eq(tournamentParticipants.id, invitation[0].id))
        .execute();
      
      // Verify declined status
      const verifyDeclined = await db.select()
        .from(tournamentParticipants)
        .where(eq(tournamentParticipants.id, invitation[0].id));
      
      expect(verifyDeclined[0].status).toBe('declined');
      
      console.log('Test completed: should handle the invitation → decline flow');
    } catch (error) {
      console.error('Test failed with error:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      throw error;
    }
  }, 15000);

  it('should allow a user to directly join a tournament without invitation', async () => {
    console.log('Starting test: should allow a user to directly join a tournament without invitation');
    
    try {
      // 1. Create creator user
      const creatorEmail = `creator-direct-${Date.now()}@example.com`;
      const creator = await db.insert(users).values({
        id: uuidv4(),
        email: creatorEmail,
        otpAttempts: 0
      }).returning();
      
      // 2. Create participant user
      const participantEmail = `participant-direct-${Date.now()}@example.com`;
      const participant = await db.insert(users).values({
        id: uuidv4(),
        email: participantEmail,
        otpAttempts: 0
      }).returning();
      
      await sleep(DB_OPERATION_DELAY);

      // 3. Create a public tournament (no verification required)
      const tournament = await db.insert(tournaments).values({
        id: uuidv4(),
        creatorId: creator[0].id,
        name: `Direct Join Tournament ${Date.now()}`,
        durationDays: 7,
        startDate: new Date(Date.now() + 86400000), // tomorrow
        requiresVerification: false, // Anyone can join
        timezone: 'UTC',
        status: 'pending'
      }).returning();
      
      await sleep(DB_OPERATION_DELAY);

      // 4. User directly joins the tournament
      const directJoin = await db.insert(tournamentParticipants).values({
        id: uuidv4(),
        tournamentId: tournament[0].id,
        userId: participant[0].id,
        status: 'joined',
        joinedAt: new Date()
      }).returning();
      
      // Verify joined status
      const verifyJoined = await db.select()
        .from(tournamentParticipants)
        .where(eq(tournamentParticipants.id, directJoin[0].id));
      
      expect(verifyJoined[0].status).toBe('joined');
      expect(verifyJoined[0].userId).toBe(participant[0].id);
      expect(verifyJoined[0].tournamentId).toBe(tournament[0].id);
      
      console.log('Test completed: should allow a user to directly join a tournament without invitation');
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