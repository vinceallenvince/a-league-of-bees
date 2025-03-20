import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import * as queries from '../queries';
import { tournaments } from '../../../../shared/schema';
import { and, eq } from 'drizzle-orm';
import logger from '../../../core/logger';

/**
 * Service for tournament operations
 */
export const tournamentService = {
  /**
   * Get tournaments with pagination
   * If userId is provided, returns tournaments created by that user
   */
  async getTournaments(page = 1, pageSize = 10, userId?: string) {
    try {
      // If userId is provided, fetch tournaments created by that user
      if (userId) {
        const userTournaments = await queries.getTournamentsByCreator(userId);
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        
        return {
          tournaments: userTournaments.slice(start, end),
          total: userTournaments.length,
          page,
          pageSize,
          totalPages: Math.ceil(userTournaments.length / pageSize)
        };
      }
      
      // Otherwise, get active tournaments
      return await queries.getActiveTournaments(page, pageSize);
    } catch (error) {
      logger.error('Error fetching tournaments', { error, userId });
      throw error;
    }
  },

  /**
   * Get a tournament by ID
   */
  async getTournamentById(id: string) {
    try {
      return await queries.getTournamentById(id);
    } catch (error) {
      logger.error('Error fetching tournament by ID', { error, tournamentId: id });
      throw error;
    }
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
      
      return result[0];
    } catch (error) {
      logger.error('Error cancelling tournament', { error, tournamentId: id });
      throw error;
    }
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