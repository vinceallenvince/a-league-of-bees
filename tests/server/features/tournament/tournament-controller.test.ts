import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Request, Response } from 'express';

// Create mock functions
const loggerMock = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
};

// Mock validator
const validateCreateTournamentMock = jest.fn();
const validateUpdateTournamentMock = jest.fn();

// Mock all the dependencies before importing the tested code
// Mock the logger to prevent console output during tests
jest.mock('../../../../server/core/logger', () => {
  return {
    __esModule: true,
    default: loggerMock
  };
});

// Mock the tournament validator
jest.mock('../../../../server/features/tournament/validators/tournament', () => ({
  validateCreateTournament: validateCreateTournamentMock,
  validateUpdateTournament: validateUpdateTournamentMock
}));

// Mock the tournament service
jest.mock('../../../../server/features/tournament/services/tournament', () => ({
  tournamentService: {
    getTournaments: jest.fn(),
    getTournamentById: jest.fn(),
    createTournament: jest.fn(),
    updateTournament: jest.fn(),
    cancelTournament: jest.fn()
  }
}));

// Now import the code being tested
import { tournamentController } from '../../../../server/features/tournament/controllers/tournament';
import { tournamentService } from '../../../../server/features/tournament/services/tournament';

type TournamentStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

// Mock tournament type that satisfies the requirements
interface MockTournament {
  id: string;
  name: string;
  creatorId: string;
  description: string | null;
  durationDays: number;
  startDate: Date;
  requiresVerification: boolean;
  status: TournamentStatus;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
}

