import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import * as queries from '../queries';
import { tournamentParticipants } from '../../../../shared/schema';
import { and, eq } from 'drizzle-orm';
import logger from '../../../core/logger';
import { storage } from '../../../core/storage';
import { tournamentService } from './tournament';

/**
 * Service for tournament participant operations
 */
export const participantService = {
  /**
   * Get all participants for a tournament
   */
  async getTournamentParticipants(tournamentId: string) {
    try {
      return await queries.getTournamentParticipants(tournamentId);
    } catch (error) {
      logger.error('Error fetching tournament participants', { error, tournamentId });
      throw error;
    }
  },

  /**
   * Invite participants to a tournament
   */
  async inviteParticipants(tournamentId: string, emails: string[], inviterId: string) {
    try {
      // Check if tournament exists and inviter is the creator
      const tournament = await tournamentService.getTournamentById(tournamentId);
      
      if (!tournament) {
        throw new Error('Tournament not found');
      }
      
      if (tournament.creatorId !== inviterId) {
        throw new Error('Unauthorized: Only the creator can invite participants');
      }
      
      // Results tracking
      const results = {
        invited: [] as string[],
        alreadyInvited: [] as string[],
        invalidEmails: [] as string[]
      };
      
      // Process each email
      for (const email of emails) {
        try {
          // Find user by email
          const user = await storage.getUserByEmail(email);
          
          if (!user) {
            results.invalidEmails.push(email);
            continue;
          }
          
          // Check if user is already a participant
          const existingParticipant = await db.query.tournamentParticipants.findFirst({
            where: and(
              eq(tournamentParticipants.tournamentId, tournamentId),
              eq(tournamentParticipants.userId, user.id)
            )
          });
          
          if (existingParticipant) {
            results.alreadyInvited.push(email);
            continue;
          }
          
          // Create the invitation
          await db.insert(tournamentParticipants).values({
            id: uuidv4(),
            tournamentId,
            userId: user.id,
            status: 'invited',
            joinedAt: new Date()
          });
          
          results.invited.push(email);
          
          // Send notification (would be implemented in a real system)
          // await notificationService.sendInvitation(user.id, tournamentId);
        } catch (error) {
          logger.error('Error inviting participant', { error, email, tournamentId });
          results.invalidEmails.push(email);
        }
      }
      
      return results;
    } catch (error) {
      logger.error('Error inviting participants', { error, tournamentId, emails });
      throw error;
    }
  },

  /**
   * Join a tournament
   */
  async joinTournament(tournamentId: string, userId: string) {
    try {
      // Check if tournament exists
      const tournament = await tournamentService.getTournamentById(tournamentId);
      
      if (!tournament) {
        throw new Error('Tournament not found');
      }
      
      // Check if user is already a participant
      const existingParticipant = await db.query.tournamentParticipants.findFirst({
        where: and(
          eq(tournamentParticipants.tournamentId, tournamentId),
          eq(tournamentParticipants.userId, userId)
        )
      });
      
      if (existingParticipant) {
        if (existingParticipant.status === 'joined') {
          throw new Error('User has already joined this tournament');
        }
        
        // Update the participant status to joined
        const result = await db.update(tournamentParticipants)
          .set({
            status: 'joined',
            joinedAt: new Date()
          })
          .where(and(
            eq(tournamentParticipants.tournamentId, tournamentId),
            eq(tournamentParticipants.userId, userId)
          ))
          .returning();
        
        return result[0];
      }
      
      // Create a new participant entry
      const result = await db.insert(tournamentParticipants).values({
        id: uuidv4(),
        tournamentId,
        userId,
        status: 'joined',
        joinedAt: new Date()
      }).returning();
      
      return result[0];
    } catch (error) {
      logger.error('Error joining tournament', { error, tournamentId, userId });
      throw error;
    }
  },

  /**
   * Update a participant's status
   */
  async updateParticipantStatus(
    tournamentId: string, 
    participantUserId: string, 
    status: 'invited' | 'joined' | 'declined', 
    requestingUserId: string
  ) {
    try {
      // Check if tournament exists
      const tournament = await tournamentService.getTournamentById(tournamentId);
      
      if (!tournament) {
        throw new Error('Tournament not found');
      }
      
      // Check if the participant exists
      const participant = await db.query.tournamentParticipants.findFirst({
        where: and(
          eq(tournamentParticipants.tournamentId, tournamentId),
          eq(tournamentParticipants.userId, participantUserId)
        )
      });
      
      if (!participant) {
        throw new Error('Participant not found');
      }
      
      // Authorization check:
      // Only the tournament creator or the participant themselves can update status
      const isCreator = tournament.creatorId === requestingUserId;
      const isParticipant = participantUserId === requestingUserId;
      
      if (!isCreator && !isParticipant) {
        throw new Error('Unauthorized: Only the tournament creator or the participant can update status');
      }
      
      // Some status changes can only be done by certain users
      if (status === 'invited' && !isCreator) {
        throw new Error('Only the tournament creator can set status to invited');
      }
      
      // Update the participant status
      const result = await db.update(tournamentParticipants)
        .set({
          status,
          ...(status === 'joined' ? { joinedAt: new Date() } : {})
        })
        .where(and(
          eq(tournamentParticipants.tournamentId, tournamentId),
          eq(tournamentParticipants.userId, participantUserId)
        ))
        .returning();
      
      return result[0];
    } catch (error) {
      logger.error('Error updating participant status', {
        error, 
        tournamentId, 
        participantUserId, 
        status
      });
      throw error;
    }
  }
};

// Export individual methods for testing purposes
export const {
  getTournamentParticipants,
  inviteParticipants,
  joinTournament,
  updateParticipantStatus
} = participantService; 