import React from 'react';
import { screen } from '@testing-library/react';
import { render } from '../../test-utils';
import DashboardPage from '../DashboardPage';
import { DashboardData } from '../../types';

// Mock the useDashboardData hook
jest.mock('../../hooks/useDashboardData', () => ({
  useDashboardData: () => ({
    dashboardData: mockDashboardData,
    isLoading: false,
    error: null,
    refetch: jest.fn(),
    refreshDashboard: jest.fn()
  })
}));

// Mock the useNotifications hook (used by NotificationCenter)
jest.mock('../../hooks/useNotifications', () => ({
  useNotifications: () => ({
    notifications: [],
    unreadCount: 2,
    pagination: { page: 1, pageSize: 10, totalCount: 0, totalPages: 0 },
    isLoading: false,
    error: null,
    setPage: jest.fn(),
    setPageSize: jest.fn(),
    setTypeFilter: jest.fn(),
    setReadFilter: jest.fn(),
    refetch: jest.fn(),
    markAsRead: jest.fn(),
    isMarkingAsRead: false,
    markAsReadError: null,
    markAllAsRead: jest.fn(),
    isMarkingAllAsRead: false,
    markAllAsReadError: null
  })
}));

// Mock wouter's Link component
jest.mock('wouter', () => ({
  Link: ({ href, children }: { href: string, children: React.ReactNode }) => (
    <a href={href} data-testid="mock-link">{children}</a>
  )
}));

// Mock dashboard data
const mockDashboardData: DashboardData = {
  userInfo: {
    id: '1',
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
    joined: 2,
    invited: 3
  },
  recentActivity: [
    {
      id: '1',
      type: 'invitation',
      tournamentId: 't1',
      tournamentName: 'Summer Tournament',
      message: 'You have been invited to a tournament',
      timestamp: '2023-05-01T10:00:00Z',
      read: false
    }
  ],
  upcomingTournaments: [
    {
      id: 't1',
      name: 'Summer Tournament',
      startDate: '2023-06-01T00:00:00Z',
      creatorId: 'user1'
    }
  ],
  unreadNotificationsCount: 2
};

describe('DashboardPage', () => {
  test('renders the dashboard page with components', () => {
    render(<DashboardPage />);
    
    // Check that the page title is rendered
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    
    // Check that DashboardHeader is rendered
    expect(screen.getByText('testuser')).toBeInTheDocument();
    
    // Check that TournamentOverview is rendered
    expect(screen.getByText('Tournament Summary')).toBeInTheDocument();
    expect(screen.getByText('Upcoming Tournaments')).toBeInTheDocument();
    
    // Check that QuickActions is rendered
    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    expect(screen.getByText('Create Tournament')).toBeInTheDocument();
    
    // Check that NotificationCenter is rendered
    expect(screen.getByText('Notifications')).toBeInTheDocument();
  });
}); 