describe('Tournament Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseJson: jest.Mock;
  let responseStatus: jest.Mock;

  beforeEach(() => {
    responseJson = jest.fn().mockReturnThis();
    responseStatus = jest.fn().mockReturnThis();
    
    mockRequest = {
      params: {},
      body: {},
      query: {},
      session: {
        userId: 'test-user-id'
      } as any // Cast to any to avoid type issues
    };
    
    mockResponse = {
      json: responseJson as any,
      status: responseStatus as any
    };
    
    // Reset mock implementations
    jest.clearAllMocks();
    
    // Set default validator responses
    validateCreateTournamentMock.mockReturnValue({ 
      success: true, 
      data: { 
        name: 'New Tournament',
        description: 'Test description',
        durationDays: 7,
        startDate: new Date(),
        requiresVerification: false,
        timezone: 'UTC'
      } 
    });
    
    validateUpdateTournamentMock.mockReturnValue({ 
      success: true, 
      data: { 
        name: 'Updated Tournament',
        description: 'Updated description'
      } 
    });
  });

  describe('getTournamentsHandler', () => {
    it('should return tournaments with pagination', async () => {
      const mockTournament: MockTournament = {
        id: '1',
        name: 'Test Tournament',
        creatorId: 'creator-1',
        description: 'Test description',
        durationDays: 7,
        startDate: new Date(),
        requiresVerification: false,
        status: 'pending',
        timezone: 'UTC',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const mockTournaments = {
        tournaments: [mockTournament],
        total: 1,
        page: 1,
        pageSize: 10,
        totalPages: 1
      };
      
      jest.spyOn(tournamentService, 'getTournaments')
        .mockResolvedValue(mockTournaments);
      
      mockRequest.query = { page: '1', pageSize: '10' };
      
      await tournamentController.getTournamentsHandler(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(tournamentService.getTournaments).toHaveBeenCalledWith(1, 10, 'test-user-id');
      expect(responseJson).toHaveBeenCalledWith(mockTournaments);
    });
    
    it('should handle errors', async () => {
      jest.spyOn(tournamentService, 'getTournaments')
        .mockRejectedValue(new Error('Database error'));
      
      await tournamentController.getTournamentsHandler(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(loggerMock.error).toHaveBeenCalledWith(
        'Error getting tournaments', 
        expect.objectContaining({ error: expect.any(Error) })
      );
      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith({ 
        error: 'Failed to get tournaments',
        details: 'Database error'
      });
    });
  });
  
  describe('getTournamentByIdHandler', () => {
    it('should return a tournament by ID', async () => {
      const mockTournament: MockTournament = {
        id: '1',
        name: 'Test Tournament',
        creatorId: 'creator-1',
        description: 'Test description',
        durationDays: 7,
        startDate: new Date(),
        requiresVerification: false,
        status: 'pending',
        timezone: 'UTC',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      jest.spyOn(tournamentService, 'getTournamentById')
        .mockResolvedValue(mockTournament);
      
      mockRequest.params = { id: '1' };
      
      await tournamentController.getTournamentByIdHandler(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(tournamentService.getTournamentById).toHaveBeenCalledWith('1');
      expect(responseJson).toHaveBeenCalledWith(mockTournament);
    });
    
    it('should handle not found errors', async () => {
      jest.spyOn(tournamentService, 'getTournamentById')
        .mockResolvedValue(undefined);
      
      mockRequest.params = { id: 'non-existent' };
      
      await tournamentController.getTournamentByIdHandler(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(responseStatus).toHaveBeenCalledWith(404);
      expect(responseJson).toHaveBeenCalledWith({ 
        error: 'Tournament not found'
      });
    });
  });
  
  describe('createTournamentHandler', () => {
    it('should create a tournament', async () => {
      const mockTournamentData = {
        name: 'New Tournament',
        description: 'Test description',
        durationDays: 7,
        startDate: new Date(),
        requiresVerification: false,
        timezone: 'UTC'
      };
      
      const mockCreatedTournament: MockTournament = {
        id: '1',
        ...mockTournamentData,
        creatorId: 'test-user-id',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      jest.spyOn(tournamentService, 'createTournament')
        .mockResolvedValue(mockCreatedTournament);
      
      mockRequest.body = mockTournamentData;
      
      await tournamentController.createTournamentHandler(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(tournamentService.createTournament).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'New Tournament',
          description: 'Test description',
          durationDays: 7,
          startDate: expect.any(Date),
          requiresVerification: false,
          timezone: 'UTC'
        }), 
        'test-user-id'
      );
      expect(responseStatus).toHaveBeenCalledWith(201);
      expect(responseJson).toHaveBeenCalledWith(mockCreatedTournament);
    });
    
    it('should handle validation errors', async () => {
      validateCreateTournamentMock.mockReturnValue({
        success: false,
        error: {
          format: () => ({ name: { _errors: ['Name is required'] } })
        }
      });
      
      mockRequest.body = { description: 'Missing name' };
      
      await tournamentController.createTournamentHandler(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith(
        expect.objectContaining({ 
          error: 'Invalid tournament data'
        })
      );
    });
  });
  
  describe('updateTournamentHandler', () => {
    it('should update a tournament', async () => {
      const mockUpdateData = {
        name: 'Updated Tournament',
        description: 'Updated description'
      };
      
      const mockUpdatedTournament: MockTournament = {
        id: '1',
        name: 'Updated Tournament',
        description: 'Updated description',
        creatorId: 'test-user-id',
        durationDays: 7,
        startDate: new Date(),
        requiresVerification: false,
        timezone: 'UTC',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      jest.spyOn(tournamentService, 'updateTournament')
        .mockResolvedValue(mockUpdatedTournament);
      
      mockRequest.params = { id: '1' };
      mockRequest.body = mockUpdateData;
      
      await tournamentController.updateTournamentHandler(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(tournamentService.updateTournament).toHaveBeenCalledWith(
        '1', 
        expect.objectContaining(mockUpdateData), 
        'test-user-id'
      );
      expect(responseJson).toHaveBeenCalledWith(mockUpdatedTournament);
    });
    
    it('should handle validation errors', async () => {
      validateUpdateTournamentMock.mockReturnValue({
        success: false,
        error: {
          format: () => ({ name: { _errors: ['Name is too short'] } })
        }
      });
      
      mockRequest.params = { id: '1' };
      mockRequest.body = { name: 'A' };
      
      await tournamentController.updateTournamentHandler(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith(
        expect.objectContaining({ 
          error: 'Invalid update data'
        })
      );
    });
  });
  
  describe('cancelTournamentHandler', () => {
    it('should cancel a tournament', async () => {
      const mockCancelledTournament: MockTournament = {
        id: '1',
        name: 'Cancelled Tournament',
        creatorId: 'test-user-id',
        description: 'Test description',
        durationDays: 7,
        startDate: new Date(),
        requiresVerification: false,
        timezone: 'UTC',
        status: 'cancelled',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      jest.spyOn(tournamentService, 'cancelTournament')
        .mockResolvedValue(mockCancelledTournament);
      
      mockRequest.params = { id: '1' };
      
      await tournamentController.cancelTournamentHandler(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(tournamentService.cancelTournament).toHaveBeenCalledWith('1', 'test-user-id');
      expect(responseJson).toHaveBeenCalledWith(mockCancelledTournament);
    });
    
    it('should handle not found errors', async () => {
      jest.spyOn(tournamentService, 'cancelTournament')
        .mockRejectedValue(new Error('Tournament not found'));
      
      mockRequest.params = { id: 'non-existent' };
      
      await tournamentController.cancelTournamentHandler(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(loggerMock.error).toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(404);
      expect(responseJson).toHaveBeenCalledWith({
        error: 'Tournament not found'
      });
    });
  });
}); 