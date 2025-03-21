import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import * as queries from '../queries';
import { tournamentScores } from '../../../../shared/schema';
import { and, eq, count, sum, sql } from 'drizzle-orm';
import logger from '../../../core/logger';
import { tournamentService } from './tournament';
import { participantService } from './participant';
import cacheService from '../../../core/cache';
import { Tournament } from '../../../../shared/schema';
import { tournaments, tournamentParticipants } from '../../../../shared/schema';

// Cache TTL constants
const CACHE_TTL = {
  LEADERBOARD: 5 * 60 * 1000, // 5 minutes
  SCORE_HISTORY: 10 * 60 * 1000, // 10 minutes
};

// Cache key prefixes for group invalidation
const CACHE_PREFIX = {
  TOURNAMENT: 'tournament',
  SCORE: 'score',
  LEADERBOARD: 'leaderboard',
  USER: 'user',
};

// Interface for leaderboard entries from the database
interface LeaderboardEntry {
  user_id: string;
  username: string;
  total_score: string;
  scores_submitted: string;
}

// Interface for formatted leaderboard entries
interface FormattedLeaderboardEntry {
  userId: string;
  username: string;
  totalScore: number;
  scoresSubmitted: number;
}

/**
 * Service for tournament score operations
 */
export const scoreService = {
  /**
   * Submit a score for a tournament day
   */
  async submitScore(
    tournamentId: string,
    userId: string,
    day: number,
    score: number,
    screenshotUrl?: string
  ) {
    try {
      // Check if tournament exists and is in progress
      const tournament = await tournamentService.getTournamentById(tournamentId);
      
      if (!tournament) {
        throw new Error('Tournament not found');
      }
      
      if (tournament.status !== 'in_progress') {
        throw new Error('Tournament is not in progress');
      }
      
      // Check if user is a joined participant
      const participants = await participantService.getTournamentParticipants(tournamentId);
      const isParticipant = participants.some(
        p => p.userId === userId && p.status === 'joined'
      );
      
      if (!isParticipant) {
        throw new Error('User is not a participant in this tournament');
      }
      
      // Check if the day is valid
      if (day < 1 || day > tournament.durationDays) {
        throw new Error(`Day must be between 1 and ${tournament.durationDays}`);
      }
      
      // Check if score already exists for this day
      const existingScore = await db.query.tournamentScores.findFirst({
        where: and(
          eq(tournamentScores.tournamentId, tournamentId),
          eq(tournamentScores.userId, userId),
          eq(tournamentScores.day, day)
        )
      });
      
      if (existingScore) {
        throw new Error('Score has already been submitted for this day');
      }
      
      // Create the score
      const result = await db.insert(tournamentScores).values({
        id: uuidv4(),
        tournamentId,
        userId,
        day,
        score,
        screenshotUrl,
        submittedAt: new Date(),
        updatedAt: new Date()
      }).returning();
      
      // Invalidate caches
      this.invalidateScoreCaches(tournamentId, userId);
      
      return result[0];
    } catch (error) {
      logger.error('Error submitting score', {
        error,
        tournamentId,
        userId,
        day,
        score
      });
      throw error;
    }
  },

  /**
   * Update an existing score
   */
  async updateScore(
    tournamentId: string, 
    userId: string,
    day: number,
    score: number,
    screenshotUrl?: string
  ) {
    try {
      // Check if tournament exists and is in progress
      const tournament = await tournamentService.getTournamentById(tournamentId);
      
      if (!tournament) {
        throw new Error('Tournament not found');
      }
      
      if (tournament.status !== 'in_progress') {
        throw new Error('Tournament is not in progress');
      }
      
      // Check if score exists for this day
      const existingScore = await db.query.tournamentScores.findFirst({
        where: and(
          eq(tournamentScores.tournamentId, tournamentId),
          eq(tournamentScores.userId, userId),
          eq(tournamentScores.day, day)
        )
      });
      
      if (!existingScore) {
        throw new Error('Score not found');
      }
      
      // Update the score
      const updateValues: any = {
        score,
        updatedAt: new Date()
      };
      
      // Only update screenshot URL if provided
      if (screenshotUrl) {
        updateValues.screenshotUrl = screenshotUrl;
      }
      
      const result = await db.update(tournamentScores)
        .set(updateValues)
        .where(and(
          eq(tournamentScores.tournamentId, tournamentId),
          eq(tournamentScores.userId, userId),
          eq(tournamentScores.day, day)
        ))
        .returning();
      
      // Invalidate caches
      this.invalidateScoreCaches(tournamentId, userId);
      
      return result[0];
    } catch (error) {
      logger.error('Error updating score', {
        error,
        tournamentId,
        userId,
        day,
        score
      });
      throw error;
    }
  },

  /**
   * Get score history for a user in a tournament
   */
  async getScoreHistory(tournamentId: string, userId: string) {
    const cacheKey = `score:history:${tournamentId}:${userId}`;
    
    return cacheService.getOrSet(
      cacheKey,
      async () => {
        // Check if tournament exists
        const tournament = await tournamentService.getTournamentById(tournamentId);
        
        if (!tournament) {
          throw new Error('Tournament not found');
        }
        
        // Get all scores for the user in this tournament
        const scores = await db.query.tournamentScores.findMany({
          where: and(
            eq(tournamentScores.tournamentId, tournamentId),
            eq(tournamentScores.userId, userId)
          ),
          orderBy: tournamentScores.day
        });
        
        return scores;
      },
      CACHE_TTL.SCORE_HISTORY,
      [
        `${CACHE_PREFIX.TOURNAMENT}:${tournamentId}`,
        `${CACHE_PREFIX.SCORE}:${tournamentId}:${userId}`,
        `${CACHE_PREFIX.USER}:${userId}`
      ]
    );
  },

  /**
   * Get tournament leaderboard
   */
  async getLeaderboard(tournamentId: string): Promise<FormattedLeaderboardEntry[]> {
    const cacheKey = `leaderboard:${tournamentId}`;
    
    return cacheService.getOrSet(
      cacheKey,
      async () => {
        // Check if tournament exists
        const tournament = await tournamentService.getTournamentById(tournamentId);
        
        if (!tournament) {
          throw new Error('Tournament not found');
        }
        
        // Use an optimized query that aggregates scores efficiently
        const leaderboardData = await db.execute(sql`
          SELECT 
            ts.user_id,
            u.username,
            SUM(ts.score) as total_score,
            COUNT(ts.id) as scores_submitted
          FROM tournament_scores ts
          JOIN users u ON ts.user_id = u.id
          WHERE ts.tournament_id = ${tournamentId}
          GROUP BY ts.user_id, u.username
          ORDER BY total_score DESC, scores_submitted DESC
        `);
        
        // Ensure leaderboardData is an array and map to expected format
        const results: LeaderboardEntry[] = Array.isArray(leaderboardData) ? leaderboardData : [];
        
        return results.map(entry => ({
          userId: entry.user_id,
          username: entry.username || 'Unknown User',
          totalScore: Number(entry.total_score),
          scoresSubmitted: Number(entry.scores_submitted)
        }));
      },
      CACHE_TTL.LEADERBOARD,
      [`${CACHE_PREFIX.TOURNAMENT}:${tournamentId}`, `${CACHE_PREFIX.LEADERBOARD}:${tournamentId}`]
    );
  },

  /**
   * Invalidate score-related caches
   */
  invalidateScoreCaches(tournamentId: string, userId?: string) {
    // Invalidate tournament leaderboard cache
    cacheService.invalidateByPrefix(`${CACHE_PREFIX.LEADERBOARD}:${tournamentId}`);
    
    // If userId is provided, also invalidate user-specific caches
    if (userId) {
      cacheService.invalidateByPrefix(`${CACHE_PREFIX.SCORE}:${tournamentId}:${userId}`);
    } else {
      // Invalidate all score-related caches for this tournament
      cacheService.invalidateByPrefix(`${CACHE_PREFIX.SCORE}:${tournamentId}`);
    }
    
    logger.debug('Invalidated score caches', { tournamentId, userId });
  }
}; 