import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { eq } from 'drizzle-orm';
import { testDb as db, setupTestDb, teardownTestDb, cleanupDatabase, sleep } from '../../core/test-db';
import { 
  users, 
  tournaments, 
  tournamentParticipants, 
  tournamentScores, 
  notifications,
  adminApprovals 
} from '../../../../shared/schema';

// Re-enabling the integration tests by removing .skip
describe('Tournament Integration Tests', () => {
  // Run tests sequentially instead of in parallel
  jest.setTimeout(60000); // 60 second timeout for the whole suite

  beforeAll(async () => {
    console.log('Starting integration test setup...');
    await setupTestDb();
    // Run cleanup after setup to ensure a clean database
    await cleanupDatabase();
    console.log('Integration test setup completed');
  }, 30000);

  afterAll(async () => {
    console.log('Starting integration test teardown...');
    await teardownTestDb();
    console.log('Integration test teardown completed');
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

  describe('Foreign Key Relationships', () => {
    it('should enforce user foreign key in tournaments', async () => {
      console.log('Testing user foreign key in tournaments');
      await expect(db.insert(tournaments).values({
        creatorId: '00000000-0000-0000-0000-000000000000',
        name: 'Test Tournament',
        durationDays: 7,
        startDate: new Date(),
        timezone: 'UTC',
      })).rejects.toThrow();
      console.log('User foreign key test passed');
    }, 10000);

    it('should enforce tournament foreign key in participants', async () => {
      console.log('Testing tournament foreign key in participants');
      // Create a test user
      const user = await db.insert(users).values({
        email: 'test@example.com',
        otpAttempts: 0
      }).returning();
      console.log('Created test user:', user[0].id);

      await expect(db.insert(tournamentParticipants).values({
        tournamentId: '00000000-0000-0000-0000-000000000000',
        userId: user[0].id,
        status: 'invited'
      })).rejects.toThrow();
      console.log('Tournament foreign key test passed');
    }, 10000);

    it('should enforce tournament and user foreign keys in scores', async () => {
      console.log('Testing tournament and user foreign keys in scores');
      await expect(db.insert(tournamentScores).values({
        tournamentId: '00000000-0000-0000-0000-000000000000',
        userId: '00000000-0000-0000-0000-000000000000',
        day: 1,
        score: 100
      })).rejects.toThrow();
      console.log('Tournament and user foreign keys test passed');
    }, 10000);

    it('should enforce tournament and user foreign keys in notifications', async () => {
      console.log('Testing tournament and user foreign keys in notifications');
      await expect(db.insert(notifications).values({
        tournamentId: '00000000-0000-0000-0000-000000000000',
        userId: '00000000-0000-0000-0000-000000000000',
        type: 'invitation',
        message: 'Test notification'
      })).rejects.toThrow();
      console.log('Tournament and user foreign keys in notifications test passed');
    }, 10000);
  });

  describe('Cascade Operations', () => {
    it('should delete related records when a tournament is deleted', async () => {
      console.log('Testing cascade delete operations');
      
      // Create a test user
      const user = await db.insert(users).values({
        email: 'cascade-test@example.com',
        otpAttempts: 0
      }).returning();
      console.log('Created test user:', user[0].id);

      // Create a test tournament
      const tournament = await db.insert(tournaments).values({
        creatorId: user[0].id,
        name: 'Cascade Test Tournament',
        durationDays: 7,
        startDate: new Date(),
        timezone: 'UTC',
      }).returning();
      console.log('Created test tournament:', tournament[0].id);

      // Create tournament participant
      const participant = await db.insert(tournamentParticipants).values({
        tournamentId: tournament[0].id,
        userId: user[0].id,
        status: 'accepted'
      }).returning();
      console.log('Created tournament participant:', participant[0].id);
      
      // Create tournament score
      const score = await db.insert(tournamentScores).values({
        tournamentId: tournament[0].id,
        userId: user[0].id,
        day: 1,
        score: 100
      }).returning();
      console.log('Created tournament score:', score[0].id);
      
      // Create notification
      const notification = await db.insert(notifications).values({
        tournamentId: tournament[0].id,
        userId: user[0].id,
        type: 'reminder',
        message: 'Tournament starts tomorrow'
      }).returning();
      console.log('Created notification:', notification[0].id);
      
      // Delete tournament and verify cascade deletes
      await db.delete(tournaments)
        .where(eq(tournaments.id, tournament[0].id))
        .execute();
      console.log('Deleted tournament');
      
      // Verify participants were deleted
      const remainingParticipants = await db.select()
        .from(tournamentParticipants)
        .where(eq(tournamentParticipants.tournamentId, tournament[0].id));
      expect(remainingParticipants.length).toBe(0);
      console.log('Verified participants were deleted');
      
      // Verify scores were deleted
      const remainingScores = await db.select()
        .from(tournamentScores)
        .where(eq(tournamentScores.tournamentId, tournament[0].id));
      expect(remainingScores.length).toBe(0);
      console.log('Verified scores were deleted');
      
      // Verify notifications were deleted
      const remainingNotifications = await db.select()
        .from(notifications)
        .where(eq(notifications.tournamentId, tournament[0].id));
      expect(remainingNotifications.length).toBe(0);
      console.log('Verified notifications were deleted');
      
      console.log('Cascade delete test passed');
    }, 10000);
  });

  describe('Constraint Validations', () => {
    it('should enforce unique email constraint on users', async () => {
      console.log('Testing unique email constraint');
      const email = 'unique@example.com';
      
      // Create initial user
      await db.insert(users).values({
        email,
        otpAttempts: 0
      });
      console.log('Created first user with email:', email);

      // Try to create another user with the same email
      await expect(db.insert(users).values({
        email,
        otpAttempts: 0
      })).rejects.toThrow();
      console.log('Unique email constraint test passed');
    }, 10000);

    it('should enforce non-null constraints', async () => {
      console.log('Testing non-null constraints');
      // Create a test user
      const user = await db.insert(users).values({
        email: 'constraints@example.com',
        otpAttempts: 0
      }).returning();
      console.log('Created test user:', user[0].id);

      // Try to create a tournament with a null name (using correct field names)
      await expect(db.insert(tournaments).values({
        creatorId: user[0].id,
        name: undefined,
        durationDays: 7,
        startDate: new Date(),
        timezone: 'UTC',
      } as any)).rejects.toThrow();
      console.log('Non-null constraint test passed');
    }, 10000);
  });
});
