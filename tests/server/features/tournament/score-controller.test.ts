import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Request, Response } from 'express';
import { QueryResult } from 'pg';
import { TournamentLeaderboardEntry } from '../../../../server/features/tournament/types';

// Define the formatted leaderboard entry interface based on the actual implementation
interface FormattedLeaderboardEntry {
  userId: string;
  username: string;
  totalScore: number;
  scoresSubmitted: number;
}

// Create mock functions
const loggerMock = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
};

// Mock validator
const validateSubmitScoreMock = jest.fn();
const validateUpdateScoreMock = jest.fn();

// Mock the dependencies before importing the code
jest.mock('../../../../server/core/logger', () => {
  return {
    __esModule: true,
    default: loggerMock
  };
});

// Mock the score validator
jest.mock('../../../../server/features/tournament/validators/score', () => ({
  validateSubmitScore: validateSubmitScoreMock,
  validateUpdateScore: validateUpdateScoreMock
}));

// Mock the score service
jest.mock('../../../../server/features/tournament/services/score', () => ({
  scoreService: {
    submitScore: jest.fn(),
    updateScore: jest.fn(),
    getScoreHistory: jest.fn(),
    getLeaderboard: jest.fn()
  }
}));

// Import the controller after mocking dependencies
import { scoreController } from '../../../../server/features/tournament/controllers/score';
import { scoreService } from '../../../../server/features/tournament/services/score';

// Extend the Request type to include the file property
interface RequestWithFile extends Request {
  file?: {
    filename: string;
  };
}

