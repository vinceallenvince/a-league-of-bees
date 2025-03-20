import { db } from '../db';
import * as queries from '../queries';
import { and, count, eq, gte, sql } from 'drizzle-orm';
import { tournaments, tournamentParticipants, notifications } from '../../../../shared/schema';
import logger from '../../../core/logger';
import { storage } from '../../../core/storage';

/**
 * Dashboard service for aggregating user dashboard data
 */
export const dashboardService = {
  /**
   * Get dashboard data for a user
   */
  async getDashboardData(userId: string) {
    try {
      // Get user information
      const user = await storage.getUserById(userId);
      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }
      
      // Tournament summary - count tournaments by status
      const tournamentStatusCounts = await db.select({
        status: tournaments.status,
        count: count()
      })
      .from(tournaments)
      .where(eq(tournaments.creatorId, userId))
      .groupBy(tournaments.status);
      
      // Convert to a more usable format
      const tournamentSummary = {
        active: 0,
        pending: 0,
        completed: 0, 
        cancelled: 0
      };
      
      tournamentStatusCounts.forEach(item => {
        if (item.status === 'in_progress') {
          tournamentSummary.active = Number(item.count);
        } else if (item.status === 'pending') {
          tournamentSummary.pending = Number(item.count);
        } else if (item.status === 'completed') {
          tournamentSummary.completed = Number(item.count);
        } else if (item.status === 'cancelled') {
          tournamentSummary.cancelled = Number(item.count);
        }
      });
      
      // Participation metrics - hosting, joined, invited
      const hosting = await db.select({ count: count() })
        .from(tournaments)
        .where(eq(tournaments.creatorId, userId));
      
      const joined = await db.select({ count: count() })
        .from(tournamentParticipants)
        .where(and(
          eq(tournamentParticipants.userId, userId),
          eq(tournamentParticipants.status, 'joined')
        ));
      
      const invited = await db.select({ count: count() })
        .from(tournamentParticipants)
        .where(and(
          eq(tournamentParticipants.userId, userId),
          eq(tournamentParticipants.status, 'invited')
        ));
      
      const participation = {
        hosting: Number(hosting[0]?.count || 0),
        joined: Number(joined[0]?.count || 0),
        invited: Number(invited[0]?.count || 0)
      };
      
      // Recent activity - from notifications
      const recentNotifications = await db.select()
        .from(notifications)
        .where(eq(notifications.userId, userId))
        .orderBy(sql`created_at DESC`)
        .limit(5);
      
      // Enhance notifications with tournament names
      const recentActivity = await Promise.all(
        recentNotifications.map(async notification => {
          const tournament = await db.query.tournaments.findFirst({
            where: eq(tournaments.id, notification.tournamentId)
          });
          
          return {
            id: notification.id,
            type: notification.type,
            tournamentId: notification.tournamentId,
            tournamentName: tournament?.name || 'Unknown tournament',
            message: notification.message,
            timestamp: notification.createdAt,
            read: notification.read
          };
        })
      );
      
      // Upcoming tournaments - pending tournaments starting soon
      const now = new Date();
      const inThreedays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      
      // Tournaments created by the user
      const createdUpcoming = await db.select({
        id: tournaments.id,
        name: tournaments.name,
        startDate: tournaments.startDate,
        creatorId: tournaments.creatorId
      })
      .from(tournaments)
      .where(and(
        eq(tournaments.creatorId, userId),
        eq(tournaments.status, 'pending'),
        gte(tournaments.startDate, now)
      ))
      .orderBy(tournaments.startDate)
      .limit(5);
      
      // Tournaments user is participating in
      const joinedUpcoming = await db.select({
        id: tournaments.id,
        name: tournaments.name,
        startDate: tournaments.startDate,
        creatorId: tournaments.creatorId
      })
      .from(tournaments)
      .innerJoin(
        tournamentParticipants,
        and(
          eq(tournaments.id, tournamentParticipants.tournamentId),
          eq(tournamentParticipants.userId, userId),
          eq(tournamentParticipants.status, 'joined')
        )
      )
      .where(and(
        eq(tournaments.status, 'pending'),
        gte(tournaments.startDate, now)
      ))
      .orderBy(tournaments.startDate)
      .limit(5);
      
      // Combine and sort by start date
      const upcomingTournaments = [...createdUpcoming, ...joinedUpcoming]
        .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
        .slice(0, 5);
      
      // Return aggregated dashboard data
      return {
        userInfo: {
          id: user.id,
          username: user.username || user.email.split('@')[0],
          email: user.email
        },
        tournamentSummary,
        participation,
        recentActivity,
        upcomingTournaments,
        unreadNotificationsCount: recentActivity.filter(a => !a.read).length
      };
    } catch (error) {
      logger.error('Error getting dashboard data', { error, userId });
      throw error;
    }
  }
}; 