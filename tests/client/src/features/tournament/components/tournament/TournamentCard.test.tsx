import { render, screen } from '@testing-library/react';
import { TournamentCard } from '@/features/tournament/components/tournament/TournamentCard';
import { Tournament } from '@/features/tournament/types';

describe('TournamentCard', () => {
  const mockTournament: Tournament = {
    id: '1',
    name: 'Test Tournament',
    description: 'This is a test tournament',
    durationDays: 7,
    startDate: '2023-01-01T00:00:00.000Z',
    status: 'pending',
    requiresVerification: true,
    timezone: 'UTC',
    creatorId: 'user-1',
    creatorUsername: 'testuser',
    participantCount: 5
  };

  it('renders tournament information correctly', () => {
    render(<TournamentCard tournament={mockTournament} />);
    
    expect(screen.getByText('Test Tournament')).toBeInTheDocument();
    expect(screen.getByText(/This is a test tournament/)).toBeInTheDocument();
    
    // Check duration elements separately since they're in different elements
    expect(screen.getByText('Duration:')).toBeInTheDocument();
    expect(screen.getByText('7 days')).toBeInTheDocument();
    
    // Check creator elements
    expect(screen.getByText('Created by:')).toBeInTheDocument();
    expect(screen.getByText('testuser')).toBeInTheDocument();
    
    // Check participants
    expect(screen.getByText('Participants:')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('displays pending status correctly', () => {
    render(<TournamentCard tournament={mockTournament} />);
    expect(screen.getByText(/Pending/)).toBeInTheDocument();
  });

  it('displays in progress status correctly', () => {
    const inProgressTournament = { ...mockTournament, status: 'in_progress' as const };
    render(<TournamentCard tournament={inProgressTournament} />);
    expect(screen.getByText(/In Progress/)).toBeInTheDocument();
  });

  it('displays completed status correctly', () => {
    const completedTournament = { ...mockTournament, status: 'completed' as const };
    render(<TournamentCard tournament={completedTournament} />);
    expect(screen.getByText(/Completed/)).toBeInTheDocument();
  });

  it('displays cancelled status correctly', () => {
    const cancelledTournament = { ...mockTournament, status: 'cancelled' as const };
    render(<TournamentCard tournament={cancelledTournament} />);
    expect(screen.getByText(/Cancelled/)).toBeInTheDocument();
  });
}); 