import React from 'react';
import { render, screen } from '@testing-library/react';
import QuickActions from '../QuickActions';

// Mock wouter's Link component
jest.mock('wouter', () => ({
  Link: ({ href, children }: { href: string, children: React.ReactNode }) => (
    <a href={href} data-testid="mock-link">{children}</a>
  )
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