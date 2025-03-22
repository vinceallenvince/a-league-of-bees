import { renderHook, waitFor, act } from '@testing-library/react';
import { useTournamentScores } from '../useTournamentScores';
import { tournamentApi } from '../../api/tournamentApi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock the tournamentApi
jest.mock('../../api/tournamentApi');

describe('useTournamentScores', () => {
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

  it('should fetch scores data when tournamentId is provided', async () => {
    const mockScores = [
      {
        id: 's1',
        userId: 'u1',
        tournamentId: 't1',
        day: 1,
        score: 100,
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      },
      {
        id: 's2',
        userId: 'u2',
        tournamentId: 't1',
        day: 1,
        score: 150,
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      }
    ];

    (tournamentApi.getScores as jest.Mock).mockResolvedValue(mockScores);

    const { result } = renderHook(() => useTournamentScores('t1'), { wrapper });

    // Initial state
    expect(result.current.isLoadingScores).toBe(true);
    expect(result.current.scores).toBeUndefined();

    // Wait for data to load
    await waitFor(() => expect(result.current.isLoadingScores).toBe(false));

    expect(result.current.scores).toEqual(mockScores);
    expect(result.current.scoresError).toBeNull();
    expect(tournamentApi.getScores).toHaveBeenCalledWith('t1', {
      userId: undefined,
      day: undefined
    });
  });

  it('should fetch leaderboard data when tournamentId is provided', async () => {
    const mockLeaderboard = [
      {
        userId: 'u2',
        username: 'User 2',
        totalScore: 150,
        scoresSubmitted: 1,
        rank: 1
      },
      {
        userId: 'u1',
        username: 'User 1',
        totalScore: 100,
        scoresSubmitted: 1,
        rank: 2
      }
    ];

    (tournamentApi.getLeaderboard as jest.Mock).mockResolvedValue(mockLeaderboard);

    const { result } = renderHook(() => useTournamentScores('t1'), { wrapper });

    // Initial state
    expect(result.current.isLoadingLeaderboard).toBe(true);
    expect(result.current.leaderboard).toBeUndefined();

    // Wait for data to load
    await waitFor(() => expect(result.current.isLoadingLeaderboard).toBe(false));

    expect(result.current.leaderboard).toEqual(mockLeaderboard);
    expect(result.current.leaderboardError).toBeNull();
    expect(tournamentApi.getLeaderboard).toHaveBeenCalledWith('t1', undefined);
  });

  it('should not fetch data when tournamentId is not provided', async () => {
    const { result } = renderHook(() => useTournamentScores(), { wrapper });

    // Should not be loading since the queries are disabled
    expect(result.current.isLoadingScores).toBe(false);
    expect(result.current.isLoadingLeaderboard).toBe(false);

    // API should not have been called
    expect(tournamentApi.getScores).not.toHaveBeenCalled();
    expect(tournamentApi.getLeaderboard).not.toHaveBeenCalled();
  });

  it('should refetch scores when filters change', async () => {
    const allScores = [
      { id: 's1', userId: 'u1', tournamentId: 't1', day: 1, score: 100 },
      { id: 's2', userId: 'u2', tournamentId: 't1', day: 1, score: 150 }
    ];

    const filteredScores = [
      { id: 's1', userId: 'u1', tournamentId: 't1', day: 1, score: 100 }
    ];

    (tournamentApi.getScores as jest.Mock)
      .mockResolvedValueOnce(allScores)
      .mockResolvedValueOnce(filteredScores);

    const { result } = renderHook(() => useTournamentScores('t1'), { wrapper });

    // Wait for initial data to load
    await waitFor(() => expect(result.current.isLoadingScores).toBe(false));
    expect(result.current.scores).toEqual(allScores);

    // Set filters
    act(() => {
      result.current.setUserId('u1');
    });

    // Should be loading again
    await waitFor(() => expect(result.current.isLoadingScores).toBe(true));

    // Wait for new data
    await waitFor(() => expect(result.current.isLoadingScores).toBe(false));

    expect(result.current.scores).toEqual(filteredScores);
    expect(tournamentApi.getScores).toHaveBeenCalledWith('t1', expect.objectContaining({
      userId: 'u1'
    }));
  });

  it('should refetch leaderboard when day filter changes', async () => {
    const day1Leaderboard = [
      { userId: 'u2', username: 'User 2', totalScore: 150, scoresSubmitted: 1, rank: 1 },
      { userId: 'u1', username: 'User 1', totalScore: 100, scoresSubmitted: 1, rank: 2 }
    ];

    const day2Leaderboard = [
      { userId: 'u1', username: 'User 1', totalScore: 200, scoresSubmitted: 2, rank: 1 },
      { userId: 'u2', username: 'User 2', totalScore: 180, scoresSubmitted: 2, rank: 2 }
    ];

    (tournamentApi.getLeaderboard as jest.Mock)
      .mockResolvedValueOnce(day1Leaderboard)
      .mockResolvedValueOnce(day2Leaderboard);

    const { result } = renderHook(() => useTournamentScores('t1'), { wrapper });

    // Wait for initial data to load
    await waitFor(() => expect(result.current.isLoadingLeaderboard).toBe(false));
    expect(result.current.leaderboard).toEqual(day1Leaderboard);

    // Set day filter
    act(() => {
      result.current.setDay(2);
    });

    // Should be loading again
    await waitFor(() => expect(result.current.isLoadingLeaderboard).toBe(true));

    // Wait for new data
    await waitFor(() => expect(result.current.isLoadingLeaderboard).toBe(false));

    expect(result.current.leaderboard).toEqual(day2Leaderboard);
    expect(tournamentApi.getLeaderboard).toHaveBeenCalledWith('t1', 2);
  });

  it('should submit score successfully', async () => {
    const submitResult = { success: true, scoreId: 's3' };
    (tournamentApi.submitScore as jest.Mock).mockResolvedValue(submitResult);

    const { result } = renderHook(() => useTournamentScores('t1'), { wrapper });

    const scoreData = {
      day: 2,
      score: 200,
      screenshot: new File([''], 'screenshot.png', { type: 'image/png' })
    };

    // Call submitScore
    const promise = result.current.submitScore(scoreData);

    // Wait for the mutation to complete
    const response = await promise;
    expect(response).toEqual(submitResult);
    expect(tournamentApi.submitScore).toHaveBeenCalledWith('t1', scoreData);
  });

  it('should handle error when submitting score fails', async () => {
    const errorMessage = 'Failed to submit score';
    (tournamentApi.submitScore as jest.Mock).mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useTournamentScores('t1'), { wrapper });

    const scoreData = {
      day: 2,
      score: 200
    };

    // Call submitScore and expect it to throw
    await expect(result.current.submitScore(scoreData)).rejects.toThrow(errorMessage);
    expect(tournamentApi.submitScore).toHaveBeenCalledWith('t1', scoreData);
  });
}); 