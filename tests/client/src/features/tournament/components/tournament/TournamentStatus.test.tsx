import React from 'react';
import { render, screen } from '@testing-library/react';
import { TournamentStatus } from '@/features/tournament/components/tournament/TournamentStatus';

describe('TournamentStatus', () => {
  it('renders pending status correctly', () => {
    render(<TournamentStatus status="pending" />);
    const statusElement = screen.getByText('Pending');
    expect(statusElement).toBeInTheDocument();
    expect(statusElement).toHaveClass('bg-amber-100');
    expect(statusElement).toHaveClass('text-amber-800');
  });

  it('renders in_progress status correctly', () => {
    render(<TournamentStatus status="in_progress" />);
    const statusElement = screen.getByText('In Progress');
    expect(statusElement).toBeInTheDocument();
    expect(statusElement).toHaveClass('bg-green-100');
    expect(statusElement).toHaveClass('text-green-800');
  });

  it('renders completed status correctly', () => {
    render(<TournamentStatus status="completed" />);
    const statusElement = screen.getByText('Completed');
    expect(statusElement).toBeInTheDocument();
    expect(statusElement).toHaveClass('bg-blue-100');
    expect(statusElement).toHaveClass('text-blue-800');
  });

  it('renders cancelled status correctly', () => {
    render(<TournamentStatus status="cancelled" />);
    const statusElement = screen.getByText('Cancelled');
    expect(statusElement).toBeInTheDocument();
    expect(statusElement).toHaveClass('bg-gray-100');
    expect(statusElement).toHaveClass('text-gray-800');
  });

  it('applies small size class when size is sm', () => {
    render(<TournamentStatus status="pending" size="sm" />);
    const statusElement = screen.getByText('Pending');
    expect(statusElement).toHaveClass('text-xs');
    expect(statusElement).toHaveClass('px-2');
    expect(statusElement).toHaveClass('py-0.5');
  });

  it('applies medium size class when size is md', () => {
    render(<TournamentStatus status="pending" size="md" />);
    const statusElement = screen.getByText('Pending');
    expect(statusElement).toHaveClass('text-sm');
    expect(statusElement).toHaveClass('px-2.5');
    expect(statusElement).toHaveClass('py-1');
  });

  it('applies additional class names when provided', () => {
    render(<TournamentStatus status="pending" className="custom-class" />);
    const statusElement = screen.getByText('Pending');
    expect(statusElement).toHaveClass('custom-class');
  });

  it('has correct ARIA label for accessibility', () => {
    render(<TournamentStatus status="pending" />);
    const statusElement = screen.getByText('Pending');
    expect(statusElement).toHaveAttribute('aria-label', 'Tournament status: Pending');
  });
}); 