/**
 * Optimized Database Queries for Tournament Feature
 * 
 * This file contains optimized query functions for the tournament feature.
 * These functions leverage the indexes and views created for query optimization.
 */

import { and, asc, desc, eq, gte, inArray, lt, or, sql } from 'drizzle-orm';
import { db } from './db';
import {
  tournaments,
  tournamentParticipants,
  tournamentScores,
  notifications,
  users
} from '../../../shared/schema';
import { 
  TournamentStatus, 
  ActiveTournament, 
  TournamentLeaderboardEntry,
  UserTournament,
  UnreadNotificationSummary,
  TournamentDailyStat
} from './types';
import logger from '@core/logger';

/**
 * Get tournament by ID
 * Uses the primary key index
 */
export async function getTournamentById(id: string) {
  return db.query.tournaments.findFirst({
    where: eq(tournaments.id, id)
  });
}

/**
 * Get active tournaments with pagination
 * Uses the idx_tournaments_status index
 */
export async function getActiveTournaments(page = 1, pageSize = 10, status?: TournamentStatus) {
  const offset = (page - 1) * pageSize;
  
  // Query the tournaments table directly without using the view
  // If status is provided, filter by it; otherwise, get all tournaments
  const whereClause = status 
    ? eq(tournaments.status, status as any) 
    : undefined;
    
  // Log the query parameters for debugging
  logger.info('Getting active tournaments', { 
    page, 
    pageSize, 
    status, 
    whereClause: whereClause ? 'filtered by status' : 'no filter'
  });
  
  const results = await db.select({
    id: tournaments.id,
    name: tournaments.name,
    description: tournaments.description,
    durationDays: tournaments.durationDays,
    startDate: tournaments.startDate,
    requiresVerification: tournaments.requiresVerification,
    status: tournaments.status,
    timezone: tournaments.timezone,
    creatorId: tournaments.creatorId,
    createdAt: tournaments.createdAt,
    updatedAt: tournaments.updatedAt,
    // Join to get creator information
    creatorEmail: users.email,
    creatorUsername: users.username
  })
  .from(tournaments)
  .leftJoin(users, eq(tournaments.creatorId, users.id))
  .where(whereClause)
  .limit(pageSize)
  .offset(offset);
  
  // Log the result count
  logger.info('Found tournaments', { count: results.length });
  
  // Count total tournaments
  const countResult = await db.select({
    count: sql<number>`count(*)`
  })
  .from(tournaments)
  .where(whereClause);
  
  // Get participant count in a separate query
  const tournamentIds = results.map(tournament => tournament.id);
  const participantCounts = tournamentIds.length > 0 
    ? await db.select({
        tournamentId: tournamentParticipants.tournamentId,
        count: sql<number>`count(distinct ${tournamentParticipants.id})`
      })
      .from(tournamentParticipants)
      .where(inArray(tournamentParticipants.tournamentId, tournamentIds))
      .groupBy(tournamentParticipants.tournamentId)
    : [];
  
  // Add participant count to each tournament
  const tournamentsWithParticipantCount = results.map(tournament => {
    const participantCount = participantCounts.find(
      count => count.tournamentId === tournament.id
    )?.count || 0;
    
    return {
      ...tournament,
      participant_count: Number(participantCount)
    };
  });
  
  return {
    tournaments: tournamentsWithParticipantCount,
    total: Number(countResult[0]?.count || 0),
    page,
    pageSize,
    totalPages: Math.ceil(Number(countResult[0]?.count || 0) / pageSize)
  };
}

/**
 * Get tournaments by creator
 * Uses the idx_tournaments_creator_id index
 */
export async function getTournamentsByCreator(creatorId: string) {
  return db.select()
    .from(tournaments)
    .where(eq(tournaments.creatorId, creatorId))
    .orderBy(desc(tournaments.createdAt));
}

/**
 * Get tournaments by status
 * Uses the idx_tournaments_status index
 */
export async function getTournamentsByStatus(status: TournamentStatus) {
  return db.select()
    .from(tournaments)
    .where(eq(tournaments.status, status))
    .orderBy(desc(tournaments.createdAt));
}

/**
 * Get tournaments starting soon (within next 24 hours)
 * Uses the idx_tournaments_start_date and idx_tournaments_status indexes
 */
export async function getTournamentsStartingSoon() {
  const now = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return db.select()
    .from(tournaments)
    .where(
      and(
        eq(tournaments.status, 'pending'),
        gte(tournaments.startDate, now),
        lt(tournaments.startDate, tomorrow)
      )
    )
    .orderBy(asc(tournaments.startDate));
}