describe('Score Controller', () => {
  let mockRequest: Partial<RequestWithFile>;
  let mockResponse: Partial<Response>;
  let responseJson: jest.Mock;
  let responseStatus: jest.Mock;

  beforeEach(() => {
    responseJson = jest.fn().mockReturnThis();
    responseStatus = jest.fn().mockReturnThis();
    
    mockRequest = {
      params: { id: 'tournament-1' },
      body: {},
      query: {},
      session: {
        userId: 'test-user-id'
      } as any,
      file: undefined
    };
    
    mockResponse = {
      json: responseJson as any,
      status: responseStatus as any
    };
    
    // Reset mock implementations
    jest.clearAllMocks();
    
    // Set default validator responses
    validateSubmitScoreMock.mockReturnValue({ 
      success: true, 
      data: { 
        day: 1,
        score: 100
      } 
    });
    
    validateUpdateScoreMock.mockReturnValue({ 
      success: true, 
      data: { 
        score: 150
      } 
    });
  });

  describe('submitScoreHandler', () => {
    it('should submit a new score', async () => {
      const mockSubmittedScore = {
        id: 'score-1',
        tournamentId: 'tournament-1',
        userId: 'test-user-id',
        day: 1,
        score: 100,
        screenshotUrl: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      jest.spyOn(scoreService, 'submitScore').mockResolvedValue(mockSubmittedScore);
      
      mockRequest.body = { day: 1, score: 100 };
      
      await scoreController.submitScoreHandler(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(scoreService.submitScore).toHaveBeenCalledWith(
        'tournament-1',
        'test-user-id',
        1,
        100,
        undefined
      );
      expect(responseStatus).toHaveBeenCalledWith(201);
      expect(responseJson).toHaveBeenCalledWith(mockSubmittedScore);
    });
    
    it('should handle validation errors', async () => {
      validateSubmitScoreMock.mockReturnValue({
        success: false,
        error: {
          format: () => ({ score: { _errors: ['Score is required'] } })
        }
      });
      
      mockRequest.body = { day: 1 };
      
      await scoreController.submitScoreHandler(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Invalid score data' })
      );
    });
    
    it('should handle authentication errors', async () => {
      mockRequest.session = {} as any;
      
      await scoreController.submitScoreHandler(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(responseStatus).toHaveBeenCalledWith(401);
      expect(responseJson).toHaveBeenCalledWith({ error: 'Authentication required' });
    });
    
    it('should handle tournament not found errors', async () => {
      jest.spyOn(scoreService, 'submitScore')
        .mockRejectedValue(new Error('Tournament not found'));
      
      await scoreController.submitScoreHandler(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(responseStatus).toHaveBeenCalledWith(404);
      expect(responseJson).toHaveBeenCalledWith({ error: 'Tournament not found' });
    });
    
    it('should handle already submitted errors', async () => {
      jest.spyOn(scoreService, 'submitScore')
        .mockRejectedValue(new Error('Score has already been submitted for this day'));
      
      await scoreController.submitScoreHandler(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({ 
        error: 'Score has already been submitted for this day' 
      });
    });
    
    it('should handle file uploads for screenshots', async () => {
      const mockSubmittedScore = {
        id: 'score-1',
        tournamentId: 'tournament-1',
        userId: 'test-user-id',
        day: 1,
        score: 100,
        screenshotUrl: '/uploads/test-screenshot.jpg',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      jest.spyOn(scoreService, 'submitScore').mockResolvedValue(mockSubmittedScore);
      
      mockRequest.body = { day: 1, score: 100 };
      mockRequest.file = { filename: 'test-screenshot.jpg' };
      
      await scoreController.submitScoreHandler(
        mockRequest as RequestWithFile,
        mockResponse as Response
      );
      
      expect(scoreService.submitScore).toHaveBeenCalledWith(
        'tournament-1',
        'test-user-id',
        1,
        100,
        '/uploads/test-screenshot.jpg'
      );
      expect(responseStatus).toHaveBeenCalledWith(201);
      expect(responseJson).toHaveBeenCalledWith(mockSubmittedScore);
    });
  });
  
  describe('updateScoreHandler', () => {
    it('should update an existing score', async () => {
      const mockUpdatedScore = {
        id: 'score-1',
        tournamentId: 'tournament-1',
        userId: 'test-user-id',
        day: 2,
        score: 150,
        screenshotUrl: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      jest.spyOn(scoreService, 'updateScore').mockResolvedValue(mockUpdatedScore);
      
      mockRequest.params = { id: 'tournament-1', day: '2' };
      mockRequest.body = { score: 150 };
      
      await scoreController.updateScoreHandler(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(scoreService.updateScore).toHaveBeenCalledWith(
        'tournament-1',
        'test-user-id',
        2,
        150,
        undefined
      );
      expect(responseJson).toHaveBeenCalledWith(mockUpdatedScore);
    });
    
    it('should handle validation errors', async () => {
      validateUpdateScoreMock.mockReturnValue({
        success: false,
        error: {
          format: () => ({ score: { _errors: ['Score is required'] } })
        }
      });
      
      mockRequest.params = { id: 'tournament-1', day: '2' };
      mockRequest.body = {};
      
      await scoreController.updateScoreHandler(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Invalid score data' })
      );
    });
    
    it('should handle score not found errors', async () => {
      jest.spyOn(scoreService, 'updateScore')
        .mockRejectedValue(new Error('Score not found'));
      
      mockRequest.params = { id: 'tournament-1', day: '2' };
      
      await scoreController.updateScoreHandler(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(responseStatus).toHaveBeenCalledWith(404);
      expect(responseJson).toHaveBeenCalledWith({ error: 'Score not found' });
    });
    
    it('should handle file uploads for screenshots', async () => {
      const mockUpdatedScore = {
        id: 'score-1',
        tournamentId: 'tournament-1',
        userId: 'test-user-id',
        day: 2,
        score: 150,
        screenshotUrl: '/uploads/updated-screenshot.jpg',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      jest.spyOn(scoreService, 'updateScore').mockResolvedValue(mockUpdatedScore);
      
      mockRequest.params = { id: 'tournament-1', day: '2' };
      mockRequest.body = { score: 150 };
      mockRequest.file = { filename: 'updated-screenshot.jpg' };
      
      await scoreController.updateScoreHandler(
        mockRequest as RequestWithFile,
        mockResponse as Response
      );
      
      expect(scoreService.updateScore).toHaveBeenCalledWith(
        'tournament-1',
        'test-user-id',
        2,
        150,
        '/uploads/updated-screenshot.jpg'
      );
      expect(responseJson).toHaveBeenCalledWith(mockUpdatedScore);
    });
  });
  
  describe('getScoreHistoryHandler', () => {
    it('should get score history for the current user', async () => {
      const mockScores = [
        {
          id: 'score-1',
          tournamentId: 'tournament-1',
          userId: 'test-user-id',
          day: 1,
          score: 100,
          screenshotUrl: null,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'score-2',
          tournamentId: 'tournament-1',
          userId: 'test-user-id',
          day: 2,
          score: 150,
          screenshotUrl: null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      jest.spyOn(scoreService, 'getScoreHistory').mockResolvedValue(mockScores);
      
      await scoreController.getScoreHistoryHandler(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(scoreService.getScoreHistory).toHaveBeenCalledWith(
        'tournament-1',
        'test-user-id'
      );
      expect(responseJson).toHaveBeenCalledWith(mockScores);
    });
    
    it('should get score history for a specific user if userId is provided', async () => {
      const mockScores = [
        {
          id: 'score-1',
          tournamentId: 'tournament-1',
          userId: 'other-user-id',
          day: 1,
          score: 200,
          screenshotUrl: null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      jest.spyOn(scoreService, 'getScoreHistory').mockResolvedValue(mockScores);
      
      mockRequest.query = { userId: 'other-user-id' };
      
      await scoreController.getScoreHistoryHandler(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(scoreService.getScoreHistory).toHaveBeenCalledWith(
        'tournament-1',
        'other-user-id'
      );
      expect(responseJson).toHaveBeenCalledWith(mockScores);
    });
    
    it('should handle tournament not found errors', async () => {
      jest.spyOn(scoreService, 'getScoreHistory')
        .mockRejectedValue(new Error('Tournament not found'));
      
      await scoreController.getScoreHistoryHandler(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(responseStatus).toHaveBeenCalledWith(404);
      expect(responseJson).toHaveBeenCalledWith({ error: 'Tournament not found' });
    });
  });
  
  describe('getLeaderboardHandler', () => {
    it('should get tournament leaderboard', async () => {
      mockRequest.params = { id: 'tournament-1' };
      
      // Use FormattedLeaderboardEntry[] type that matches the service return type
      const mockLeaderboard = [
        {
          userId: 'user-1',
          username: 'User One',
          totalScore: 500,
          scoresSubmitted: 3
        },
        {
          userId: 'user-2',
          username: 'User Two',
          totalScore: 300,
          scoresSubmitted: 2
        }
      ];
      
      jest.spyOn(scoreService, 'getLeaderboard').mockResolvedValue(mockLeaderboard);
      
      await scoreController.getLeaderboardHandler(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(scoreService.getLeaderboard).toHaveBeenCalledWith('tournament-1');
      expect(responseJson).toHaveBeenCalledWith(mockLeaderboard);
    });
    
    it('should handle tournament not found errors', async () => {
      jest.spyOn(scoreService, 'getLeaderboard')
        .mockRejectedValue(new Error('Tournament not found'));
      
      await scoreController.getLeaderboardHandler(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(responseStatus).toHaveBeenCalledWith(404);
      expect(responseJson).toHaveBeenCalledWith({ error: 'Tournament not found' });
    });
  });
}); 