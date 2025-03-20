import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { testDb as db, setupTestDb, teardownTestDb, cleanupDatabase, sleep } from '../../core/test-db';
import { users, tournaments, tournamentParticipants, notifications } from '../../../../shared/schema';

// Determine if running in CI environment
const isCI = process.env.CI === 'true' || process.env.CI_ENVIRONMENT === 'true';

// Adjust delay times based on environment
const CLEANUP_DELAY = isCI ? 2000 : 1000;
const DB_OPERATION_DELAY = isCI ? 1000 : 500; 
const VERIFICATION_DELAY = isCI ? 500 : 200;

describe('Dashboard and Notification Flow', () => {
  jest.setTimeout(60000); // 60 second timeout for the whole suite
  
  beforeAll(async () => {
    console.log('Starting dashboard integration test setup...');
    await setupTestDb();
    // Run cleanup after setup to ensure a clean database
    await cleanupDatabase();
    console.log('Dashboard integration test setup completed');
  }, 30000);

  afterAll(async () => {
    console.log('Starting dashboard integration test teardown...');
    await teardownTestDb();
    console.log('Dashboard integration test teardown completed');
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

  it('should handle the invitation → notification → mark as read flow', async () => {
    console.log('Starting test: should handle the invitation → notification → mark as read flow');
    
    try {
      // 1. Create tournament creator
      const creatorEmail = `creator-${Date.now()}@example.com`;
      const creator = await db.insert(users).values({
        id: uuidv4(),
        email: creatorEmail,
        otpAttempts: 0
      }).returning();
      console.log('Created creator user:', creator[0].id);

      // 2. Create participant to be invited
      const participantEmail = `participant-${Date.now()}@example.com`;
      const participant = await db.insert(users).values({
        id: uuidv4(),
        email: participantEmail,
        otpAttempts: 0
      }).returning();
      console.log('Created participant user:', participant[0].id);
      
      await sleep(DB_OPERATION_DELAY);

      // 3. Create a tournament
      const tournament = await db.insert(tournaments).values({
        id: uuidv4(),
        creatorId: creator[0].id,
        name: `Integration Test Tournament ${Date.now()}`,
        durationDays: 7,
        startDate: new Date(Date.now() + 86400000), // tomorrow
        timezone: 'UTC',
        status: 'pending'
      }).returning();
      console.log('Created tournament:', tournament[0].id);
      
      await sleep(DB_OPERATION_DELAY);

      // 4. Create invitation notification for the participant
      const notification = await db.insert(notifications).values({
        id: uuidv4(),
        userId: participant[0].id,
        tournamentId: tournament[0].id,
        type: 'invitation',
        message: `You have been invited to join ${tournament[0].name}`,
        read: false
      }).returning();
      console.log('Created invitation notification:', notification[0].id);
      
      // 5. Create tournament participant record
      await db.insert(tournamentParticipants).values({
        id: uuidv4(),
        tournamentId: tournament[0].id,
        userId: participant[0].id,
        status: 'invited'
      });
      console.log('Created participant invitation');
      
      await sleep(VERIFICATION_DELAY);

      // 6. Verify notification exists and is unread
      const verifyNotification = await db.select()
        .from(notifications)
        .where(eq(notifications.id, notification[0].id));
      
      expect(verifyNotification.length).toBe(1);
      expect(verifyNotification[0].read).toBe(false);
      console.log('Verified notification is unread');
      
      // 7. Mark notification as read
      await db.update(notifications)
        .set({ read: true })
        .where(eq(notifications.id, notification[0].id))
        .execute();
      console.log('Marked notification as read');
      
      await sleep(VERIFICATION_DELAY);
      
      // 8. Verify notification is now marked as read
      const updatedNotification = await db.select()
        .from(notifications)
        .where(eq(notifications.id, notification[0].id));
      
      expect(updatedNotification.length).toBe(1);
      expect(updatedNotification[0].read).toBe(true);
      console.log('Verified notification is now marked as read');
      
      console.log('Test completed: should handle the invitation → notification → mark as read flow');
    } catch (error) {
      console.error('Test failed with error:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      throw error;
    }
  }, 30000);

  it('should handle the tournament start → notification creation flow', async () => {
    console.log('Starting test: should handle the tournament start → notification creation flow');
    
    try {
      // 1. Create tournament creator
      const creator = await db.insert(users).values({
        id: uuidv4(),
        email: `creator-start-${Date.now()}@example.com`,
        otpAttempts: 0
      }).returning();
      
      // 2. Create participants
      const participant1 = await db.insert(users).values({
        id: uuidv4(),
        email: `participant1-start-${Date.now()}@example.com`,
        otpAttempts: 0
      }).returning();
      
      const participant2 = await db.insert(users).values({
        id: uuidv4(),
        email: `participant2-start-${Date.now()}@example.com`,
        otpAttempts: 0
      }).returning();
      
      await sleep(DB_OPERATION_DELAY);
      
      // 3. Create a tournament in pending status
      const tournament = await db.insert(tournaments).values({
        id: uuidv4(),
        creatorId: creator[0].id,
        name: `Start Flow Tournament ${Date.now()}`,
        durationDays: 7,
        startDate: new Date(),
        timezone: 'UTC',
        status: 'pending'
      }).returning();
      
      await sleep(DB_OPERATION_DELAY);
      
      // 4. Add participants to the tournament
      await db.insert(tournamentParticipants).values([
        {
          id: uuidv4(),
          tournamentId: tournament[0].id,
          userId: participant1[0].id,
          status: 'joined'
        },
        {
          id: uuidv4(),
          tournamentId: tournament[0].id,
          userId: participant2[0].id,
          status: 'joined'
        }
      ]);
      
      await sleep(DB_OPERATION_DELAY);
      
      // 5. Update tournament status to in_progress (tournament started)
      await db.update(tournaments)
        .set({ status: 'in_progress' })
        .where(eq(tournaments.id, tournament[0].id))
        .execute();
      
      // 6. Create tournament_start notifications for all participants
      await db.insert(notifications).values([
        {
          id: uuidv4(),
          userId: participant1[0].id,
          tournamentId: tournament[0].id,
          type: 'tournament_start',
          message: `Tournament ${tournament[0].name} has started`,
          read: false
        },
        {
          id: uuidv4(),
          userId: participant2[0].id,
          tournamentId: tournament[0].id,
          type: 'tournament_start',
          message: `Tournament ${tournament[0].name} has started`,
          read: false
        }
      ]);
      
      await sleep(VERIFICATION_DELAY);
      
      // 7. Verify notifications were created
      const verifyNotifications = await db.select()
        .from(notifications)
        .where(and(
          eq(notifications.tournamentId, tournament[0].id),
          eq(notifications.type, 'tournament_start')
        ));
      
      expect(verifyNotifications.length).toBe(2);
      expect(verifyNotifications[0].read).toBe(false);
      expect(verifyNotifications[1].read).toBe(false);
      
      console.log('Test completed: should handle the tournament start → notification creation flow');
    } catch (error) {
      console.error('Test failed with error:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      throw error;
    }
  }, 30000);

  it('should aggregate data for dashboard', async () => {
    console.log('Starting test: should aggregate data for dashboard');
    
    try {
      // 1. Create a user
      const user = await db.insert(users).values({
        id: uuidv4(),
        email: `dashboard-user-${Date.now()}@example.com`,
        otpAttempts: 0
      }).returning();
      
      await sleep(DB_OPERATION_DELAY);
      
      // 2. Create multiple tournaments with different statuses
      // Active tournament
      const activeTournament = await db.insert(tournaments).values({
        id: uuidv4(),
        creatorId: user[0].id,
        name: `Active Tournament ${Date.now()}`,
        durationDays: 7,
        startDate: new Date(),
        timezone: 'UTC',
        status: 'in_progress'
      }).returning();
      
      // Pending tournament
      const pendingTournament = await db.insert(tournaments).values({
        id: uuidv4(),
        creatorId: user[0].id,
        name: `Pending Tournament ${Date.now()}`,
        durationDays: 7,
        startDate: new Date(Date.now() + 86400000), // tomorrow
        timezone: 'UTC',
        status: 'pending'
      }).returning();
      
      // Create another user's tournament that our user joins
      const otherUser = await db.insert(users).values({
        id: uuidv4(),
        email: `other-user-${Date.now()}@example.com`,
        otpAttempts: 0
      }).returning();
      
      const joinedTournament = await db.insert(tournaments).values({
        id: uuidv4(),
        creatorId: otherUser[0].id,
        name: `Joined Tournament ${Date.now()}`,
        durationDays: 7,
        startDate: new Date(),
        timezone: 'UTC',
        status: 'in_progress'
      }).returning();
      
      await sleep(DB_OPERATION_DELAY);
      
      // 3. Add user as participant in the joined tournament
      await db.insert(tournamentParticipants).values({
        id: uuidv4(),
        tournamentId: joinedTournament[0].id,
        userId: user[0].id,
        status: 'joined'
      });
      
      // 4. Create notifications
      await db.insert(notifications).values([
        {
          id: uuidv4(),
          userId: user[0].id,
          tournamentId: joinedTournament[0].id,
          type: 'tournament_start',
          message: `Tournament ${joinedTournament[0].name} has started`,
          read: false
        },
        {
          id: uuidv4(),
          userId: user[0].id,
          tournamentId: pendingTournament[0].id,
          type: 'reminder',
          message: `Tournament ${pendingTournament[0].name} starts tomorrow`,
          read: true
        }
      ]);
      
      await sleep(VERIFICATION_DELAY);
      
      // 5. Verify we can count tournaments by status
      const activeTournaments = await db.select()
        .from(tournaments)
        .where(and(
          eq(tournaments.creatorId, user[0].id),
          eq(tournaments.status, 'in_progress')
        ));
      
      expect(activeTournaments.length).toBe(1);
      
      // 6. Verify we can get tournaments where user is participant
      const participatingTournaments = await db.select({
        tournament: tournaments,
        participation: tournamentParticipants
      })
      .from(tournaments)
      .innerJoin(
        tournamentParticipants,
        and(
          eq(tournaments.id, tournamentParticipants.tournamentId),
          eq(tournamentParticipants.userId, user[0].id),
          eq(tournamentParticipants.status, 'joined')
        )
      );
      
      expect(participatingTournaments.length).toBe(1);
      expect(participatingTournaments[0].tournament.id).toBe(joinedTournament[0].id);
      
      // 7. Verify we can get unread notifications
      const unreadNotifications = await db.select()
        .from(notifications)
        .where(and(
          eq(notifications.userId, user[0].id),
          eq(notifications.read, false)
        ));
      
      expect(unreadNotifications.length).toBe(1);
      
      console.log('Test completed: should aggregate data for dashboard');
    } catch (error) {
      console.error('Test failed with error:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      throw error;
    }
  }, 30000);
}); 