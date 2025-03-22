import { renderHook, waitFor } from '@testing-library/react';
import { useDashboardData } from '../useDashboardData';
import { tournamentApi } from '../../api/tournamentApi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock the tournamentApi
jest.mock('../../api/tournamentApi');

describe('useDashboardData', () => {
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

  it('should fetch dashboard data successfully', async () => {
    const mockDashboardData = {
      userInfo: {
        id: 'user-1',
        username: 'testuser',
        email: 'test@example.com'
      },
      tournamentSummary: {
        active: 2,
        pending: 1,
        completed: 3,
        cancelled: 0
      },
      participation: {
        hosting: 3,
        joined: 2,
        invited: 1
      },
      recentActivity: [
        {
          id: 'activity-1',
          type: 'tournament_start',
          tournamentId: 'tournament-1',
          tournamentName: 'Tournament 1',
          message: 'Tournament has started',
          timestamp: '2023-01-01T00:00:00.000Z',
          read: false
        }
      ],
      upcomingTournaments: [
        {
          id: 'tournament-2',
          name: 'Tournament 2',
          startDate: '2023-01-10T00:00:00.000Z',
          creatorId: 'user-2'
        }
      ],
      unreadNotificationsCount: 5
    };

    (tournamentApi.getDashboard as jest.Mock).mockResolvedValue(mockDashboardData);

    const { result } = renderHook(() => useDashboardData(), { wrapper });

    // Initial state
    expect(result.current.isLoading).toBe(true);
    expect(result.current.dashboardData).toBeUndefined();

    // Wait for data to load
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.dashboardData).toEqual(mockDashboardData);
    expect(result.current.error).toBeNull();
    expect(tournamentApi.getDashboard).toHaveBeenCalledTimes(1);
  });

  it('should handle API errors', async () => {
    const errorMessage = 'Failed to fetch dashboard data';
    (tournamentApi.getDashboard as jest.Mock).mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useDashboardData(), { wrapper });

    // Wait for the query to complete and transition from loading to error state
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Now we can check all the final state values
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe(errorMessage);
    expect(result.current.dashboardData).toBeUndefined();
    expect(tournamentApi.getDashboard).toHaveBeenCalledTimes(1);
  });

  it('should provide a method to refresh dashboard data', async () => {
    const mockDashboardData = {
      userInfo: { id: 'user-1', username: 'testuser', email: 'test@example.com' },
      tournamentSummary: { active: 2, pending: 1, completed: 3, cancelled: 0 },
      participation: { hosting: 3, joined: 2, invited: 1 },
      recentActivity: [],
      upcomingTournaments: [],
      unreadNotificationsCount: 0
    };

    (tournamentApi.getDashboard as jest.Mock).mockResolvedValue(mockDashboardData);

    const { result } = renderHook(() => useDashboardData(), { wrapper });

    // Wait for initial data to load
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    
    // Mock the queryClient invalidateQueries method
    const spy = jest.spyOn(queryClient, 'invalidateQueries');
    
    // Call refreshDashboard
    result.current.refreshDashboard();
    
    // Should have called invalidateQueries for all relevant query keys
    expect(spy).toHaveBeenCalledWith({ queryKey: ['dashboard'] });
    expect(spy).toHaveBeenCalledWith({ queryKey: ['tournaments'] });
    expect(spy).toHaveBeenCalledWith({ queryKey: ['notifications'] });
    expect(spy).toHaveBeenCalledTimes(3);
  });
}); 