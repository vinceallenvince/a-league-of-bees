import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { eq } from 'drizzle-orm';
import { testDb as db, setupTestDb, teardownTestDb, cleanupDatabase, sleep } from '../../core/test-db';
import { users, tournaments, notifications } from '../../../../shared/schema';

// Re-enabling test, removing the skip
describe('Notifications', () => {
  jest.setTimeout(60000); // 60 second timeout for the whole suite
  
  beforeAll(async () => {
    console.log('Starting notifications test setup...');
    await setupTestDb();
    // Run cleanup after setup to ensure a clean database
    await cleanupDatabase();
    console.log('Notifications test setup completed');
  }, 30000);

  afterAll(async () => {
    console.log('Starting notifications test teardown...');
    await teardownTestDb();
    console.log('Notifications test teardown completed');
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

  it('should create notification', async () => {
    console.log('Starting test: should create notification');
    // Create a test user
    const user = await db.insert(users).values({
      email: 'notification-test@example.com',
      otpAttempts: 0
    }).returning();
    console.log('Created test user:', user[0].id);

    // Create a test tournament
    const tournament = await db.insert(tournaments).values({
      creatorId: user[0].id,
      name: 'Notification Test Tournament',
      durationDays: 7,
      startDate: new Date(),
      timezone: 'UTC',
    }).returning();
    console.log('Created test tournament:', tournament[0].id);

    // Create notification
    const notification = await db.insert(notifications).values({
      tournamentId: tournament[0].id,
      userId: user[0].id,
      type: 'invitation',
      message: 'You have been invited to join a tournament',
      read: false
    }).returning();
    console.log('Created notification:', notification[0].id);

    expect(notification[0].tournamentId).toBe(tournament[0].id);
    expect(notification[0].userId).toBe(user[0].id);
    expect(notification[0].type).toBe('invitation');
    expect(notification[0].message).toBe('You have been invited to join a tournament');
    expect(notification[0].read).toBe(false);
    console.log('Test completed: should create notification');
  }, 10000);

  it('should update notification read status', async () => {
    console.log('Starting test: should update notification read status');
    // Create a test user
    const user = await db.insert(users).values({
      email: 'notification-update@example.com',
      otpAttempts: 0
    }).returning();
    console.log('Created test user:', user[0].id);

    // Create a test tournament
    const tournament = await db.insert(tournaments).values({
      creatorId: user[0].id,
      name: 'Notification Update Tournament',
      durationDays: 7,
      startDate: new Date(),
      timezone: 'UTC',
    }).returning();
    console.log('Created test tournament:', tournament[0].id);

    // Create notification
    const notification = await db.insert(notifications).values({
      tournamentId: tournament[0].id,
      userId: user[0].id,
      type: 'reminder',
      message: 'Tournament starts tomorrow',
      read: false
    }).returning();
    console.log('Created notification:', notification[0].id);

    // Update notification read status
    await db.update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, notification[0].id))
      .execute();
    console.log('Updated notification read status');

    // Fetch updated notification
    const updatedNotification = await db.select()
      .from(notifications)
      .where(eq(notifications.id, notification[0].id));
    console.log('Retrieved updated notification');

    expect(updatedNotification[0].read).toBe(true);
    console.log('Test completed: should update notification read status');
  }, 10000);
});
