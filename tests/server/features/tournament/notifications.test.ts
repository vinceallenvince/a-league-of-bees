import { describe, it, expect, beforeAll, afterAll, afterEach } from '@jest/globals';
import { tournaments, users, notifications, adminApprovals } from '../../../../shared/schema';
import { eq } from 'drizzle-orm';
import { testDb as db, setupTestDb, teardownTestDb } from '../../core/test-db';

describe('Notification Models', () => {
  beforeAll(async () => {
    console.log('Starting notifications test setup...');
    await setupTestDb();
    console.log('Notifications test setup completed');
  }, 30000);

  // Helper function to clean database tables
  async function cleanupTables() {
    try {
      // Clean up test data after each test in correct order
      await db.delete(notifications).execute();
      await db.delete(tournaments).execute();
      await db.delete(adminApprovals).execute();
      await db.delete(users).execute();
    } catch (error) {
      console.error('Error in test cleanup:', error);
    }
  }

  afterEach(async () => {
    await cleanupTables();
  });

  afterAll(async () => {
    console.log('Starting notifications test teardown...');
    await teardownTestDb();
    console.log('Notifications test teardown completed');
  }, 30000);

  it('should create a notification with valid data', async () => {
    // Create a test user
    const user = await db.insert(users).values({
      email: `notify_${Date.now()}@example.com`,
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

    // Create a notification
    const notification = await db.insert(notifications).values({
      userId: user[0].id,
      tournamentId: tournament[0].id,
      type: 'invitation',
      message: 'You have been invited to join Test Tournament',
    }).returning();

    expect(notification[0]).toHaveProperty('id');
    expect(notification[0].type).toBe('invitation');
    expect(notification[0].read).toBe(false);
  });

  it('should enforce foreign key constraints', async () => {
    await expect(db.insert(notifications).values({
      userId: '00000000-0000-0000-0000-000000000000',
      tournamentId: '00000000-0000-0000-0000-000000000000',
      type: 'invitation',
      message: 'Test message',
    })).rejects.toThrow();
  });
});
