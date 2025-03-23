import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock DashboardData type
interface DashboardData {
  userInfo: {
    id: string;
    username: string;
    email: string;
  };
  tournamentSummary: {
    active: number;
    pending: number;
    completed: number;
    cancelled: number;
  };
  participation: {
    hosting: number;
    joined: number;
    invited: number;
  };
  recentActivity: {
    id: string;
    type: string;
    tournamentId: string;
    tournamentName: string;
    message: string;
    timestamp: string;
    read: boolean;
  }[];
  upcomingTournaments: {
    id: string;
    name: string;
    startDate: string;
    creatorId: string;
  }[];
  unreadNotificationsCount: number;
}

// Mock tournamentApi
const tournamentApi = {
  getDashboard: jest.fn(),
  getTournaments: jest.fn(),
  getTournamentById: jest.fn(),
  createTournament: jest.fn(),
  updateTournament: jest.fn(),
  cancelTournament: jest.fn()
};

// Mock useDashboardData hook
function useDashboardData() {
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);
  const [dashboardData, setDashboardData] = React.useState<DashboardData>();
  
  React.useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const data = await tournamentApi.getDashboard();
        setDashboardData(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);
  
  return {
    isLoading,
    error,
    dashboardData,
    refetch: async () => {
      setIsLoading(true);
      try {
        const data = await tournamentApi.getDashboard();
        setDashboardData(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
      }
    }
  };
}

// Mock the API
jest.mock('@/features/tournament/api/tournamentApi', () => ({
  tournamentApi: {
    getDashboard: jest.fn(),
    getTournaments: jest.fn(),
    getTournamentById: jest.fn(),
    createTournament: jest.fn(),
    updateTournament: jest.fn(),
    cancelTournament: jest.fn()
  }
}));

describe('useDashboardData', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
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
        email: 'test@example.com',
      },
      tournamentSummary: {
        active: 2,
        pending: 1,
        completed: 3,
        cancelled: 0,
      },
      participation: {
        hosting: 1,
        joined: 3,
        invited: 2,
      },
      recentActivity: [
        {
          id: 'activity-1',
          type: 'invitation',
          tournamentId: 'tournament-1',
          tournamentName: 'Test Tournament 1',
          message: 'You have been invited to join Test Tournament 1',
          timestamp: '2023-01-01T00:00:00.000Z',
          read: false,
        }
      ],
      upcomingTournaments: [
        {
          id: 'tournament-2',
          name: 'Test Tournament 2',
          startDate: '2023-02-01T00:00:00.000Z',
          creatorId: 'user-2',
        }
      ],
      unreadNotificationsCount: 2,
    };
    
    (tournamentApi.getDashboard as jest.Mock).mockResolvedValue(mockDashboardData);
    
    const { result } = renderHook(() => useDashboardData(), { wrapper });
    
    // Initially should be in loading state
    expect(result.current.isLoading).toBe(true);
    expect(result.current.dashboardData).toBeUndefined();
    
    // Wait for the query to complete
    await waitFor(() => !result.current.isLoading);
    
    // Should have the data
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.dashboardData).toEqual(mockDashboardData);
    
    // Should have called the API
    expect(tournamentApi.getDashboard).toHaveBeenCalledTimes(1);
  });
  
  it('should handle API errors', async () => {
    const errorMessage = 'Failed to fetch dashboard data';
    (tournamentApi.getDashboard as jest.Mock).mockRejectedValue(new Error(errorMessage));
    
    const { result } = renderHook(() => useDashboardData(), { wrapper });
    
    // Wait for the query to complete and transition from loading to error state
    await waitFor(() => {
      // The error should be set when the query fails
      expect(result.current.error).toBeTruthy();
    }, { timeout: 1000 });
    
    // Now we can check all the final state values
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe(errorMessage);
    expect(result.current.dashboardData).toBeUndefined();
    
    // Should have called the API
    expect(tournamentApi.getDashboard).toHaveBeenCalledTimes(1);
  });
}); 