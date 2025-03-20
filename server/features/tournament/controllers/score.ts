import { Request, Response } from 'express';
import logger from '../../../core/logger';
import { scoreService } from '../services/score';
import { validateSubmitScore, validateUpdateScore } from '../validators/score';

// Extended Request type that includes the file property
interface RequestWithFile extends Request {
  file?: {
    filename: string;
    path?: string;
    mimetype?: string;
    size?: number;
  };
}

/**
 * Controller for tournament score operations
 */
export const scoreController = {
  /**
   * Submit a new score for a tournament day
   */
  submitScoreHandler: async (req: RequestWithFile, res: Response) => {
    try {
      const { id: tournamentId } = req.params;
      const validationResult = validateSubmitScore(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({
          error: 'Invalid score data',
          details: validationResult.error.format()
        });
      }
      
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      // Handle screenshot upload if present
      let screenshotUrl = undefined;
      if (req.file) {
        // This would typically call a service method to store the file and get its URL
        screenshotUrl = `/uploads/${req.file.filename}`;
      }
      
      const score = await scoreService.submitScore(
        tournamentId,
        userId,
        validationResult.data.day,
        validationResult.data.score,
        screenshotUrl
      );
      
      res.status(201).json(score);
    } catch (error) {
      logger.error('Error submitting score', { error, tournamentId: req.params.id });
      
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          return res.status(404).json({ error: error.message });
        }
        
        if (error.message.includes('already been submitted') || error.message.includes('already submitted')) {
          return res.status(400).json({ error: error.message });
        }
        
        if (error.message.includes('not a participant')) {
          return res.status(403).json({ error: error.message });
        }
        
        if (error.message.includes('not in progress')) {
          return res.status(400).json({ error: error.message });
        }
      }
      
      res.status(500).json({
        error: 'Failed to submit score',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  },

  /**
   * Update an existing score
   */
  updateScoreHandler: async (req: RequestWithFile, res: Response) => {
    try {
      const { id: tournamentId, day } = req.params;
      const validationResult = validateUpdateScore(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({
          error: 'Invalid score data',
          details: validationResult.error.format()
        });
      }
      
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      // Handle screenshot upload if present
      let screenshotUrl = undefined;
      if (req.file) {
        // This would typically call a service method to store the file and get its URL
        screenshotUrl = `/uploads/${req.file.filename}`;
      }
      
      const score = await scoreService.updateScore(
        tournamentId,
        userId,
        parseInt(day, 10),
        validationResult.data.score,
        screenshotUrl
      );
      
      res.json(score);
    } catch (error) {
      logger.error('Error updating score', { 
        error, 
        tournamentId: req.params.id,
        day: req.params.day
      });
      
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          return res.status(404).json({ error: error.message });
        }
        
        if (error.message.includes('not your score')) {
          return res.status(403).json({ error: error.message });
        }
        
        if (error.message.includes('not in progress')) {
          return res.status(400).json({ error: error.message });
        }
      }
      
      res.status(500).json({
        error: 'Failed to update score',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  },

  /**
   * Get score history for a tournament
   */
  getScoreHistoryHandler: async (req: Request, res: Response) => {
    try {
      const { id: tournamentId } = req.params;
      const userId = req.query.userId as string | undefined;
      
      // If userId is provided, get scores for that user
      // Otherwise, get scores for the current user
      const targetUserId = userId || req.session.userId;
      
      if (!targetUserId) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      const scores = await scoreService.getScoreHistory(tournamentId, targetUserId);
      res.json(scores);
    } catch (error) {
      logger.error('Error getting score history', { 
        error, 
        tournamentId: req.params.id,
        userId: req.query.userId || req.session.userId
      });
      
      if (error instanceof Error && error.message.includes('not found')) {
        return res.status(404).json({ error: error.message });
      }
      
      res.status(500).json({
        error: 'Failed to get score history',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  },

  /**
   * Get tournament leaderboard
   */
  getLeaderboardHandler: async (req: Request, res: Response) => {
    try {
      const { id: tournamentId } = req.params;
      const leaderboard = await scoreService.getLeaderboard(tournamentId);
      res.json(leaderboard);
    } catch (error) {
      logger.error('Error getting leaderboard', { error, tournamentId: req.params.id });
      
      if (error instanceof Error && error.message.includes('not found')) {
        return res.status(404).json({ error: error.message });
      }
      
      res.status(500).json({
        error: 'Failed to get leaderboard',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  }
}; 