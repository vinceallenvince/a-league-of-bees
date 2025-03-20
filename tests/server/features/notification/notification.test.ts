import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { eq, and, inArray, sql, desc } from 'drizzle-orm';
import { testDb as db, setupTestDb, teardownTestDb, cleanupDatabase, sleep } from '../../core/test-db';
import { users, tournaments, notifications } from '../../../../shared/schema';

describe('Notification Feature', () => {
  jest.setTimeout(60000); // 60 second timeout for the whole suite
  
  beforeAll(async () => {
    console.log('Starting notification feature test setup...');
    await setupTestDb();
    // Run cleanup after setup to ensure a clean database
    await cleanupDatabase();
    console.log('Notification feature test setup completed');
  }, 30000);

  afterAll(async () => {
    console.log('Starting notification feature test teardown...');
    await teardownTestDb();
    console.log('Notification feature test teardown completed');
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

  it('should get paginated notifications for a user', async () => {
    console.log('Starting test: should get paginated notifications for a user');
    
    // Create a test user
    const user = await db.insert(users).values({
      email: 'notification-pagination@example.com',
      otpAttempts: 0
    }).returning();
    console.log('Created test user:', user[0].id);

    // Create a test tournament
    const tournament = await db.insert(tournaments).values({
      creatorId: user[0].id,
      name: 'Notification Pagination Tournament',
      durationDays: 7,
      startDate: new Date(),
      timezone: 'UTC',
    }).returning();
    console.log('Created test tournament:', tournament[0].id);

    // Create multiple notifications
    const notificationTypes = ['invitation', 'reminder', 'tournament_start'];
    
    for (let i = 0; i < notificationTypes.length; i++) {
      await db.insert(notifications).values({
        tournamentId: tournament[0].id,
        userId: user[0].id,
        type: notificationTypes[i],
        message: `Test notification ${i + 1}`,
        read: i % 2 === 0 // alternating read status
      });
    }
    console.log(`Created ${notificationTypes.length} notifications`);

    // Get all notifications for the user
    const page = 1;
    const pageSize = 10;
    const allUserNotifications = await db.select()
      .from(notifications)
      .where(eq(notifications.userId, user[0].id))
      .limit(pageSize)
      .offset((page - 1) * pageSize);
    
    // Count total
    const countResult = await db.select({ count: sql`COUNT(*)` })
      .from(notifications)
      .where(eq(notifications.userId, user[0].id));
    
    const total = Number(countResult[0].count);

    // Verify pagination results
    expect(allUserNotifications.length).toBe(notificationTypes.length);
    expect(total).toBe(notificationTypes.length);
    console.log('Test completed: should get paginated notifications for a user');
  }, 10000);

  it('should filter notifications by type', async () => {
    console.log('Starting test: should filter notifications by type');
    
    // Create a test user
    const user = await db.insert(users).values({
      email: 'notification-filter@example.com',
      otpAttempts: 0
    }).returning();
    console.log('Created test user:', user[0].id);

    // Create a test tournament
    const tournament = await db.insert(tournaments).values({
      creatorId: user[0].id,
      name: 'Notification Filter Tournament',
      durationDays: 7,
      startDate: new Date(),
      timezone: 'UTC',
    }).returning();
    console.log('Created test tournament:', tournament[0].id);

    // Create multiple notifications of different types
    const notificationTypes = ['invitation', 'reminder', 'tournament_start', 'reminder'];
    
    for (let i = 0; i < notificationTypes.length; i++) {
      await db.insert(notifications).values({
        tournamentId: tournament[0].id,
        userId: user[0].id,
        type: notificationTypes[i],
        message: `Test ${notificationTypes[i]} notification`,
        read: false
      });
    }
    console.log(`Created ${notificationTypes.length} notifications`);

    // Filter by 'reminder' type
    const filterType = 'reminder';
    const filteredNotifications = await db.select()
      .from(notifications)
      .where(and(
        eq(notifications.userId, user[0].id),
        eq(notifications.type, filterType)
      ));
    
    // Verify filter results
    expect(filteredNotifications.length).toBe(2); // We created 2 'reminder' type notifications
    filteredNotifications.forEach(notification => {
      expect(notification.type).toBe(filterType);
    });
    
    console.log('Test completed: should filter notifications by type');
  }, 10000);

  it('should mark notifications as read', async () => {
    console.log('Starting test: should mark notifications as read');
    
    // Create a test user
    const user = await db.insert(users).values({
      email: 'notification-mark-read@example.com',
      otpAttempts: 0
    }).returning();
    console.log('Created test user:', user[0].id);

    // Create a test tournament
    const tournament = await db.insert(tournaments).values({
      creatorId: user[0].id,
      name: 'Notification Mark Read Tournament',
      durationDays: 7,
      startDate: new Date(),
      timezone: 'UTC',
    }).returning();
    console.log('Created test tournament:', tournament[0].id);

    // Create multiple unread notifications
    const notificationData = [
      {
        tournamentId: tournament[0].id,
        userId: user[0].id,
        type: 'invitation',
        message: 'Invitation notification',
        read: false
      },
      {
        tournamentId: tournament[0].id,
        userId: user[0].id,
        type: 'reminder',
        message: 'Reminder notification',
        read: false
      }
    ];
    
    const createdNotifications = await db.insert(notifications)
      .values(notificationData)
      .returning();
    
    console.log(`Created ${createdNotifications.length} unread notifications`);

    // Get IDs of notifications to mark as read
    const notificationIds = createdNotifications.map(n => n.id);
    
    // Mark notifications as read
    await db.update(notifications)
      .set({ read: true })
      .where(and(
        inArray(notifications.id, notificationIds),
        eq(notifications.userId, user[0].id)
      ))
      .execute();
    
    console.log(`Marked ${notificationIds.length} notifications as read`);
    
    // Verify notifications are marked as read
    const updatedNotifications = await db.select()
      .from(notifications)
      .where(inArray(notifications.id, notificationIds));
    
    expect(updatedNotifications.length).toBe(notificationIds.length);
    updatedNotifications.forEach(notification => {
      expect(notification.read).toBe(true);
    });
    
    console.log('Test completed: should mark notifications as read');
  }, 10000);

  it('should count unread notifications', async () => {
    console.log('Starting test: should count unread notifications');
    
    // Create a test user
    const user = await db.insert(users).values({
      email: 'notification-count@example.com',
      otpAttempts: 0
    }).returning();
    console.log('Created test user:', user[0].id);

    // Create a test tournament
    const tournament = await db.insert(tournaments).values({
      creatorId: user[0].id,
      name: 'Notification Count Tournament',
      durationDays: 7,
      startDate: new Date(),
      timezone: 'UTC',
    }).returning();
    console.log('Created test tournament:', tournament[0].id);

    // Create mix of read and unread notifications
    const notificationData = [
      {
        tournamentId: tournament[0].id,
        userId: user[0].id,
        type: 'invitation',
        message: 'Invitation notification',
        read: false
      },
      {
        tournamentId: tournament[0].id,
        userId: user[0].id,
        type: 'reminder',
        message: 'Reminder notification',
        read: true
      },
      {
        tournamentId: tournament[0].id,
        userId: user[0].id,
        type: 'tournament_start',
        message: 'Tournament start notification',
        read: false
      }
    ];
    
    await db.insert(notifications).values(notificationData);
    console.log(`Created ${notificationData.length} notifications (mixed read/unread)`);

    // Count unread notifications
    const unreadResult = await db.select({ count: sql`COUNT(*)` })
      .from(notifications)
      .where(and(
        eq(notifications.userId, user[0].id),
        eq(notifications.read, false)
      ));
    
    const unreadCount = Number(unreadResult[0].count);
    
    // Verify unread count
    expect(unreadCount).toBe(2); // We created 2 unread notifications
    
    console.log('Test completed: should count unread notifications');
  }, 10000);
}); 