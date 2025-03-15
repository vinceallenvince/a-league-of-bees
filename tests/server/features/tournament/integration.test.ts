import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { eq } from 'drizzle-orm';
import { testDb as db, setupTestDb, teardownTestDb } from '../../core/test-db';
import { 
  users, 
  tournaments, 
  tournamentParticipants, 
  tournamentScores, 
  notifications,
  adminApprovals 
} from '../../../../shared/schema';

describe('Tournament Integration Tests', () => {
  beforeAll(async () => {
    console.log('Starting integration test setup...');
    await setupTestDb();
    console.log('Integration test setup completed');
  }, 30000);

  afterAll(async () => {
    console.log('Starting integration test teardown...');
    await teardownTestDb();
    console.log('Integration test teardown completed');
  }, 30000);

  // Helper function to clean database tables
  async function cleanupTables() {
    try {
      // Delete in proper order to respect foreign key constraints
      await db.delete(notifications).execute();
      await db.delete(tournamentScores).execute();
      await db.delete(tournamentParticipants).execute();
      await db.delete(tournaments).execute();
      await db.delete(adminApprovals).execute();
      await db.delete(users).execute();
    } catch (error) {
      console.error('Error in test cleanup:', error);
    }
  }

  beforeEach(async () => {
    // Ensure clean state before each test
    await cleanupTables();
  });

  afterEach(async () => {
    // Clean up after each test
    await cleanupTables();
  });

  describe('Foreign Key Relationships', () => {
    it('should enforce user foreign key in tournaments', async () => {
      await expect(db.insert(tournaments).values({
        creatorId: '00000000-0000-0000-0000-000000000000',
        name: 'Test Tournament',
        durationDays: 7,
        startDate: new Date(),
        timezone: 'UTC',
      })).rejects.toThrow();
    });

    it('should enforce tournament foreign key in participants', async () => {
      // Create a test user
      const user = await db.insert(users).values({
        email: 'test@example.com',
        otpAttempts: 0
      }).returning();

      await expect(db.insert(tournamentParticipants).values({
        tournamentId: '00000000-0000-0000-0000-000000000000',
        userId: user[0].id,
        status: 'invited'
      })).rejects.toThrow();
    });

    it('should enforce tournament and user foreign keys in scores', async () => {
      await expect(db.insert(tournamentScores).values({
        tournamentId: '00000000-0000-0000-0000-000000000000',
        userId: '00000000-0000-0000-0000-000000000000',
        day: 1,
        score: 100
      })).rejects.toThrow();
    });

    it('should enforce tournament and user foreign keys in notifications', async () => {
      await expect(db.insert(notifications).values({
        tournamentId: '00000000-0000-0000-0000-000000000000',
        userId: '00000000-0000-0000-0000-000000000000',
        type: 'invitation',
        message: 'Test notification'
      })).rejects.toThrow();
    });
  });

  describe('Cascade Operations', () => {
    it.todo('should delete related records when a tournament is deleted - TODO: Fix cascade delete implementation');
  });

  describe('Constraint Validations', () => {
    it('should enforce unique email constraint on users', async () => {
      const email = 'unique@example.com';
      
      // Create initial user
      await db.insert(users).values({
        email,
        otpAttempts: 0
      });

      // Try to create another user with the same email
      await expect(db.insert(users).values({
        email,
        otpAttempts: 0
      })).rejects.toThrow();
    });

    it('should enforce non-null constraints', async () => {
      // Create a test user
      const user = await db.insert(users).values({
        email: 'constraints@example.com',
        otpAttempts: 0
      }).returning();

      // Try to create a tournament with a null name
      await expect(db.insert(tournaments).values({
        creator_id: user[0].id,
        name: undefined,
        duration_days: 7,
        start_date: new Date(),
        timezone: 'UTC',
      } as any)).rejects.toThrow();
    });
  });
});
