import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { testDb as db, setupTestDb, teardownTestDb, cleanupDatabase, sleep } from '../../core/test-db';
import { users, tournaments, tournamentParticipants } from '../../../../shared/schema';

// Determine if running in CI environment
const isCI = process.env.CI === 'true' || process.env.CI_ENVIRONMENT === 'true';

// Adjust delay times based on environment
const CLEANUP_DELAY = isCI ? 2000 : 1000;
const DB_OPERATION_DELAY = isCI ? 1000 : 500; 
const VERIFICATION_DELAY = isCI ? 500 : 200;

// Re-enabling test, removing the skip
describe('Tournament Participants', () => {
  jest.setTimeout(60000); // 60 second timeout for the whole suite
  
  beforeAll(async () => {
    console.log('Starting tournament participants test setup...');
    await setupTestDb();
    // Run cleanup after setup to ensure a clean database
    await cleanupDatabase();
    console.log('Tournament participants test setup completed');
  }, 30000);

  afterAll(async () => {
    console.log('Starting tournament participants test teardown...');
    await teardownTestDb();
    console.log('Tournament participants test teardown completed');
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

  it('should create tournament participant', async () => {
    console.log('Starting test: should create tournament participant');
    
    try {
      // Create test user
      const user = await db.insert(users).values({
        email: 'participant-test@example.com',
        otpAttempts: 0,
        username: 'ParticipantTest'
      }).returning();
      
      console.log(`Created test user: ${user[0].id}`);
      
      // Create test tournament
      const tournament = await db.insert(tournaments).values({
        name: 'Test Tournament for Participants',
        description: 'A test tournament for participant tests',
        status: 'pending',
        creatorId: user[0].id,
        durationDays: 7,
        startDate: new Date(),
        requiresVerification: false,
        timezone: 'UTC'
      }).returning();
      
      console.log(`Created test tournament: ${tournament[0].id}`);
      
      // Create tournament participant
      const participant = await db.insert(tournamentParticipants).values({
        userId: user[0].id,
        tournamentId: tournament[0].id,
        status: 'active'
      }).returning();
      
      console.log(`Created tournament participant: ${participant[0].id}`);
      
      // Verify the participant was created
      const participants = await db.select()
        .from(tournamentParticipants)
        .where(eq(tournamentParticipants.tournamentId, tournament[0].id));
      
      expect(participants.length).toBe(1);
      expect(participants[0].userId).toBe(user[0].id);
      expect(participants[0].status).toBe('active');
      
      console.log('Test completed: should create tournament participant');
    } catch (error) {
      console.error('Test error:', error);
      throw error;
    }
  }, 60000); // Increase timeout to 60 seconds

  it('should update tournament participant status', async () => {
    console.log('Starting test: should update tournament participant status');
    
    try {
      // Create a test user
      const userEmail = `participant-update-${Date.now()}@example.com`;
      const user = await db.insert(users).values({
        email: userEmail,
        otpAttempts: 0
      }).returning();
      console.log('Created test user:', user[0].id);

      // Verify user exists before proceeding
      const verifyUser = await db.select().from(users).where(eq(users.id, user[0].id));
      expect(verifyUser.length).toBe(1);
      
      // Longer delay to ensure transaction is committed
      await sleep(DB_OPERATION_DELAY);

      // Create a test tournament
      const tournamentName = `Test Tournament for Status Update ${Date.now()}`;
      const tournament = await db.insert(tournaments).values({
        creatorId: user[0].id,
        name: tournamentName,
        durationDays: 7,
        startDate: new Date(),
        timezone: 'UTC',
      }).returning();
      console.log('Created test tournament:', tournament[0].id);

      // Verify tournament exists before proceeding
      const verifyTournament = await db.select().from(tournaments).where(eq(tournaments.id, tournament[0].id));
      expect(verifyTournament.length).toBe(1);
      
      // Longer delay to ensure transaction is committed
      await sleep(DB_OPERATION_DELAY);

      // Double check tournament exists using raw SQL to bypass any potential ORM caching
      const rawCheck = await db.execute(
        `SELECT * FROM tournaments WHERE id = '${tournament[0].id}'`
      );
      expect(rawCheck.rows.length).toBe(1);
      console.log('Verified tournament exists through raw SQL');

      // Short delay before participant creation
      await sleep(VERIFICATION_DELAY);

      // Create tournament participant
      const participantData = {
        tournamentId: tournament[0].id,
        userId: user[0].id,
        status: 'invited'
      };
      const newParticipant = await db.insert(tournamentParticipants).values(participantData).returning();
      console.log('Created tournament participant:', newParticipant[0].id);

      // Ensure participant was created
      const verifyParticipant = await db.select().from(tournamentParticipants)
        .where(eq(tournamentParticipants.id, newParticipant[0].id));
      expect(verifyParticipant.length).toBe(1);
      
      // Small delay before the update
      await sleep(VERIFICATION_DELAY);

      // Update participant status
      await db.update(tournamentParticipants)
        .set({ status: 'accepted' })
        .where(eq(tournamentParticipants.id, newParticipant[0].id))
        .execute();
      console.log('Updated participant status');

      // Fetch updated participant
      const updatedParticipant = await db.select()
        .from(tournamentParticipants)
        .where(eq(tournamentParticipants.id, newParticipant[0].id));
      console.log('Retrieved updated participant');

      expect(updatedParticipant[0].status).toBe('accepted');
      console.log('Test completed: should update tournament participant status');
    } catch (error) {
      console.error('Test failed with error:', error);
      // Log detailed error information for debugging
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      throw error; // Re-throw the error to fail the test
    }
  }, 15000);
});
