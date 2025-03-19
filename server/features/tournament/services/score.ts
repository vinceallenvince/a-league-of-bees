import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import * as queries from '../queries';
import { tournamentScores } from '../../../../shared/schema';
import { and, eq } from 'drizzle-orm';
import logger from '../../../core/logger';
import { tournamentService } from './tournament';
import { participantService } from './participant';

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
    try {
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
    } catch (error) {
      logger.error('Error getting score history', {
        error,
        tournamentId,
        userId
      });
      throw error;
    }
  },

  /**
   * Get tournament leaderboard
   */
  async getLeaderboard(tournamentId: string) {
    try {
      // Check if tournament exists
      const tournament = await tournamentService.getTournamentById(tournamentId);
      
      if (!tournament) {
        throw new Error('Tournament not found');
      }
      
      // Get leaderboard data from the query function
      return await queries.getTournamentLeaderboard(tournamentId);
    } catch (error) {
      logger.error('Error getting leaderboard', {
        error,
        tournamentId
      });
      throw error;
    }
  }
}; 