import React from 'react';
import { screen } from '@testing-library/react';
import { render } from '../../../../../../test-utils';
import TournamentOverview from '@/features/tournament/components/dashboard/TournamentOverview';
import { DashboardData } from '@/features/tournament/types';

// Mock wouter to fix useLocation issue
jest.mock('wouter', () => ({
  Link: ({ href, children }: { href: string, children: React.ReactNode }) => (
    <a href={href} data-testid="mock-link">{children}</a>
  ),
  useLocation: () => ['/dashboard', jest.fn()]
}));

// Mock the dashboard data
const mockDashboardData: Partial<DashboardData> = {
  upcomingTournaments: [
    {
      id: '1',
      name: 'Summer Tournament',
      startDate: '2023-06-01T00:00:00Z',
      creatorId: 'user1'
    },
    {
      id: '2',
      name: 'Winter Challenge',
      startDate: '2023-12-01T00:00:00Z',
      creatorId: 'user2'
    }
  ],
  tournamentSummary: {
    active: 2,
    pending: 1,
    completed: 3,
    cancelled: 0
  }
};

// Mock loading and error states
const mockLoading = false;
const mockError = null;

describe('TournamentOverview', () => {
  test('renders correctly with tournament data', () => {
    render(
      <TournamentOverview 
        dashboardData={mockDashboardData as DashboardData} 
        isLoading={mockLoading} 
        error={mockError} 
      />
    );
    
    // Check that section titles are displayed
    expect(screen.getByText('Tournament Summary')).toBeInTheDocument();
    expect(screen.getByText('Upcoming Tournaments')).toBeInTheDocument();
    
    // Check that tournament summary stats are displayed
    expect(screen.getByText('2')).toBeInTheDocument(); // Active tournaments
    expect(screen.getByText('1')).toBeInTheDocument(); // Pending tournaments
    expect(screen.getByText('3')).toBeInTheDocument(); // Completed tournaments
    
    // Check that upcoming tournaments are displayed
    expect(screen.getByText('Summer Tournament')).toBeInTheDocument();
    expect(screen.getByText('Winter Challenge')).toBeInTheDocument();
    
    // Check that the "View all" link is present
    expect(screen.getByText('View all')).toBeInTheDocument();
  });
  
  test('renders empty state when no upcoming tournaments', () => {
    const emptyData = {
      ...mockDashboardData,
      upcomingTournaments: []
    };
    
    render(
      <TournamentOverview 
        dashboardData={emptyData as DashboardData} 
        isLoading={mockLoading} 
        error={mockError} 
      />
    );
    
    expect(screen.getByText('No upcoming tournaments')).toBeInTheDocument();
  });
  
  test('renders loading state', () => {
    render(
      <TournamentOverview 
        dashboardData={undefined} 
        isLoading={true} 
        error={null} 
      />
    );
    
    expect(screen.getByTestId('tournament-overview-loading')).toBeInTheDocument();
  });
  
  test('renders error state', () => {
    const error = new Error('Failed to load tournament data');
    render(
      <TournamentOverview 
        dashboardData={undefined} 
        isLoading={false} 
        error={error} 
      />
    );
    
    expect(screen.getByText(/Failed to load tournament data/i)).toBeInTheDocument();
  });
}); 