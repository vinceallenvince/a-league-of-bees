import { db } from '../db';
import * as queries from '../queries';
import { and, count, eq, gte, sql } from 'drizzle-orm';
import { tournaments, tournamentParticipants, notifications, users } from '../../../../shared/schema';
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
          // Wrap each query in try/catch to handle individual failures gracefully
          const [
            tournamentStatusCounts,
            participation,
            recentActivity,
            upcomingTournaments
          ] = await Promise.all([
            this.getTournamentSummary(userId).catch(error => {
              logger.error('Error getting tournament summary', { error, userId });
              return { active: 0, pending: 0, completed: 0, cancelled: 0 };
            }),
            this.getParticipationMetrics(userId).catch(error => {
              logger.error('Error getting participation metrics', { error, userId });
              return { hosting: 0, joined: 0, invited: 0 };
            }),
            this.getRecentActivity(userId).catch(error => {
              logger.error('Error getting recent activity', { error, userId });
              return [];
            }),
            this.getUpcomingTournaments(userId).catch(error => {
              logger.error('Error getting upcoming tournaments', { error, userId });
              return [];
            })
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
            unreadNotificationsCount: recentActivity.filter((a: any) => !a.read).length
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
        try {
          // First try to get the user directly from the database by ID
          const dbUserById = await db.select().from(users).where(eq(users.id, userId)).limit(1);
          
          if (dbUserById.length > 0) {
            // User exists in database by ID, return it
            logger.info('User found in database by ID', { userId });
            return dbUserById[0];
          }
          
          // User not in database by ID, try to get from memory storage
          const memUser = await storage.getUserById(userId);
          if (!memUser) {
            throw new Error(`User not found: ${userId}`);
          }
          
          // Check if user exists in database by email
          const usersByEmail = await db.select().from(users).where(eq(users.email, memUser.email)).limit(1);
          
          if (usersByEmail.length > 0) {
            // User exists in database with same email but different ID
            logger.info('User found in database by email instead of ID', { 
              memoryId: userId, 
              dbId: usersByEmail[0].id, 
              email: memUser.email 
            });
            
            return usersByEmail[0];
          }
          
          // User doesn't exist in database at all, create new record
          logger.info('Creating new user in database', { userId, email: memUser.email });
          
          const insertedUser = await db.insert(users).values({
            id: userId,
            email: memUser.email,
            firstName: memUser.firstName,
            lastName: memUser.lastName,
            username: memUser.username || memUser.email.split('@')[0],
            bio: memUser.bio,
            avatar: memUser.avatar,
            isAdmin: memUser.isAdmin,
            lastLogin: memUser.lastLogin,
            otpAttempts: 0,
            otpSecret: null,
            otpExpiry: null,
            otpLastRequest: null
          }).returning();
          
          if (insertedUser.length > 0) {
            logger.info('User created in database successfully', { userId });
            return insertedUser[0];
          }
          
          // If we reach here, something went wrong with the insert but didn't throw
          // Fall back to memory user
          return memUser;
        } catch (error: any) {
          // Special handling for unique constraint violations
          if (error.code === '23505' && error.constraint === 'users_email_unique') {
            // Email uniqueness violation - retry getting user by email
            try {
              const memUser = await storage.getUserById(userId);
              if (!memUser) {
                throw new Error(`User not found: ${userId}`);
              }
              
              // Get user by email from database
              const usersByEmail = await db.select().from(users).where(eq(users.email, memUser.email)).limit(1);
              if (usersByEmail.length > 0) {
                logger.info('Using existing user with same email after constraint error', {
                  memoryId: userId,
                  dbId: usersByEmail[0].id,
                  email: memUser.email
                });
                return usersByEmail[0];
              }
            } catch (retryError) {
              logger.error('Error in constraint handling fallback', { error: retryError });
            }
          }
          
          logger.error('Error fetching user info', { error, userId });
          throw error;
        }
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