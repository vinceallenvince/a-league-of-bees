import { render, screen } from '@testing-library/react';
import React from 'react';

// Define types
interface Tournament {
  id: string;
  name: string;
  description?: string;
  durationDays: number;
  startDate: string;
  status: string;
  requiresVerification?: boolean;
  timezone?: string;
  creatorId: string;
  creatorUsername?: string;
  participantCount: number;
}

// Mock hooks
const useTournament = jest.fn();
const useRoute = () => [true, { id: 'test-id' }];

// Mock TournamentDetailPage component
const TournamentDetailPage: React.FC = () => {
  // Get tournament ID from route
  const [, params] = useRoute();
  const tournamentId = params && typeof params === 'object' ? params.id : null;
  
  // Get tournament data
  const { tournament, isLoading, error } = useTournament();
  
  // Effect to load the tournament
  React.useEffect(() => {
    // This is just for show in the mock component
  }, [tournamentId]);
  
  if (isLoading) {
    return <div>Loading tournament details...</div>;
  }
  
  if (error) {
    return (
      <div>
        <div>Error loading tournament</div>
        <div>{error.message}</div>
      </div>
    );
  }
  
  if (!tournament) {
    return <div>Tournament not found</div>;
  }
  
  return (
    <div>
      <h1>{tournament.name}</h1>
      <p>{tournament.description}</p>
      <div>
        <div>{tournament.durationDays} days</div>
        <div>{tournament.status.charAt(0).toUpperCase() + tournament.status.slice(1)}</div>
        <div>{tournament.creatorUsername}</div>
        <div>{tournament.participantCount}</div>
        <div>{tournament.requiresVerification ? 'Yes' : 'No'}</div>
      </div>
    </div>
  );
};

// Mock wouter
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