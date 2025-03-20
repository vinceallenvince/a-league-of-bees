import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { eq, and, count, desc } from 'drizzle-orm';
import { testDb as db, setupTestDb, teardownTestDb, cleanupDatabase, sleep } from '../../core/test-db';
import { users, tournaments, tournamentParticipants, notifications } from '../../../../shared/schema';
import type { TournamentStatus } from '../../../../server/features/tournament/types';

describe('Dashboard Feature', () => {
  jest.setTimeout(60000); // 60 second timeout for the whole suite
  
  beforeAll(async () => {
    console.log('Starting dashboard feature test setup...');
    await setupTestDb();
    // Run cleanup after setup to ensure a clean database
    await cleanupDatabase();
    console.log('Dashboard feature test setup completed');
  }, 30000);

  afterAll(async () => {
    console.log('Starting dashboard feature test teardown...');
    await teardownTestDb();
    console.log('Dashboard feature test teardown completed');
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

  it('should compile tournament summary data', async () => {
    console.log('Starting test: should compile tournament summary data');
    
    // Create a test user
    const user = await db.insert(users).values({
      email: 'dashboard-test@example.com',
      otpAttempts: 0
    }).returning();
    console.log('Created test user:', user[0].id);

    // Create tournaments with different statuses
    const tournamentData = [
      {
        creatorId: user[0].id,
        name: 'Active Tournament',
        durationDays: 7,
        startDate: new Date(),
        timezone: 'UTC',
        status: 'in_progress' as TournamentStatus
      },
      {
        creatorId: user[0].id,
        name: 'Pending Tournament',
        durationDays: 7,
        startDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        timezone: 'UTC',
        status: 'pending' as TournamentStatus
      },
      {
        creatorId: user[0].id,
        name: 'Completed Tournament',
        durationDays: 7,
        startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
        timezone: 'UTC',
        status: 'completed' as TournamentStatus
      }
    ];
    
    for (const data of tournamentData) {
      await db.insert(tournaments).values(data);
    }
    console.log(`Created ${tournamentData.length} tournaments with different statuses`);

    // Get tournament counts by status
    const tournamentStatusCounts = await db.select({
      status: tournaments.status,
      count: count()
    })
    .from(tournaments)
    .where(eq(tournaments.creatorId, user[0].id))
    .groupBy(tournaments.status);
    
    console.log('Tournament status counts:', tournamentStatusCounts);
    
    // Build summary object
    const summary = {
      active: 0,
      pending: 0,
      completed: 0,
      cancelled: 0
    };
    
    tournamentStatusCounts.forEach(item => {
      if (item.status === 'in_progress') {
        summary.active = Number(item.count);
      } else if (item.status === 'pending') {
        summary.pending = Number(item.count);
      } else if (item.status === 'completed') {
        summary.completed = Number(item.count);
      } else if (item.status === 'cancelled') {
        summary.cancelled = Number(item.count);
      }
    });
    
    // Verify the summary data
    expect(summary.active).toBe(1);
    expect(summary.pending).toBe(1);
    expect(summary.completed).toBe(1);
    expect(summary.cancelled).toBe(0);
    
    console.log('Test completed: should compile tournament summary data');
  }, 10000);

  it('should compile participation metrics', async () => {
    console.log('Starting test: should compile participation metrics');
    
    // Create multiple users
    const hostUser = await db.insert(users).values({
      email: 'host-user@example.com',
      otpAttempts: 0
    }).returning();
    
    const participantUser = await db.insert(users).values({
      email: 'participant-user@example.com',
      otpAttempts: 0
    }).returning();
    
    console.log('Created host user:', hostUser[0].id);
    console.log('Created participant user:', participantUser[0].id);

    // Create tournaments hosted by the first user
    const hostTournaments = [
      {
        creatorId: hostUser[0].id,
        name: 'Host Tournament 1',
        durationDays: 7,
        startDate: new Date(),
        timezone: 'UTC',
        status: 'in_progress' as TournamentStatus
      },
      {
        creatorId: hostUser[0].id,
        name: 'Host Tournament 2',
        durationDays: 7,
        startDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        timezone: 'UTC',
        status: 'pending' as TournamentStatus
      }
    ];
    
    const createdTournaments = [];
    for (const data of hostTournaments) {
      const tournament = await db.insert(tournaments).values(data).returning();
      createdTournaments.push(tournament[0]);
    }
    console.log(`Created ${hostTournaments.length} tournaments hosted by user`);
    
    // Create participation records for the second user
    await db.insert(tournamentParticipants).values({
      tournamentId: createdTournaments[0].id,
      userId: participantUser[0].id,
      status: 'joined'
    });
    
    await db.insert(tournamentParticipants).values({
      tournamentId: createdTournaments[1].id,
      userId: participantUser[0].id,
      status: 'invited'
    });
    
    console.log('Created participation records for participant user');
    
    // Get participation metrics for the participant user
    const hosting = await db.select({ count: count() })
      .from(tournaments)
      .where(eq(tournaments.creatorId, participantUser[0].id));
    
    const joined = await db.select({ count: count() })
      .from(tournamentParticipants)
      .where(and(
        eq(tournamentParticipants.userId, participantUser[0].id),
        eq(tournamentParticipants.status, 'joined')
      ));
    
    const invited = await db.select({ count: count() })
      .from(tournamentParticipants)
      .where(and(
        eq(tournamentParticipants.userId, participantUser[0].id),
        eq(tournamentParticipants.status, 'invited')
      ));
    
    const participation = {
      hosting: Number(hosting[0]?.count || 0),
      joined: Number(joined[0]?.count || 0),
      invited: Number(invited[0]?.count || 0)
    };
    
    // Verify participation metrics
    expect(participation.hosting).toBe(0);
    expect(participation.joined).toBe(1);
    expect(participation.invited).toBe(1);
    
    console.log('Test completed: should compile participation metrics');
  }, 10000);

  it('should compile recent activity from notifications', async () => {
    console.log('Starting test: should compile recent activity from notifications');
    
    // Create a test user
    const user = await db.insert(users).values({
      email: 'recent-activity@example.com',
      otpAttempts: 0
    }).returning();
    console.log('Created test user:', user[0].id);

    // Create a test tournament
    const tournament = await db.insert(tournaments).values({
      creatorId: user[0].id,
      name: 'Recent Activity Tournament',
      durationDays: 7,
      startDate: new Date(),
      timezone: 'UTC',
    }).returning();
    console.log('Created test tournament:', tournament[0].id);

    // Create various notifications as recent activity
    const notificationData = [
      {
        tournamentId: tournament[0].id,
        userId: user[0].id,
        type: 'invitation',
        message: 'You have been invited to join a tournament',
        read: false,
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000) // 3 hours ago
      },
      {
        tournamentId: tournament[0].id,
        userId: user[0].id,
        type: 'tournament_start',
        message: 'Tournament has started',
        read: true,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      },
      {
        tournamentId: tournament[0].id,
        userId: user[0].id,
        type: 'reminder',
        message: 'Daily reminder to submit your score',
        read: false,
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000) // 1 hour ago
      }
    ];
    
    for (const notification of notificationData) {
      await db.insert(notifications).values(notification);
    }
    console.log(`Created ${notificationData.length} notifications for recent activity`);

    // Get recent activity notifications
    const recentNotifications = await db.select()
      .from(notifications)
      .where(eq(notifications.userId, user[0].id))
      .orderBy(desc(notifications.createdAt))
      .limit(5);
    
    // Verify recent activity
    expect(recentNotifications.length).toBe(3);
    // Most recent notification should be first
    expect(recentNotifications[0].type).toBe('reminder');
    
    // Count unread notifications
    const unreadCount = recentNotifications.filter(n => !n.read).length;
    expect(unreadCount).toBe(2);
    
    console.log('Test completed: should compile recent activity from notifications');
  }, 10000);
}); 