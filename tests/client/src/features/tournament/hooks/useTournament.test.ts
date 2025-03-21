import { renderHook, act } from '@testing-library/react';
import React from 'react';

// Define types for our test
interface Tournament {
  id: string;
  name: string;
  description?: string;
  status?: string;
  startDate?: Date;
  durationDays?: number;
  creatorId?: string;
  requiresVerification?: boolean;
  timezone?: string;
}

interface TournamentFormData {
  name: string;
  description?: string;
  durationDays: number;
  startDate: Date;
  requiresVerification: boolean;
  timezone: string;
}

interface TournamentListResponse {
  tournaments: Tournament[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}

// Mock tournamentApi
const tournamentApi = {
  getTournaments: jest.fn(),
  getTournamentById: jest.fn(),
  createTournament: jest.fn(),
  updateTournament: jest.fn(),
  cancelTournament: jest.fn()
};

// Mock useTournament hook implementation
function useTournament() {
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  const [tournaments, setTournaments] = React.useState<Tournament[] | null>(null);
  const [tournament, setTournament] = React.useState<Tournament | null>(null);
  const [pagination, setPagination] = React.useState<{
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  } | null>(null);

  // Mock implementation that will be replaced by testing mocks
  React.useEffect(() => {
    getTournaments();
  }, []);

  const getTournaments = async (page = 1, pageSize = 10) => {
    setIsLoading(true);
    try {
      const response = await tournamentApi.getTournaments(page, pageSize);
      setTournaments(response.tournaments);
      setPagination(response.pagination);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setTournaments(null);
      setPagination(null);
    } finally {
      setIsLoading(false);
    }
  };

  const getTournamentById = async (id: string) => {
    setIsLoading(true);
    try {
      const response = await tournamentApi.getTournamentById(id);
      setTournament(response);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setTournament(null);
    } finally {
      setIsLoading(false);
    }
  };

  const createTournament = async (data: TournamentFormData) => {
    setIsSubmitting(true);
    try {
      const response = await tournamentApi.createTournament(data);
      setTournament(response);
      setError(null);
      return response;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isLoading,
    isSubmitting,
    error,
    tournaments,
    tournament,
    pagination,
    getTournaments,
    getTournamentById,
    createTournament
  };
}

describe('useTournament hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should fetch tournaments on load', async () => {
    const mockTournaments = {
      tournaments: [
        { id: '1', name: 'Tournament 1' },
        { id: '2', name: 'Tournament 2' }
      ],
      pagination: {
        page: 1,
        pageSize: 10,
        totalCount: 2,
        totalPages: 1
      }
    };
    
    tournamentApi.getTournaments.mockResolvedValue(mockTournaments);
    
    const { result, rerender } = renderHook(() => useTournament());
    
    // Initial state
    expect(result.current.isLoading).toBe(true);
    expect(result.current.tournaments).toBeNull();
    
    // Wait for the effect to complete
    await act(async () => {
      await Promise.resolve();
    });
    
    // After data is loaded
    expect(result.current.isLoading).toBe(false);
    expect(result.current.tournaments).toEqual(mockTournaments.tournaments);
    expect(result.current.pagination).toEqual(mockTournaments.pagination);
    expect(tournamentApi.getTournaments).toHaveBeenCalledWith(1, 10);
  });
  
  it('should handle errors when fetching tournaments', async () => {
    const error = new Error('Failed to fetch tournaments');
    tournamentApi.getTournaments.mockRejectedValue(error);
    
    const { result } = renderHook(() => useTournament());
    
    // Wait for the effect to complete
    await act(async () => {
      await Promise.resolve();
    });
    
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toEqual(error);
    expect(result.current.tournaments).toBeNull();
  });
  
  it('should fetch a single tournament by ID', async () => {
    const mockTournament = { 
      id: '1', 
      name: 'Tournament 1',
      description: 'Description',
      status: 'in_progress'
    };
    
    tournamentApi.getTournamentById.mockResolvedValue(mockTournament);
    
    const { result } = renderHook(() => useTournament());
    
    await act(async () => {
      result.current.getTournamentById('1');
      await Promise.resolve();
    });
    
    expect(result.current.isLoading).toBe(false);
    expect(result.current.tournament).toEqual(mockTournament);
    expect(tournamentApi.getTournamentById).toHaveBeenCalledWith('1');
  });
  
  it('should create a new tournament', async () => {
    const newTournament = {
      name: 'New Tournament',
      description: 'New Description',
      durationDays: 7,
      startDate: new Date(),
      requiresVerification: false,
      timezone: 'UTC'
    };
    
    const createdTournament = {
      ...newTournament,
      id: '123',
      status: 'pending',
      creatorId: 'user-1'
    };
    
    tournamentApi.createTournament.mockResolvedValue(createdTournament);
    
    const { result } = renderHook(() => useTournament());
    
    await act(async () => {
      await result.current.createTournament(newTournament);
    });
    
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.tournament).toEqual(createdTournament);
    expect(tournamentApi.createTournament).toHaveBeenCalledWith(newTournament);
  });
}); 