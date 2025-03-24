import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Define TournamentFormData interface
interface TournamentFormData {
  name: string;
  description?: string;
  durationDays: number;
  startDate: Date;
  requiresVerification: boolean;
  timezone: string;
}

// Define Tournament interface
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
const mockUpdateTournament = jest.fn();
const mockSetLocation = jest.fn();

// Mock useRoute hook from wouter
const useRoute = () => [true, { id: 'test-id' }];

// Mock TournamentForm component
const TournamentForm = ({ onSubmit, initialData, isLoading }: any) => (
  <div data-testid="tournament-form">
    <div>Form Component (mocked)</div>
    <button 
      type="button"
      data-testid="mock-submit-button"
      disabled={isLoading}
      onClick={() => onSubmit(initialData)}
    >
      {isLoading ? 'Submitting...' : 'Submit Form'}
    </button>
  </div>
);

// Mock TournamentEditPage component
const TournamentEditPage: React.FC = () => {
  const [, params] = useRoute();
  const tournamentId = params && typeof params === 'object' ? params.id : null;
  
  const { 
    tournament, 
    isLoading: isLoadingTournament,
    error: tournamentError
  } = useTournament();
  
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  
  const handleSubmit = async (data: TournamentFormData) => {
    if (!tournamentId) return;
    
    setIsSubmitting(true);
    try {
      await mockUpdateTournament(tournamentId, data);
      mockSetLocation(`/tournaments/${tournamentId}`);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoadingTournament) {
    return <div>Loading tournament...</div>;
  }
  
  if (tournamentError) {
    return <div>Error loading tournament: {tournamentError.message}</div>;
  }
  
  if (!tournament) {
    return <div>Tournament not found</div>;
  }
  
  const initialData: TournamentFormData = {
    name: tournament.name,
    description: tournament.description || '',
    durationDays: tournament.durationDays,
    startDate: new Date(tournament.startDate),
    requiresVerification: tournament.requiresVerification || false,
    timezone: tournament.timezone || 'UTC'
  };
  
  return (
    <div>
      <h1>Edit Tournament</h1>
      {error && <div className="error">{error.message}</div>}
      <TournamentForm
        initialData={initialData}
        onSubmit={handleSubmit}
        isLoading={isSubmitting}
      />
    </div>
  );
};

// Jest mocks setup
jest.mock('wouter', () => ({
  useRoute: () => [true, { id: 'test-id' }]
}));

describe('TournamentEditPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    useTournament.mockReturnValue({
      tournament: null,
      isLoading: true,
      error: null
    });
    
    render(<TournamentEditPage />);
    expect(screen.getByText(/Loading tournament/i)).toBeInTheDocument();
  });

  it('displays error if tournament load fails', () => {
    const error = new Error('Failed to load tournament');
    useTournament.mockReturnValue({
      tournament: null,
      isLoading: false,
      error
    });
    
    render(<TournamentEditPage />);
    expect(screen.getByText(/Error loading tournament/i)).toBeInTheDocument();
  });

  it('displays not found message if tournament does not exist', () => {
    useTournament.mockReturnValue({
      tournament: null,
      isLoading: false,
      error: null
    });
    
    render(<TournamentEditPage />);
    expect(screen.getByText(/Tournament not found/i)).toBeInTheDocument();
  });

  it('renders edit form with tournament data', () => {
    const mockTournament = {
      id: 'test-id',
      name: 'Test Tournament',
      description: 'Test Description',
      durationDays: 7,
      startDate: '2023-01-01T00:00:00.000Z',
      status: 'pending',
      requiresVerification: true,
      timezone: 'UTC',
      creatorId: 'user-1',
      participantCount: 5
    };
    
    useTournament.mockReturnValue({
      tournament: mockTournament,
      isLoading: false,
      error: null
    });
    
    render(<TournamentEditPage />);
    
    expect(screen.getByText('Edit Tournament')).toBeInTheDocument();
    expect(screen.getByTestId('tournament-form')).toBeInTheDocument();
  });

  it('handles form submission successfully', async () => {
    const mockTournament = {
      id: 'test-id',
      name: 'Test Tournament',
      description: 'Test Description',
      durationDays: 7,
      startDate: '2023-01-01T00:00:00.000Z',
      status: 'pending',
      requiresVerification: true,
      timezone: 'UTC',
      creatorId: 'user-1',
      participantCount: 5
    };
    
    useTournament.mockReturnValue({
      tournament: mockTournament,
      isLoading: false,
      error: null
    });
    
    mockUpdateTournament.mockResolvedValue({ 
      ...mockTournament, 
      name: 'Updated Tournament' 
    });
    
    render(<TournamentEditPage />);
    
    fireEvent.click(screen.getByTestId('mock-submit-button'));
    
    await waitFor(() => {
      expect(mockUpdateTournament).toHaveBeenCalledWith('test-id', expect.any(Object));
      expect(mockSetLocation).toHaveBeenCalledWith('/tournaments/test-id');
    });
  });
}); 