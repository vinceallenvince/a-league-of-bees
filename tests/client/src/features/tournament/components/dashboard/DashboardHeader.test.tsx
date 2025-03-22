import React from 'react';
import { screen } from '@testing-library/react';
import { render } from '../../../../../../test-utils';
import DashboardHeader from '@/features/tournament/components/dashboard/DashboardHeader';
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
  unreadNotificationsCount: 5
};

// Mock loading and error states
const mockLoading = false;
const mockError = null;

describe('DashboardHeader', () => {
  test('renders correctly with dashboard data', () => {
    render(
      <DashboardHeader 
        dashboardData={mockDashboardData as DashboardData} 
        isLoading={mockLoading} 
        error={mockError} 
      />
    );
    
    // Check that user information is displayed
    expect(screen.getByText('testuser')).toBeInTheDocument();
    
    // Check that tournament summary is displayed
    expect(screen.getByText('2')).toBeInTheDocument(); // Active tournaments
    expect(screen.getByText('1')).toBeInTheDocument(); // Pending tournaments
    expect(screen.getByText('3')).toBeInTheDocument(); // Completed tournaments
    
    // Check that notification badge is displayed
    expect(screen.getByText('5')).toBeInTheDocument();
  });
  
  test('renders loading state', () => {
    render(
      <DashboardHeader 
        dashboardData={undefined} 
        isLoading={true} 
        error={null} 
      />
    );
    
    expect(screen.getByTestId('dashboard-header-loading')).toBeInTheDocument();
  });
  
  test('renders error state', () => {
    const error = new Error('Failed to load dashboard data');
    render(
      <DashboardHeader 
        dashboardData={undefined} 
        isLoading={false} 
        error={error} 
      />
    );
    
    expect(screen.getByText(/Failed to load dashboard data/i)).toBeInTheDocument();
  });
}); 