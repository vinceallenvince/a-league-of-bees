import { render, screen } from '@testing-library/react';
import TournamentDetailPage from '@/features/tournament/pages/TournamentDetailPage';
import { useTournament } from '@/features/tournament/hooks/useTournaments';

// Mock the hooks
jest.mock('@/features/tournament/hooks/useTournaments');
jest.mock('wouter', () => ({
  useRoute: () => [true, { id: 'test-id' }]
}));

describe('TournamentDetailPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    (useTournament as jest.Mock).mockReturnValue({
      tournament: null,
      isLoading: true,
      error: null
    });
    
    render(<TournamentDetailPage />);
    
    expect(screen.getByText(/Loading tournament details/i)).toBeInTheDocument();
  });

  it('renders tournament details when data is loaded', () => {
    const mockTournament = {
      id: 'test-id',
      name: 'Test Tournament',
      description: 'Test description',
      durationDays: 7,
      startDate: '2023-01-01T00:00:00.000Z',
      status: 'in_progress',
      requiresVerification: true,
      creatorId: 'user-1',
      creatorUsername: 'user1',
      participantCount: 5
    };
    
    (useTournament as jest.Mock).mockReturnValue({
      tournament: mockTournament,
      isLoading: false,
      error: null
    });
    
    render(<TournamentDetailPage />);
    
    expect(screen.getByText('Test Tournament')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
    expect(screen.getByText('7 days')).toBeInTheDocument();
    expect(screen.getByText('In_progress')).toBeInTheDocument();
    expect(screen.getByText('user1')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('Yes')).toBeInTheDocument();
  });

  it('renders error state when there is an error', () => {
    (useTournament as jest.Mock).mockReturnValue({
      tournament: null,
      isLoading: false,
      error: new Error('Failed to load tournament')
    });
    
    render(<TournamentDetailPage />);
    
    expect(screen.getByText(/Error loading tournament/i)).toBeInTheDocument();
    expect(screen.getByText(/Failed to load tournament/i)).toBeInTheDocument();
  });

  it('renders not found state when tournament is not found', () => {
    (useTournament as jest.Mock).mockReturnValue({
      tournament: null,
      isLoading: false,
      error: null
    });
    
    render(<TournamentDetailPage />);
    
    expect(screen.getByText(/Tournament not found/i)).toBeInTheDocument();
  });
}); 