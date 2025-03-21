import { renderHook, act, waitFor } from '@testing-library/react';
import { useTournaments } from '@/features/tournament/hooks/useTournaments';
import { tournamentApi } from '@/features/tournament/api/tournamentApi';
import { TournamentListResponse } from '@/features/tournament/types';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import React from 'react';

// Mock the API
jest.mock('@/features/tournament/api/tournamentApi');

describe('useTournaments', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient.clear();
  });

  it('fetches tournaments and returns data correctly', async () => {
    const mockResponse: TournamentListResponse = {
      tournaments: [
        {
          id: '1',
          name: 'Test Tournament',
          description: 'Description',
          durationDays: 7,
          startDate: '2023-01-01T00:00:00.000Z',
          status: 'pending',
          creatorId: 'user-1',
          creatorUsername: 'user1',
          participantCount: 5
        }
      ],
      pagination: {
        page: 1,
        pageSize: 10,
        totalCount: 1,
        totalPages: 1
      }
    };

    (tournamentApi.getTournaments as jest.Mock).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useTournaments(), { wrapper });

    // Initial state
    expect(result.current.isLoading).toBe(true);
    expect(result.current.tournaments).toEqual([]);

    // Wait for data to load
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.tournaments).toEqual(mockResponse.tournaments);
    expect(result.current.pagination).toEqual(mockResponse.pagination);
    expect(result.current.error).toBeNull();
  });

  it('handles error when fetching tournaments fails', async () => {
    const errorMessage = 'Failed to fetch tournaments';
    (tournamentApi.getTournaments as jest.Mock).mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useTournaments(), { wrapper });

    // Wait for error to be set
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe(errorMessage);
    expect(result.current.tournaments).toEqual([]);
  });

  it('changes page correctly', async () => {
    const page1Response: TournamentListResponse = {
      tournaments: [{ id: '1', name: 'Tournament 1', durationDays: 7, startDate: '2023-01-01', status: 'pending', creatorId: '1', participantCount: 0 }],
      pagination: { page: 1, pageSize: 10, totalCount: 2, totalPages: 2 }
    };

    const page2Response: TournamentListResponse = {
      tournaments: [{ id: '2', name: 'Tournament 2', durationDays: 7, startDate: '2023-01-01', status: 'pending', creatorId: '1', participantCount: 0 }],
      pagination: { page: 2, pageSize: 10, totalCount: 2, totalPages: 2 }
    };

    (tournamentApi.getTournaments as jest.Mock)
      .mockResolvedValueOnce(page1Response)
      .mockResolvedValueOnce(page2Response);

    const { result } = renderHook(() => useTournaments(), { wrapper });

    // Wait for initial data to load
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.tournaments).toEqual(page1Response.tournaments);

    // Change page
    act(() => {
      result.current.setPage(2);
    });

    // Should be loading again
    expect(result.current.isLoading).toBe(true);

    // Wait for new data
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(tournamentApi.getTournaments).toHaveBeenCalledWith(expect.objectContaining({ page: 2 }));
    expect(result.current.tournaments).toEqual(page2Response.tournaments);
    expect(result.current.pagination.page).toBe(2);
  });

  it('applies filters correctly', async () => {
    const mockResponse: TournamentListResponse = {
      tournaments: [
        {
          id: '1',
          name: 'Active Tournament',
          description: 'Description',
          durationDays: 7,
          startDate: '2023-01-01T00:00:00.000Z',
          status: 'in_progress',
          creatorId: 'user-1',
          creatorUsername: 'user1',
          participantCount: 5
        }
      ],
      pagination: {
        page: 1,
        pageSize: 10,
        totalCount: 1,
        totalPages: 1
      }
    };

    (tournamentApi.getTournaments as jest.Mock).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useTournaments(), { wrapper });

    // Wait for initial data
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Apply status filter
    act(() => {
      result.current.setFilters({ status: 'in_progress' });
    });

    // Should trigger loading state
    expect(result.current.isLoading).toBe(true);

    // Wait for filtered data
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(tournamentApi.getTournaments).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'in_progress' })
    );
  });
}); 