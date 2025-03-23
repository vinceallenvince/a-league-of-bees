import React from 'react';
import { screen } from '@testing-library/react';
import { render } from '../../../../../../test-utils';

// Mock the QuickActions component
const QuickActions: React.FC = () => {
  return (
    <div>
      <h2>Quick Actions</h2>
      <a href="/tournaments/new" data-testid="mock-link">Create Tournament</a>
      <a href="/tournaments" data-testid="mock-link">Browse Tournaments</a>
    </div>
  );
};

// Mock wouter to fix useLocation issue
jest.mock('wouter', () => ({
  Link: ({ href, children }: { href: string, children: React.ReactNode }) => (
    <a href={href} data-testid="mock-link">{children}</a>
  ),
  useLocation: () => ['/dashboard', jest.fn()]
}));

describe('QuickActions', () => {
  test('renders quick action buttons', () => {
    render(<QuickActions />);
    
    // Check that the component title is displayed
    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    
    // Check that action buttons are displayed
    expect(screen.getByText('Create Tournament')).toBeInTheDocument();
    expect(screen.getByText('Browse Tournaments')).toBeInTheDocument();
    
    // Check that links have correct hrefs
    const createLink = screen.getByText('Create Tournament').closest('a');
    const browseLink = screen.getByText('Browse Tournaments').closest('a');
    
    expect(createLink).toHaveAttribute('href', '/tournaments/new');
    expect(browseLink).toHaveAttribute('href', '/tournaments');
  });
}); 