/**
 * Get tournament participants
 * Uses the idx_tournament_participants_tournament_id index
 */
export async function getTournamentParticipants(tournamentId: string) {
  return db.select({
    participant: tournamentParticipants,
    user: {
      id: users.id,
      email: users.email,
      username: users.username,
      firstName: users.firstName,
      lastName: users.lastName
    }
  })
  .from(tournamentParticipants)
  .innerJoin(users, eq(tournamentParticipants.userId, users.id))
  .where(eq(tournamentParticipants.tournamentId, tournamentId))
  .orderBy(asc(users.email));
}

/**
 * Get tournament participants by status
 * Uses the idx_tournament_participants_tournament_status index
 */
export async function getTournamentParticipantsByStatus(
  tournamentId: string,
  status: string
) {
  return db.select({
    participant: tournamentParticipants,
    user: {
      id: users.id,
      email: users.email,
      username: users.username
    }
  })
  .from(tournamentParticipants)
  .innerJoin(users, eq(tournamentParticipants.userId, users.id))
  .where(
    and(
      eq(tournamentParticipants.tournamentId, tournamentId),
      eq(tournamentParticipants.status, status)
    )
  )
  .orderBy(asc(users.email));
}

/**
 * Get user tournaments
 * Uses the user_tournaments view which is optimized for this query
 */
export async function getUserTournaments(userId: string) {
  return db.execute<UserTournament>(sql`
    SELECT * FROM user_tournaments
    WHERE user_id = ${userId}
    ORDER BY start_date DESC
  `);
}

/**
 * Get tournament leaderboard
 * Uses the tournament_leaderboard view which is optimized for this query
 */
export async function getTournamentLeaderboard(tournamentId: string) {
  return db.execute<TournamentLeaderboardEntry>(sql`
    SELECT * FROM tournament_leaderboard
    WHERE tournament_id = ${tournamentId}
    ORDER BY total_score DESC
  `);
}

/**
 * Get unread notifications for user
 * Uses the idx_notifications_user_read index
 */
export async function getUnreadNotifications(userId: string) {
  return db.select()
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, userId),
        eq(notifications.read, false)
      )
    )
    .orderBy(desc(notifications.createdAt));
}

/**
 * Get notifications summary
 * Uses the unread_notifications_summary view
 */
export async function getNotificationsSummary(userId: string) {
  return db.execute<UnreadNotificationSummary>(sql`
    SELECT * FROM unread_notifications_summary
    WHERE user_id = ${userId}
  `);
}

/**
 * Get tournament daily statistics
 * Uses the tournament_daily_stats view
 */
export async function getTournamentDailyStats(tournamentId: string) {
  return db.execute<TournamentDailyStat>(sql`
    SELECT * FROM tournament_daily_stats
    WHERE tournament_id = ${tournamentId}
    ORDER BY day
  `);
}

/**
 * Get user scores for a tournament
 * Uses the idx_tournament_scores_tournament_user_day index
 */
export async function getUserTournamentScores(tournamentId: string, userId: string) {
  return db.select()
    .from(tournamentScores)
    .where(
      and(
        eq(tournamentScores.tournamentId, tournamentId),
        eq(tournamentScores.userId, userId)
      )
    )
    .orderBy(asc(tournamentScores.day));
}

/**
 * Mark notifications as read
 * Optimized batch update using the idx_notifications_user_id index
 */
export async function markNotificationsAsRead(notificationIds: string[]) {
  return db.update(notifications)
    .set({ read: true })
    .where(inArray(notifications.id, notificationIds))
    .execute();
}

/**
 * Update tournament participant status (bulk operation)
 * Optimized batch update using the idx_tournament_participants_tournament_status index
 */
export async function updateTournamentParticipantsStatus(
  tournamentId: string,
  userIds: string[],
  status: string
) {
  return db.update(tournamentParticipants)
    .set({ status, updatedAt: new Date() })
    .where(
      and(
        eq(tournamentParticipants.tournamentId, tournamentId),
        inArray(tournamentParticipants.userId, userIds)
      )
    )
    .execute();
}

/**
 * Find tournaments by text search
 * This is an example of a more complex query that would benefit from a full-text search index
 * In PostgreSQL, you might want to add a GIN index for this in production
 */
export async function searchTournaments(searchText: string) {
  const searchPattern = `%${searchText}%`;
  
  return db.select()
    .from(tournaments)
    .where(
      or(
        sql`tournaments.name ILIKE ${searchPattern}`,
        sql`tournaments.description ILIKE ${searchPattern}`
      )
    )
    .orderBy(desc(tournaments.createdAt))
    .limit(20);
} 