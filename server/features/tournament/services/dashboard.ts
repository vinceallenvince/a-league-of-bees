import { db } from '../db';
import * as queries from '../queries';
import { and, count, eq, gte, sql } from 'drizzle-orm';
import { tournaments, tournamentParticipants, notifications } from '../../../../shared/schema';
import logger from '../../../core/logger';
import { storage } from '../../../core/storage';
import cacheService from '../../../core/cache';

// Cache TTL constants
const CACHE_TTL = {
  DASHBOARD_DATA: 5 * 60 * 1000, // 5 minutes
  USER_INFO: 30 * 60 * 1000, // 30 minutes
};

// Cache key prefixes for group invalidation
const CACHE_PREFIX = {
  DASHBOARD: 'dashboard',
  TOURNAMENT: 'tournament',
  USER: 'user',
  NOTIFICATION: 'notification',
};

/**
 * Dashboard service for aggregating user dashboard data
 */
export const dashboardService = {
  /**
   * Get dashboard data for a user
   */
  async getDashboardData(userId: string) {
    // Generate cache key for the user's dashboard
    const cacheKey = `dashboard:${userId}`;
    
    // Return cached data if available
    return cacheService.getOrSet(
      cacheKey,
      async () => {
        try {
          // Fetch user information (this can be cached separately with longer TTL)
          const user = await this.getUserInfo(userId);
          
          // Execute all dashboard queries in parallel for better performance
          const [
            tournamentStatusCounts,
            participation,
            recentActivity,
            upcomingTournaments
          ] = await Promise.all([
            this.getTournamentSummary(userId),
            this.getParticipationMetrics(userId),
            this.getRecentActivity(userId),
            this.getUpcomingTournaments(userId)
          ]);
          
          // Return aggregated dashboard data
          return {
            userInfo: {
              id: user.id,
              username: user.username || user.email.split('@')[0],
              email: user.email
            },
            tournamentSummary: tournamentStatusCounts,
            participation,
            recentActivity,
            upcomingTournaments,
            unreadNotificationsCount: recentActivity.filter(a => !a.read).length
          };
        } catch (error) {
          logger.error('Error getting dashboard data', { error, userId });
          throw error;
        }
      },
      CACHE_TTL.DASHBOARD_DATA,
      [
        CACHE_PREFIX.DASHBOARD,
        `${CACHE_PREFIX.USER}:${userId}`,
        `${CACHE_PREFIX.TOURNAMENT}:created_by:${userId}`,
        `${CACHE_PREFIX.NOTIFICATION}:user:${userId}`
      ]
    );
  },
  
  /**
   * Get user information with caching
   */
  async getUserInfo(userId: string) {
    const cacheKey = `user:${userId}`;
    
    return cacheService.getOrSet(
      cacheKey,
      async () => {
        const user = await storage.getUserById(userId);
        if (!user) {
          throw new Error(`User not found: ${userId}`);
        }
        return user;
      },
      CACHE_TTL.USER_INFO,
      [`${CACHE_PREFIX.USER}:${userId}`]
    );
  },
  
  /**
   * Get tournament summary for a user
   */
  async getTournamentSummary(userId: string) {
    // Optimize by using a single query instead of multiple separate counts
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
    
    return tournamentSummary;
  },
  
  /**
   * Get participation metrics for a user
   */
  async getParticipationMetrics(userId: string) {
    // Optimize with a more efficient query that gets all counts in one go
    const result = await db.execute<{ hosting: string, joined: string, invited: string }>(sql`
      SELECT
        (SELECT COUNT(*) FROM tournaments WHERE creator_id = ${userId}) as hosting,
        (SELECT COUNT(*) FROM tournament_participants WHERE user_id = ${userId} AND status = 'joined') as joined,
        (SELECT COUNT(*) FROM tournament_participants WHERE user_id = ${userId} AND status = 'invited') as invited
    `);
    
    return {
      hosting: Number(result[0]?.hosting || 0),
      joined: Number(result[0]?.joined || 0),
      invited: Number(result[0]?.invited || 0)
    };
  },
  
  /**
   * Get recent activity for a user
   */
  async getRecentActivity(userId: string) {
    // Optimize the query to join with tournaments directly
    const recentActivityData = await db.execute<{
      id: string,
      type: string,
      tournament_id: string,
      tournament_name: string,
      message: string,
      created_at: string,
      read: boolean
    }>(sql`
      SELECT 
        n.id, 
        n.type, 
        n.tournament_id, 
        t.name as tournament_name, 
        n.message, 
        n.created_at, 
        n.read
      FROM notifications n
      JOIN tournaments t ON n.tournament_id = t.id
      WHERE n.user_id = ${userId}
      ORDER BY n.created_at DESC
      LIMIT 5
    `);
    
    // Map the result to the expected format
    return recentActivityData.map(notification => ({
      id: notification.id,
      type: notification.type,
      tournamentId: notification.tournament_id,
      tournamentName: notification.tournament_name || 'Unknown tournament',
      message: notification.message,
      timestamp: new Date(notification.created_at),
      read: notification.read
    }));
  },
  
  /**
   * Get upcoming tournaments for a user
   */
  async getUpcomingTournaments(userId: string) {
    const now = new Date();
    
    // Optimize by using a single query with UNION to get both created and joined tournaments
    const upcomingTournamentsData = await db.execute<{
      id: string,
      name: string,
      start_date: string,
      creator_id: string
    }>(sql`
      (
        SELECT
          t.id,
          t.name,
          t.start_date,
          t.creator_id
        FROM tournaments t
        WHERE
          t.creator_id = ${userId}
          AND t.status = 'pending'
          AND t.start_date >= ${now}
        ORDER BY t.start_date
        LIMIT 5
      )
      UNION
      (
        SELECT
          t.id,
          t.name,
          t.start_date,
          t.creator_id
        FROM tournaments t
        JOIN tournament_participants tp ON t.id = tp.tournament_id
        WHERE
          tp.user_id = ${userId}
          AND tp.status = 'joined'
          AND t.status = 'pending'
          AND t.start_date >= ${now}
        ORDER BY t.start_date
        LIMIT 5
      )
      ORDER BY start_date
      LIMIT 5
    `);
    
    // Map the results to the expected format
    return upcomingTournamentsData.map(tournament => ({
      id: tournament.id,
      name: tournament.name,
      startDate: new Date(tournament.start_date),
      creatorId: tournament.creator_id
    }));
  },
  
  /**
   * Invalidate dashboard cache for a user
   */
  invalidateUserDashboard(userId: string) {
    cacheService.invalidateByPrefix(`${CACHE_PREFIX.USER}:${userId}`);
    cacheService.invalidateByPrefix(`${CACHE_PREFIX.DASHBOARD}:${userId}`);
    logger.debug('Invalidated dashboard cache', { userId });
  },
  
  /**
   * Invalidate tournament-related caches
   */
  invalidateTournamentCache(tournamentId: string) {
    cacheService.invalidateByPrefix(`${CACHE_PREFIX.TOURNAMENT}:${tournamentId}`);
    logger.debug('Invalidated tournament cache', { tournamentId });
  }
}; 