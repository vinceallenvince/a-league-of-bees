import { renderHook, waitFor } from '@testing-library/react';
import { useTournament } from '../useTournament';
import { tournamentApi } from '../../api/tournamentApi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock the tournamentApi
jest.mock('../../api/tournamentApi');

describe('useTournament', () => {
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

  it('should return tournament data when id is provided', async () => {
    const mockTournament = {
      id: '123',
      name: 'Test Tournament',
      description: 'Test Description',
      durationDays: 7,
      startDate: '2023-01-01T00:00:00.000Z',
      status: 'pending',
      creatorId: 'user-1',
      participantCount: 5
    };

    (tournamentApi.getTournament as jest.Mock).mockResolvedValue(mockTournament);

    const { result } = renderHook(() => useTournament('123'), { wrapper });

    // Initial state
    expect(result.current.isLoading).toBe(true);
    expect(result.current.tournament).toBeUndefined();

    // Wait for data to load
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.tournament).toEqual(mockTournament);
    expect(result.current.error).toBeNull();
    expect(tournamentApi.getTournament).toHaveBeenCalledWith('123');
  });

  it('should not fetch tournament data when id is not provided', async () => {
    const { result } = renderHook(() => useTournament(), { wrapper });

    // Should not be loading since the query is disabled
    expect(result.current.isLoading).toBe(false);
    expect(result.current.tournament).toBeUndefined();

    // API should not have been called
    expect(tournamentApi.getTournament).not.toHaveBeenCalled();
  });

  it('should handle error when tournament fetch fails', async () => {
    const errorMessage = 'Failed to fetch tournament';
    (tournamentApi.getTournament as jest.Mock).mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useTournament('123'), { wrapper });

    // Wait for error to be set
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe(errorMessage);
    expect(result.current.tournament).toBeUndefined();
  });

  it('should create a tournament successfully', async () => {
    const newTournament = {
      name: 'New Tournament',
      description: 'New Description',
      durationDays: 7,
      startDate: new Date('2023-01-01'),
      requiresVerification: false,
      timezone: 'UTC'
    };

    const createdTournament = {
      ...newTournament,
      id: '123',
      startDate: '2023-01-01T00:00:00.000Z',
      status: 'pending',
      creatorId: 'user-1',
      participantCount: 0
    };

    (tournamentApi.createTournament as jest.Mock).mockResolvedValue(createdTournament);

    const { result } = renderHook(() => useTournament(), { wrapper });

    // Call createTournament
    const promise = result.current.createTournament(newTournament);

    // Wait for the mutation to complete
    const tournament = await promise;
    expect(tournament).toEqual(createdTournament);
    expect(tournamentApi.createTournament).toHaveBeenCalledWith(newTournament);
  });

  it('should update a tournament successfully', async () => {
    const tournamentId = '123';
    const updateData = {
      name: 'Updated Tournament Name',
      description: 'Updated Description'
    };

    const updatedTournament = {
      id: tournamentId,
      name: 'Updated Tournament Name',
      description: 'Updated Description',
      durationDays: 7,
      startDate: '2023-01-01T00:00:00.000Z',
      status: 'pending',
      creatorId: 'user-1',
      participantCount: 5
    };

    (tournamentApi.updateTournament as jest.Mock).mockResolvedValue(updatedTournament);

    const { result } = renderHook(() => useTournament(tournamentId), { wrapper });

    // Call updateTournament
    const promise = result.current.updateTournament(updateData);

    // Wait for the mutation to complete
    const tournament = await promise;
    expect(tournament).toEqual(updatedTournament);
    expect(tournamentApi.updateTournament).toHaveBeenCalledWith(tournamentId, updateData);
  });

  it('should cancel a tournament successfully', async () => {
    const tournamentId = '123';
    const cancelResult = {
      id: tournamentId,
      status: 'cancelled'
    };

    (tournamentApi.cancelTournament as jest.Mock).mockResolvedValue(cancelResult);

    const { result } = renderHook(() => useTournament(tournamentId), { wrapper });

    // Call cancelTournament
    const promise = result.current.cancelTournament();

    // Wait for the mutation to complete
    const response = await promise;
    expect(response).toEqual(cancelResult);
    expect(tournamentApi.cancelTournament).toHaveBeenCalledWith(tournamentId);
  });

  it('should join a tournament successfully', async () => {
    const tournamentId = '123';
    const joinResult = { success: true };

    (tournamentApi.joinTournament as jest.Mock).mockResolvedValue(joinResult);

    const { result } = renderHook(() => useTournament(tournamentId), { wrapper });

    // Call joinTournament
    const promise = result.current.joinTournament();

    // Wait for the mutation to complete
    const response = await promise;
    expect(response).toEqual(joinResult);
    expect(tournamentApi.joinTournament).toHaveBeenCalledWith(tournamentId);
  });
}); 