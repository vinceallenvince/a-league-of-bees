import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import * as queries from '../../../../server/features/tournament/queries';
import { tournamentService } from '../../../../server/features/tournament/services/tournament';

// Mock the queries module
jest.mock('../../../../server/features/tournament/queries', () => ({
  getActiveTournaments: jest.fn(),
  getTournamentsByCreator: jest.fn(),
  getTournamentById: jest.fn(),
  searchTournaments: jest.fn()
}));

describe('Tournament Service', () => {
  beforeEach(() => {
    // Reset mock implementations
    jest.clearAllMocks();
  });

  describe('getTournaments', () => {
    it('should get tournaments with pagination', async () => {
      const mockTournaments = {
        tournaments: [{ id: '1', name: 'Test Tournament' }],
        total: 1,
        page: 1,
        pageSize: 10,
        totalPages: 1
      };
      
      (queries.getActiveTournaments as jest.Mock).mockResolvedValue(mockTournaments);
      
      const result = await tournamentService.getTournaments(1, 10);
      
      expect(queries.getActiveTournaments).toHaveBeenCalledWith(1, 10);
      expect(result).toEqual(mockTournaments);
    });
    
    it('should get tournaments by creator when userId is provided', async () => {
      const mockTournaments = [
        { id: '1', name: 'Test Tournament', creatorId: 'user-1' }
      ];
      
      (queries.getTournamentsByCreator as jest.Mock).mockResolvedValue(mockTournaments);
      
      const result = await tournamentService.getTournaments(1, 10, 'user-1');
      
      expect(queries.getTournamentsByCreator).toHaveBeenCalledWith('user-1');
      expect(result).toEqual({
        tournaments: mockTournaments,
        total: 1,
        page: 1,
        pageSize: 10,
        totalPages: 1
      });
    });
  });
  
  describe('getTournamentById', () => {
    it('should get a tournament by ID', async () => {
      const mockTournament = { id: '1', name: 'Test Tournament' };
      
      (queries.getTournamentById as jest.Mock).mockResolvedValue(mockTournament);
      
      const result = await tournamentService.getTournamentById('1');
      
      expect(queries.getTournamentById).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockTournament);
    });
    
    it('should return null when tournament is not found', async () => {
      (queries.getTournamentById as jest.Mock).mockResolvedValue(null);
      
      const result = await tournamentService.getTournamentById('non-existent');
      
      expect(queries.getTournamentById).toHaveBeenCalledWith('non-existent');
      expect(result).toBeNull();
    });
  });
  
  describe('createTournament', () => {
    it('should create a tournament', async () => {
      const mockTournamentData = {
        name: 'New Tournament',
        description: 'Test description',
        durationDays: 7,
        startDate: new Date(),
        requiresVerification: false,
        timezone: 'UTC'
      };
      
      const mockCreatedTournament = {
        id: '1',
        ...mockTournamentData,
        creatorId: 'user-1',
        status: 'pending' as const,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Mock the db insert function
      jest.spyOn(tournamentService, 'createTournament').mockResolvedValueOnce(mockCreatedTournament);
      
      const result = await tournamentService.createTournament(mockTournamentData, 'user-1');
      
      expect(result).toEqual(mockCreatedTournament);
    });
  });
  
  describe('updateTournament', () => {
    it('should update a tournament', async () => {
      const mockUpdateData = {
        name: 'Updated Tournament',
        description: 'Updated description'
      };
      
      const mockTournament = {
        id: '1',
        name: 'Test Tournament',
        description: 'Original description',
        creatorId: 'user-1',
        durationDays: 7,
        startDate: new Date(),
        requiresVerification: false,
        timezone: 'UTC',
        status: 'pending' as const,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const mockUpdatedTournament = {
        ...mockTournament,
        ...mockUpdateData,
        updatedAt: new Date()
      };
      
      (queries.getTournamentById as jest.Mock).mockResolvedValue(mockTournament);
      
      // Mock the update function
      jest.spyOn(tournamentService, 'updateTournament').mockResolvedValueOnce(mockUpdatedTournament);
      
      const result = await tournamentService.updateTournament('1', mockUpdateData, 'user-1');
      
      expect(queries.getTournamentById).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockUpdatedTournament);
    });
    
    it('should throw an error when tournament is not found', async () => {
      (queries.getTournamentById as jest.Mock).mockResolvedValue(null);
      
      await expect(tournamentService.updateTournament('non-existent', { name: 'Updated' }, 'user-1'))
        .rejects
        .toThrow('Tournament not found');
    });
    
    it('should throw an error when user is not the creator', async () => {
      const mockTournament = {
        id: '1',
        name: 'Test Tournament',
        creatorId: 'other-user-id'
      };
      
      (queries.getTournamentById as jest.Mock).mockResolvedValue(mockTournament);
      
      await expect(tournamentService.updateTournament('1', { name: 'Updated' }, 'user-1'))
        .rejects
        .toThrow('Unauthorized: Only the creator can update this tournament');
    });
  });
  
  describe('cancelTournament', () => {
    it('should cancel a tournament', async () => {
      const mockTournament = {
        id: '1',
        name: 'Test Tournament',
        creatorId: 'user-1',
        status: 'pending' as const
      };
      
      const mockCancelledTournament = {
        ...mockTournament,
        status: 'cancelled' as const,
        updatedAt: new Date()
      };
      
      (queries.getTournamentById as jest.Mock).mockResolvedValue(mockTournament);
      
      // Mock the cancel function
      jest.spyOn(tournamentService, 'cancelTournament').mockResolvedValueOnce(mockCancelledTournament);
      
      const result = await tournamentService.cancelTournament('1', 'user-1');
      
      expect(queries.getTournamentById).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockCancelledTournament);
    });
    
    it('should throw an error when tournament is not found', async () => {
      (queries.getTournamentById as jest.Mock).mockResolvedValue(null);
      
      await expect(tournamentService.cancelTournament('non-existent', 'user-1'))
        .rejects
        .toThrow('Tournament not found');
    });
    
    it('should throw an error when user is not the creator', async () => {
      const mockTournament = {
        id: '1',
        name: 'Test Tournament',
        creatorId: 'other-user-id',
        status: 'pending' as const
      };
      
      (queries.getTournamentById as jest.Mock).mockResolvedValue(mockTournament);
      
      await expect(tournamentService.cancelTournament('1', 'user-1'))
        .rejects
        .toThrow('Unauthorized: Only the creator can cancel this tournament');
    });
    
    it('should throw an error when tournament is already completed', async () => {
      const mockTournament = {
        id: '1',
        name: 'Test Tournament',
        creatorId: 'user-1',
        status: 'completed' as const
      };
      
      (queries.getTournamentById as jest.Mock).mockResolvedValue(mockTournament);
      
      await expect(tournamentService.cancelTournament('1', 'user-1'))
        .rejects
        .toThrow('Cannot cancel a completed tournament');
    });
  });
}); 