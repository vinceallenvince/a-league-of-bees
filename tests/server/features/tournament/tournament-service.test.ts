import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import * as queries from '../../../../server/features/tournament/queries';
import { tournamentService } from '../../../../server/features/tournament/services/tournament';

// Define types for our test objects
type TournamentStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

interface MockTournament {
  id: string;
  name: string;
  creatorId: string;
  description?: string | null;
  durationDays?: number;
  startDate?: Date;
  requiresVerification?: boolean;
  status?: TournamentStatus;
  timezone?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Mock the queries module
jest.mock('../../../../server/features/tournament/queries', () => ({
  getActiveTournaments: jest.fn(),
  getTournamentsByCreator: jest.fn(),
  getTournamentById: jest.fn(),
  searchTournaments: jest.fn()
}));

describe('Tournament Service', () => {
  // Reset mocks before each test
  beforeEach(() => {
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
      
      jest.spyOn(queries, 'getActiveTournaments')
        .mockResolvedValue(mockTournaments as any);
      
      const result = await tournamentService.getTournaments(1, 10);
      
      expect(queries.getActiveTournaments).toHaveBeenCalledWith(1, 10);
      expect(result).toEqual(mockTournaments);
    });
    
    it('should get tournaments by creator when userId is provided', async () => {
      const mockTournaments: MockTournament[] = [
        { id: '1', name: 'Test Tournament', creatorId: 'user-1' }
      ];
      
      jest.spyOn(queries, 'getTournamentsByCreator')
        .mockResolvedValue(mockTournaments as any);
      
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
      const mockTournament: MockTournament = { 
        id: '1', 
        name: 'Test Tournament', 
        creatorId: 'user-1' 
      };
      
      jest.spyOn(queries, 'getTournamentById')
        .mockResolvedValue(mockTournament as any);
      
      const result = await tournamentService.getTournamentById('1');
      
      expect(queries.getTournamentById).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockTournament);
    });
    
    it('should return null when tournament is not found', async () => {
      jest.spyOn(queries, 'getTournamentById')
        .mockResolvedValue(null as any);
      
      const result = await tournamentService.getTournamentById('non-existent');
      
      expect(queries.getTournamentById).toHaveBeenCalledWith('non-existent');
      expect(result).toBeNull();
    });
  });
  
  // Note: The remaining tests for createTournament, updateTournament, and cancelTournament
  // would need more complex mocking of the internal database operations to work properly.
  // For now, we'll focus on the functions that interact directly with the queries module.
}); 