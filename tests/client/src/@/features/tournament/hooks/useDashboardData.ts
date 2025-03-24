import { DashboardData } from '../types';
import { tournamentApi } from '../api/tournamentApi';

// Mock dashboard data
const mockDashboardData: DashboardData = {
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
      tournamentId: '1',
      tournamentName: 'Test Tournament',
      message: 'Tournament has started',
      timestamp: '2023-01-01T00:00:00.000Z',
      read: false
    }
  ],
  upcomingTournaments: [
    {
      id: '2',
      name: 'Upcoming Tournament',
      startDate: '2023-02-01T00:00:00.000Z',
      creatorId: 'user-2'
    }
  ],
  unreadNotificationsCount: 1
};

// Mock the useDashboardData hook
export const useDashboardData = jest.fn().mockReturnValue({
  dashboardData: mockDashboardData,
  isLoading: false,
  error: null,
  refetch: jest.fn()
}); 