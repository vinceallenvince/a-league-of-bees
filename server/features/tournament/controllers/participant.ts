import { Request, Response } from 'express';
import logger from '../../../core/logger';
import { participantService } from '../services/participant';
import { validateParticipantStatus, validateInviteParticipants } from '../validators/participant';

/**
 * Controller for tournament participant operations
 */
export const participantController = {
  /**
   * Get all participants for a tournament
   */
  getTournamentParticipantsHandler: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // Get participants from actual database
      const participants = await participantService.getTournamentParticipants(id);
      
      res.json(participants);
    } catch (error) {
      logger.error('Error getting tournament participants', { error, tournamentId: req.params.id });
      res.status(500).json({
        error: 'Failed to get tournament participants',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  },

  /**
   * Invite participants to a tournament
   */
  inviteParticipantsHandler: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const validationResult = validateInviteParticipants(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({
          error: 'Invalid invitation data',
          details: validationResult.error.format()
        });
      }
      
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      const inviteResults = await participantService.inviteParticipants(
        id,
        validationResult.data.emails,
        userId
      );
      
      res.json(inviteResults);
    } catch (error) {
      logger.error('Error inviting participants', { error, tournamentId: req.params.id });
      
      if (error instanceof Error && error.message.includes('Unauthorized')) {
        return res.status(403).json({ error: error.message });
      }
      
      if (error instanceof Error && error.message.includes('not found')) {
        return res.status(404).json({ error: error.message });
      }
      
      res.status(500).json({
        error: 'Failed to invite participants',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  },

  /**
   * Join a tournament
   */
  joinTournamentHandler: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.session.userId;
      
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      const participant = await participantService.joinTournament(id, userId);
      res.json(participant);
    } catch (error) {
      logger.error('Error joining tournament', { error, tournamentId: req.params.id });
      
      if (error instanceof Error && error.message.includes('not found')) {
        return res.status(404).json({ error: error.message });
      }
      
      if (error instanceof Error && error.message.includes('already joined')) {
        return res.status(400).json({ error: error.message });
      }
      
      res.status(500).json({
        error: 'Failed to join tournament',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  },

  /**
   * Update participant status
   */
  updateParticipantStatusHandler: async (req: Request, res: Response) => {
    try {
      const { id, userId: participantUserId } = req.params;
      const { status } = req.body;
      
      // Validate the status
      const validStatuses = ['invited', 'joined', 'declined'];
      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
        });
      }
      
      const requestingUserId = req.session.userId;
      if (!requestingUserId) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      const participant = await participantService.updateParticipantStatus(
        id,
        participantUserId,
        status,
        requestingUserId
      );
      
      res.json(participant);
    } catch (error) {
      logger.error('Error updating participant status', {
        error,
        tournamentId: req.params.id,
        userId: req.params.userId
      });
      
      if (error instanceof Error && error.message.includes('Unauthorized')) {
        return res.status(403).json({ error: error.message });
      }
      
      if (error instanceof Error && error.message.includes('not found')) {
        return res.status(404).json({ error: error.message });
      }
      
      res.status(500).json({
        error: 'Failed to update participant status',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  }
}; 