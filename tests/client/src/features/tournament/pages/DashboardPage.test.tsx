import { render, screen, waitFor } from '@testing-library/react';
import DashboardPage from '@/features/tournament/pages/DashboardPage';
import { useDashboardData } from '@/features/tournament/hooks/useDashboardData';

// Mock the dashboard hook
jest.mock('@/features/tournament/hooks/useDashboardData');

describe('DashboardPage', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    (useDashboardData as jest.Mock).mockReturnValue({
      dashboardData: null,
      isLoading: true,
      error: null,
    });
    
    render(<DashboardPage />);
    
    expect(screen.getByText(/Loading dashboard data/i)).toBeInTheDocument();
  });

  it('renders dashboard content when data is loaded', async () => {
    (useDashboardData as jest.Mock).mockReturnValue({
      dashboardData: {
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
      },
      isLoading: false,
      error: null,
    });
    
    render(<DashboardPage />);
    
    await waitFor(() => {
      // Check tournament summary section
      expect(screen.getByText('Tournament Summary')).toBeInTheDocument();
      expect(screen.getAllByText('2').length).toBeGreaterThan(0); // Active tournaments
      expect(screen.getAllByText('3').length).toBeGreaterThan(0); // Completed tournaments
      
      // Check participation section
      expect(screen.getByText('Your Participation')).toBeInTheDocument();
      expect(screen.getAllByText('1').length).toBeGreaterThan(0); // Hosting
      
      // Check upcoming tournaments section
      expect(screen.getByText('Upcoming Tournaments')).toBeInTheDocument();
      expect(screen.getByText('Test Tournament 2')).toBeInTheDocument();
      
      // Check recent activity section
      expect(screen.getByText('Recent Activity')).toBeInTheDocument();
      expect(screen.getByText('2 unread')).toBeInTheDocument();
      expect(screen.getByText('You have been invited to join Test Tournament 1')).toBeInTheDocument();
      expect(screen.getByText('Invitation')).toBeInTheDocument();
    });
  });

  it('renders error state when there is an error', async () => {
    (useDashboardData as jest.Mock).mockReturnValue({
      dashboardData: null,
      isLoading: false,
      error: new Error('Failed to load dashboard data'),
    });
    
    render(<DashboardPage />);
    
    await waitFor(() => {
      expect(screen.getByText(/Error loading dashboard data/i)).toBeInTheDocument();
    });
  });

  it('renders empty states when no data is available', async () => {
    (useDashboardData as jest.Mock).mockReturnValue({
      dashboardData: {
        userInfo: {
          id: 'user-1',
          username: 'testuser',
          email: 'test@example.com',
        },
        tournamentSummary: {
          active: 0,
          pending: 0,
          completed: 0,
          cancelled: 0,
        },
        participation: {
          hosting: 0,
          joined: 0,
          invited: 0,
        },
        recentActivity: [],
        upcomingTournaments: [],
        unreadNotificationsCount: 0,
      },
      isLoading: false,
      error: null,
    });
    
    render(<DashboardPage />);
    
    await waitFor(() => {
      expect(screen.getByText('No upcoming tournaments')).toBeInTheDocument();
      expect(screen.getByText('No recent activity')).toBeInTheDocument();
    });
  });

  it('renders quick action buttons', async () => {
    (useDashboardData as jest.Mock).mockReturnValue({
      dashboardData: {
        userInfo: {
          id: 'user-1',
          username: 'testuser',
          email: 'test@example.com',
        },
        tournamentSummary: {
          active: 0,
          pending: 0,
          completed: 0,
          cancelled: 0,
        },
        participation: {
          hosting: 0,
          joined: 0,
          invited: 0,
        },
        recentActivity: [],
        upcomingTournaments: [],
        unreadNotificationsCount: 0,
      },
      isLoading: false,
      error: null,
    });
    
    render(<DashboardPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Quick Actions')).toBeInTheDocument();
      expect(screen.getByText('Create Tournament')).toBeInTheDocument();
      expect(screen.getByText('Browse Tournaments')).toBeInTheDocument();
    });
  });
}); 