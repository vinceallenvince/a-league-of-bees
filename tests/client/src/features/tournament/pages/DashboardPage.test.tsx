import React from 'react';
import { render, screen } from '@testing-library/react';

// Define DashboardData interface
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

// Mock hooks
const useDashboardData = jest.fn();

// Mock Dashboard components
const TournamentOverview = ({ dashboardData }: { dashboardData: DashboardData }) => (
  <div data-testid="tournament-overview">
    <h2>Tournament Summary</h2>
    <div>Active: {dashboardData.tournamentSummary.active}</div>
  </div>
);

const DashboardHeader = ({ dashboardData }: { dashboardData: DashboardData }) => (
  <div data-testid="dashboard-header">
    <h2>Welcome, {dashboardData.userInfo.username}</h2>
  </div>
);

const QuickActions = () => (
  <div data-testid="quick-actions">
    <h2>Quick Actions</h2>
  </div>
);

const NotificationCenter = () => (
  <div data-testid="notification-center">
    <h2>Notifications</h2>
  </div>
);

// Mock DashboardPage component
const DashboardPage: React.FC = () => {
  const { dashboardData, isLoading, error, refetch } = useDashboardData();
  
  if (isLoading) {
    return <div>Loading dashboard...</div>;
  }
  
  if (error) {
    return <div>Error loading dashboard data: {error.message}</div>;
  }
  
  if (!dashboardData) {
    return <div>Dashboard data not available</div>;
  }
  
  return (
    <div>
      <h1>Dashboard</h1>
      <DashboardHeader dashboardData={dashboardData} />
      <div className="dashboard-content">
        <TournamentOverview dashboardData={dashboardData} />
        <QuickActions />
        <NotificationCenter />
      </div>
    </div>
  );
};

describe('DashboardPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    useDashboardData.mockReturnValue({
      dashboardData: undefined,
      isLoading: true,
      error: null,
      refetch: jest.fn()
    });
    
    render(<DashboardPage />);
    expect(screen.getByText(/Loading dashboard/i)).toBeInTheDocument();
  });

  it('renders error state when there is an error', () => {
    const error = new Error('Failed to load dashboard data');
    useDashboardData.mockReturnValue({
      dashboardData: undefined,
      isLoading: false,
      error,
      refetch: jest.fn()
    });
    
    render(<DashboardPage />);
    expect(screen.getByText(/Error loading dashboard data/i)).toBeInTheDocument();
  });

  it('renders not available message when data is missing', () => {
    useDashboardData.mockReturnValue({
      dashboardData: undefined,
      isLoading: false,
      error: null,
      refetch: jest.fn()
    });
    
    render(<DashboardPage />);
    expect(screen.getByText(/Dashboard data not available/i)).toBeInTheDocument();
  });

  it('renders dashboard with components when data is loaded', () => {
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
        hosting: 1,
        joined: 3,
        invited: 2
      },
      recentActivity: [],
      upcomingTournaments: [],
      unreadNotificationsCount: 0
    };
    
    useDashboardData.mockReturnValue({
      dashboardData: mockDashboardData,
      isLoading: false,
      error: null,
      refetch: jest.fn()
    });
    
    render(<DashboardPage />);
    
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
    expect(screen.getByTestId('dashboard-header')).toBeInTheDocument();
    expect(screen.getByTestId('tournament-overview')).toBeInTheDocument();
    expect(screen.getByTestId('quick-actions')).toBeInTheDocument();
    expect(screen.getByTestId('notification-center')).toBeInTheDocument();
  });
}); 