import { Request, Response } from 'express';
import logger from '../../../core/logger';
import { tournamentService } from '../services/tournament';
import { validateCreateTournament, validateUpdateTournament } from '../validators/tournament';

/**
 * Controller for tournament-related operations
 */
export const tournamentController = {
  /**
   * Get a list of tournaments with pagination
   */
  getTournamentsHandler: async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string || '1', 10);
      const pageSize = parseInt(req.query.pageSize as string || '10', 10);
      const userId = req.session.userId;

      const tournaments = await tournamentService.getTournaments(page, pageSize, userId);
      res.json(tournaments);
    } catch (error) {
      logger.error('Error getting tournaments', { error });
      res.status(500).json({
        error: 'Failed to get tournaments',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  },

  /**
   * Get a tournament by ID
   */
  getTournamentByIdHandler: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const tournament = await tournamentService.getTournamentById(id);
      
      if (!tournament) {
        return res.status(404).json({ error: 'Tournament not found' });
      }
      
      res.json(tournament);
    } catch (error) {
      logger.error('Error getting tournament', { error, tournamentId: req.params.id });
      res.status(500).json({
        error: 'Failed to get tournament',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  },

  /**
   * Create a new tournament
   */
  createTournamentHandler: async (req: Request, res: Response) => {
    try {
      const validationResult = validateCreateTournament(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({
          error: 'Invalid tournament data',
          details: validationResult.error.format()
        });
      }
      
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      const tournament = await tournamentService.createTournament(validationResult.data, userId);
      res.status(201).json(tournament);
    } catch (error) {
      logger.error('Error creating tournament', { error });
      res.status(500).json({
        error: 'Failed to create tournament',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  },

  /**
   * Update an existing tournament
   */
  updateTournamentHandler: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const validationResult = validateUpdateTournament(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({
          error: 'Invalid update data',
          details: validationResult.error.format()
        });
      }
      
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      const tournament = await tournamentService.updateTournament(id, validationResult.data, userId);
      res.json(tournament);
    } catch (error) {
      logger.error('Error updating tournament', { error, tournamentId: req.params.id });
      
      if (error instanceof Error && error.message.includes('Unauthorized')) {
        return res.status(403).json({ error: error.message });
      }
      
      if (error instanceof Error && error.message.includes('not found')) {
        return res.status(404).json({ error: error.message });
      }
      
      res.status(500).json({
        error: 'Failed to update tournament',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  },

  /**
   * Cancel a tournament
   */
  cancelTournamentHandler: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.session.userId;
      
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      const tournament = await tournamentService.cancelTournament(id, userId);
      res.json(tournament);
    } catch (error) {
      logger.error('Error cancelling tournament', { error, tournamentId: req.params.id });
      
      if (error instanceof Error && error.message.includes('Unauthorized')) {
        return res.status(403).json({ error: error.message });
      }
      
      if (error instanceof Error && error.message.includes('not found')) {
        return res.status(404).json({ error: error.message });
      }
      
      res.status(500).json({
        error: 'Failed to cancel tournament',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  }
}; 