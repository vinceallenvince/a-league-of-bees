import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Request, Response } from 'express';

// Create mock functions
const loggerMock = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
};

// Validator mocks
const validateInviteParticipantsMock = jest.fn();

// Mock all the dependencies before importing the tested code
// Mock the logger to prevent console output during tests
jest.mock('../../../../server/core/logger', () => {
  return {
    __esModule: true,
    default: loggerMock
  };
});

// Mock the core storage
jest.mock('../../../../server/core/storage', () => ({
  storage: {
    getUserByEmail: jest.fn()
  }
}));

// Mock the tournament service
jest.mock('../../../../server/features/tournament/services/tournament', () => ({
  tournamentService: {
    getTournamentById: jest.fn()
  }
}));

// Mock the database and queries
jest.mock('../../../../server/features/tournament/db', () => {
  const mockDb = {
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    returning: jest.fn().mockReturnValue([{}] as any),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    execute: jest.fn().mockReturnValue([{}] as any),
    query: {
      tournamentParticipants: {
        findFirst: jest.fn()
      }
    }
  };
  return { db: mockDb };
});

// Mock the validators
jest.mock('../../../../server/features/tournament/validators/participant', () => ({
  validateInviteParticipants: validateInviteParticipantsMock,
  validateParticipantStatus: jest.fn().mockReturnValue({ success: true, data: { status: 'joined' } })
}));

// Mock the participant service
jest.mock('../../../../server/features/tournament/services/participant', () => ({
  participantService: {
    getTournamentParticipants: jest.fn(),
    inviteParticipants: jest.fn(),
    joinTournament: jest.fn(),
    updateParticipantStatus: jest.fn()
  }
}));

// Now we can safely import the controller after all dependencies are mocked
import { participantController } from '../../../../server/features/tournament/controllers/participant';
import { participantService } from '../../../../server/features/tournament/services/participant';

