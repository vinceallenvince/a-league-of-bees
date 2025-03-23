import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import * as queries from '../queries';
import { tournaments, tournamentParticipants, users } from '../../../../shared/schema';
import { and, eq, desc, gte, lt, sql } from 'drizzle-orm';
import logger from '../../../core/logger';
import cacheService from '../../../core/cache';
import { TournamentStatus } from '../types';

// Cache TTL constants
const CACHE_TTL = {
  TOURNAMENT_LIST: 5 * 60 * 1000, // 5 minutes
  TOURNAMENT_DETAIL: 10 * 60 * 1000, // 10 minutes
};

// Cache key prefixes for group invalidation
const CACHE_PREFIX = {
  TOURNAMENT: 'tournament',
  TOURNAMENT_LIST: 'tournament:list',
  USER: 'user',
};

interface TournamentData {
  id: string;
  name: string;
  description: string;
  duration_days: number;
  start_date: string;
  status: string;
  creator_id: string;
  creator_username: string;
}

interface TournamentListResult {
  count: string;
  tournaments: TournamentData[];
  [key: string]: unknown; // Add index signature to satisfy Record<string, unknown> constraint
}

/**
 * Service for tournament operations
 */
export const tournamentService = {
  /**
   * Get tournaments with pagination
   * If userId is provided, returns tournaments created by that user
   */
  async getTournaments(page = 1, pageSize = 10, userId?: string, status?: TournamentStatus) {
    // Use cursor-based pagination for better performance with larger datasets
    const cacheKey = `tournament:list:${page}:${pageSize}:${userId || 'all'}:${status || 'all'}`;
    
    return cacheService.getOrSet(
      cacheKey,
      async () => {
        try {
          if (userId) {
            // Use getTournamentsByCreator for user-specific tournaments
            const tournamentList = await queries.getTournamentsByCreator(userId);
            
            return {
              tournaments: tournamentList,
              total: tournamentList.length,
              page,
              pageSize,
              totalPages: Math.ceil(tournamentList.length / pageSize)
            };
          } else {
            // Pass status parameter to getActiveTournaments if provided
            return await queries.getActiveTournaments(page, pageSize, status);
          }
        } catch (error) {
          logger.error('Error getting tournaments', { error, page, pageSize, userId, status });
          throw error;
        }
      },
      CACHE_TTL.TOURNAMENT_LIST,
      [
        CACHE_PREFIX.TOURNAMENT_LIST,
        userId ? `${CACHE_PREFIX.USER}:${userId}` : null,
        status ? `${CACHE_PREFIX.TOURNAMENT}:status:${status}` : null
      ].filter(Boolean) as string[]
    );
  },

  /**
   * Get a tournament by ID
   */
  async getTournamentById(id: string) {
    const cacheKey = `tournament:${id}`;
    
    return cacheService.getOrSet(
      cacheKey,
      async () => {
        try {
          // Use getTournamentById from queries
          return await queries.getTournamentById(id);
        } catch (error) {
          logger.error('Error getting tournament by ID', { error, tournamentId: id });
          throw error;
        }
      },
      CACHE_TTL.TOURNAMENT_DETAIL,
      [`${CACHE_PREFIX.TOURNAMENT}:${id}`]
    );
  },

  /**
   * Create a new tournament
   */
  async createTournament(tournamentData: {
    name: string;
    description?: string;
    durationDays: number;
    startDate: Date;
    requiresVerification: boolean;
    timezone: string;
  }, creatorId: string) {
    try {
      // Insert tournament into database
      const result = await db.insert(tournaments).values({
        id: uuidv4(),
        creatorId,
        name: tournamentData.name,
        description: tournamentData.description,
        durationDays: tournamentData.durationDays,
        startDate: tournamentData.startDate,
        requiresVerification: tournamentData.requiresVerification,
        timezone: tournamentData.timezone,
        status: 'pending' // New tournaments start in pending status
      }).returning();
      
      // Invalidate tournaments list cache
      this.invalidateTournamentListCache(creatorId);
      
      return result[0];
    } catch (error) {
      logger.error('Error creating tournament', { error, tournamentData });
      throw error;
    }
  },

  /**
   * Update an existing tournament
   */
  async updateTournament(
    id: string, 
    updateData: Partial<{
      name: string;
      description: string;
      durationDays: number;
      startDate: Date;
      requiresVerification: boolean;
      timezone: string;
    }>, 
    userId: string
  ) {
    try {
      // Check if tournament exists and user is the creator
      const tournament = await this.getTournamentById(id);
      
      if (!tournament) {
        throw new Error('Tournament not found');
      }
      
      if (tournament.creatorId !== userId) {
        throw new Error('Unauthorized: Only the creator can update this tournament');
      }
      
      // Update the tournament
      const result = await db.update(tournaments)
        .set({
          ...updateData,
          updatedAt: new Date()
        })
        .where(eq(tournaments.id, id))
        .returning();
      
      // Invalidate related caches
      this.invalidateTournamentCache(id);
      this.invalidateTournamentListCache(userId);
      
      return result[0];
    } catch (error) {
      logger.error('Error updating tournament', { error, tournamentId: id, updateData });
      throw error;
    }
  },

  /**
   * Cancel a tournament
   */
  async cancelTournament(id: string, userId: string) {
    try {
      // Check if tournament exists and user is the creator
      const tournament = await this.getTournamentById(id);
      
      if (!tournament) {
        throw new Error('Tournament not found');
      }
      
      if (tournament.creatorId !== userId) {
        throw new Error('Unauthorized: Only the creator can cancel this tournament');
      }
      
      // Cannot cancel completed tournaments
      if (tournament.status === 'completed') {
        throw new Error('Cannot cancel a completed tournament');
      }
      
      // Update the tournament status to cancelled
      const result = await db.update(tournaments)
        .set({
          status: 'cancelled',
          updatedAt: new Date()
        })
        .where(eq(tournaments.id, id))
        .returning();
      
      // Invalidate related caches
      this.invalidateTournamentCache(id);
      this.invalidateTournamentListCache(userId);
      
      return result[0];
    } catch (error) {
      logger.error('Error cancelling tournament', { error, tournamentId: id });
      throw error;
    }
  },
  
  /**
   * Invalidate tournament cache
   */
  invalidateTournamentCache(tournamentId: string) {
    cacheService.invalidateByPrefix(`${CACHE_PREFIX.TOURNAMENT}:${tournamentId}`);
    logger.debug('Invalidated tournament cache', { tournamentId });
  },
  
  /**
   * Invalidate tournament list cache
   */
  invalidateTournamentListCache(userId?: string) {
    cacheService.invalidateByPrefix(CACHE_PREFIX.TOURNAMENT_LIST);
    
    if (userId) {
      cacheService.invalidateByPrefix(`${CACHE_PREFIX.USER}:${userId}`);
    }
    
    logger.debug('Invalidated tournament list cache', { userId });
  }
};

// Export individual methods for testing purposes
export const { 
  getTournaments, 
  getTournamentById, 
  createTournament, 
  updateTournament, 
  cancelTournament 
} = tournamentService; 