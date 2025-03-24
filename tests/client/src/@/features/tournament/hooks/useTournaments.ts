import { Tournament, TournamentListResponse } from '../types';
import { tournamentApi } from '../api/tournamentApi';

// Mock data
const mockTournament: Tournament = {
  id: '1',
  name: 'Test Tournament',
  description: 'This is a test tournament',
  durationDays: 7,
  startDate: '2023-01-01T00:00:00.000Z',
  status: 'pending',
  requiresVerification: true,
  timezone: 'UTC',
  creatorId: 'user-1',
  creatorUsername: 'testuser',
  participantCount: 5
};

// Mock paginated tournament list data
const mockTournamentList: TournamentListResponse = {
  tournaments: [
    mockTournament,
    { ...mockTournament, id: '2', name: 'Second Tournament' },
    { ...mockTournament, id: '3', name: 'Third Tournament' },
  ],
  pagination: {
    page: 1,
    pageSize: 10,
    totalCount: 3,
    totalPages: 1
  }
};

// Mock the useTournaments hook
export const useTournaments = jest.fn().mockReturnValue({
  tournaments: mockTournamentList.tournaments,
  isLoading: false,
  error: null,
  pagination: mockTournamentList.pagination,
  refetch: jest.fn(),
  setPage: jest.fn(),
  setFilters: jest.fn()
});

// Mock the useTournament hook (for single tournament details)
export const useTournament = jest.fn().mockReturnValue({
  tournament: mockTournament,
  isLoading: false,
  error: null,
  refetch: jest.fn()
});

// Mock the useCreateTournament hook
export const useCreateTournament = jest.fn().mockReturnValue({
  createTournament: jest.fn().mockImplementation(data => {
    return Promise.resolve(tournamentApi.createTournament(data));
  }),
  isLoading: false,
  error: null
});

// Mock the useUpdateTournament hook
export const useUpdateTournament = jest.fn().mockReturnValue({
  updateTournament: jest.fn().mockImplementation((id, data) => {
    return Promise.resolve(tournamentApi.updateTournament(id, data));
  }),
  isLoading: false,
  error: null
});

// Mock the useDeleteTournament hook
export const useDeleteTournament = jest.fn().mockReturnValue({
  deleteTournament: jest.fn().mockImplementation(id => {
    return Promise.resolve(tournamentApi.deleteTournament(id));
  }),
  isLoading: false,
  error: null
}); 