describe('Participant Controller', () => {
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
      } as any
    };
    
    mockResponse = {
      json: responseJson as any,
      status: responseStatus as any
    };
    
    // Reset mock implementations
    jest.clearAllMocks();
  });

  describe('getTournamentParticipantsHandler', () => {
    it('should return participants for a tournament', async () => {
      const mockParticipants = [
        {
          participant: {
            id: '1',
            userId: 'user-1',
            tournamentId: 'tournament-1',
            status: 'joined',
            joinedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
          },
          user: {
            id: 'user-1',
            email: 'user1@example.com',
            username: 'user1',
            firstName: 'John',
            lastName: 'Doe'
          }
        },
        {
          participant: {
            id: '2',
            userId: 'user-2',
            tournamentId: 'tournament-1',
            status: 'invited',
            joinedAt: null,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          user: {
            id: 'user-2',
            email: 'user2@example.com',
            username: 'user2',
            firstName: 'Jane',
            lastName: 'Smith'
          }
        }
      ];
      
      // Mock the service method
      jest.spyOn(participantService, 'getTournamentParticipants')
        .mockResolvedValue(mockParticipants as any);
      
      mockRequest.params = { id: 'tournament-1' };
      
      await participantController.getTournamentParticipantsHandler(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(participantService.getTournamentParticipants).toHaveBeenCalledWith('tournament-1');
      expect(responseJson).toHaveBeenCalledWith(mockParticipants);
    });
    
    it('should handle errors', async () => {
      // Mock the service method to throw an error
      jest.spyOn(participantService, 'getTournamentParticipants')
        .mockRejectedValue(new Error('Database error'));
      
      mockRequest.params = { id: 'tournament-1' };
      
      await participantController.getTournamentParticipantsHandler(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(loggerMock.error).toHaveBeenCalledWith(
        'Error getting tournament participants', 
        expect.objectContaining({ error: expect.any(Error) })
      );
      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith({
        error: 'Failed to get tournament participants',
        details: 'Database error'
      });
    });
  });
  
  describe('inviteParticipantsHandler', () => {
    it('should invite participants to a tournament', async () => {
      const mockInvites = {
        invited: ['user1@example.com', 'user2@example.com'],
        alreadyInvited: [],
        invalidEmails: []
      };
      
      // Mock validator to return success
      validateInviteParticipantsMock.mockReturnValue({
        success: true,
        data: { emails: ['user1@example.com', 'user2@example.com'] }
      });
      
      jest.spyOn(participantService, 'inviteParticipants')
        .mockResolvedValue(mockInvites as any);
      
      mockRequest.params = { id: 'tournament-1' };
      mockRequest.body = { emails: ['user1@example.com', 'user2@example.com'] };
      
      await participantController.inviteParticipantsHandler(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(participantService.inviteParticipants).toHaveBeenCalledWith(
        'tournament-1', 
        ['user1@example.com', 'user2@example.com'],
        'test-user-id'
      );
      expect(responseJson).toHaveBeenCalledWith(mockInvites);
    });
    
    it('should handle unauthorized errors', async () => {
      // Mock validator to return success
      validateInviteParticipantsMock.mockReturnValue({
        success: true,
        data: { emails: ['user1@example.com'] }
      });
      
      const unauthorizedError = new Error('Unauthorized: Only the creator can invite participants');
      
      jest.spyOn(participantService, 'inviteParticipants')
        .mockRejectedValue(unauthorizedError);
      
      mockRequest.params = { id: 'tournament-1' };
      mockRequest.body = { emails: ['user1@example.com'] };
      
      await participantController.inviteParticipantsHandler(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(loggerMock.error).toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(403);
      expect(responseJson).toHaveBeenCalledWith({
        error: 'Unauthorized: Only the creator can invite participants'
      });
    });
  });
  
  describe('joinTournamentHandler', () => {
    it('should allow a user to join a tournament', async () => {
      const mockParticipant = { 
        id: '1', 
        userId: 'test-user-id', 
        tournamentId: 'tournament-1', 
        status: 'joined',
        joinedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      jest.spyOn(participantService, 'joinTournament')
        .mockResolvedValue(mockParticipant as any);
      
      mockRequest.params = { id: 'tournament-1' };
      
      await participantController.joinTournamentHandler(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(participantService.joinTournament).toHaveBeenCalledWith('tournament-1', 'test-user-id');
      expect(responseJson).toHaveBeenCalledWith(mockParticipant);
    });
    
    it('should handle tournament not found errors', async () => {
      jest.spyOn(participantService, 'joinTournament')
        .mockRejectedValue(new Error('Tournament not found'));
      
      mockRequest.params = { id: 'non-existent' };
      
      await participantController.joinTournamentHandler(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(loggerMock.error).toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(404);
      expect(responseJson).toHaveBeenCalledWith({
        error: 'Tournament not found'
      });
    });
    
    it('should handle already joined errors', async () => {
      jest.spyOn(participantService, 'joinTournament')
        .mockRejectedValue(new Error('User has already joined this tournament'));
      
      mockRequest.params = { id: 'tournament-1' };
      
      await participantController.joinTournamentHandler(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(loggerMock.error).toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({
        error: 'User has already joined this tournament'
      });
    });
  });
  
  describe('updateParticipantStatusHandler', () => {
    it('should update a participant status', async () => {
      const mockUpdatedParticipant = { 
        id: '1', 
        userId: 'user-1', 
        tournamentId: 'tournament-1', 
        status: 'declined',
        joinedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      jest.spyOn(participantService, 'updateParticipantStatus')
        .mockResolvedValue(mockUpdatedParticipant as any);
      
      mockRequest.params = { id: 'tournament-1', userId: 'user-1' };
      mockRequest.body = { status: 'declined' };
      
      await participantController.updateParticipantStatusHandler(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(participantService.updateParticipantStatus).toHaveBeenCalledWith(
        'tournament-1', 
        'user-1', 
        'declined', 
        'test-user-id'
      );
      expect(responseJson).toHaveBeenCalledWith(mockUpdatedParticipant);
    });
    
    it('should handle invalid status errors', async () => {
      mockRequest.params = { id: 'tournament-1', userId: 'user-1' };
      mockRequest.body = { status: 'invalid-status' };
      
      await participantController.updateParticipantStatusHandler(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({
        error: 'Invalid status. Must be one of: invited, joined, declined'
      });
    });
    
    it('should handle unauthorized errors', async () => {
      jest.spyOn(participantService, 'updateParticipantStatus')
        .mockRejectedValue(new Error('Unauthorized: Only the tournament creator or the participant can update status'));
      
      mockRequest.params = { id: 'tournament-1', userId: 'user-2' };
      mockRequest.body = { status: 'declined' };
      
      await participantController.updateParticipantStatusHandler(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(loggerMock.error).toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(403);
      expect(responseJson).toHaveBeenCalledWith({
        error: 'Unauthorized: Only the tournament creator or the participant can update status'
      });
    });
  });
}); 