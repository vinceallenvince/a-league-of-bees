import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TournamentEditPage from '@/features/tournament/pages/TournamentEditPage';
import { 
  useTournament, 
  useIsTournamentCreator, 
  useCanEditTournament 
} from '@/features/tournament/hooks/useTournaments';
import { tournamentApi } from '@/features/tournament/api/tournamentApi';
import { TournamentFormData } from '@/features/tournament/types';

// Mock the hooks and API
jest.mock('@/features/tournament/hooks/useTournaments');
jest.mock('@/features/tournament/api/tournamentApi');
jest.mock('wouter', () => {
  const setLocation = jest.fn();
  return {
    useRoute: () => [true, { id: 'test-id' }],
    useLocation: () => ['/', setLocation]
  };
});

// Mock the tournament form component
jest.mock('@/features/tournament/components/tournament/TournamentForm', () => ({
  TournamentForm: ({ onSubmit, initialData, isLoading, isEditing }: {
    onSubmit: (data: TournamentFormData) => void;
    initialData: TournamentFormData;
    isLoading: boolean;
    isEditing?: boolean;
  }) => (
    <div data-testid="tournament-form">
      <div>Form Component (mocked) {isEditing ? '- Edit Mode' : ''}</div>
      <button 
        type="button"
        data-testid="mock-submit-button"
        disabled={isLoading}
        onClick={() => onSubmit(initialData)}
      >
        {isLoading ? 'Submitting...' : 'Submit Form'}
      </button>
    </div>
  )
}));

describe('TournamentEditPage', () => {
  const mockTournament = {
    id: 'test-id',
    name: 'Test Tournament',
    description: 'Test description',
    durationDays: 7,
    startDate: '2023-01-01T00:00:00.000Z',
    status: 'pending',
    requiresVerification: false,
    creatorId: '1', // Match the hardcoded user ID in the component
    creatorUsername: 'user1',
    participantCount: 0,
    timezone: 'UTC'
  };
  
  const mockRefetch = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mocks
    (useTournament as jest.Mock).mockReturnValue({
      tournament: mockTournament,
      isLoading: false,
      error: null,
      refetch: mockRefetch
    });
    
    (useIsTournamentCreator as jest.Mock).mockReturnValue(true);
    (useCanEditTournament as jest.Mock).mockReturnValue(true);
    
    (tournamentApi.updateTournament as jest.Mock).mockResolvedValue(mockTournament);
  });
  
  it('renders loading state initially', () => {
    (useTournament as jest.Mock).mockReturnValue({
      tournament: null,
      isLoading: true,
      error: null,
      refetch: mockRefetch
    });
    
    render(<TournamentEditPage />);
    
    expect(screen.getByText(/Loading tournament/i)).toBeInTheDocument();
  });
  
  it('renders form with tournament data when loaded', async () => {
    render(<TournamentEditPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Edit Tournament')).toBeInTheDocument();
      expect(screen.getByTestId('tournament-form')).toBeInTheDocument();
      expect(screen.getByText(/Form Component \(mocked\) - Edit Mode/)).toBeInTheDocument();
    });
  });
  
  it('renders error state when there is an error', () => {
    (useTournament as jest.Mock).mockReturnValue({
      tournament: null,
      isLoading: false,
      error: new Error('Failed to load tournament'),
      refetch: mockRefetch
    });
    
    render(<TournamentEditPage />);
    
    expect(screen.getByText(/Error loading tournament/i)).toBeInTheDocument();
    expect(screen.getByText(/Failed to load tournament/i)).toBeInTheDocument();
  });
  
  it('renders not found state when tournament is not found', () => {
    (useTournament as jest.Mock).mockReturnValue({
      tournament: null,
      isLoading: false,
      error: null,
      refetch: mockRefetch
    });
    
    render(<TournamentEditPage />);
    
    expect(screen.getByText(/Tournament not found/i)).toBeInTheDocument();
  });
  
  it('renders permission denied when user cannot edit tournament', () => {
    (useCanEditTournament as jest.Mock).mockReturnValue(false);
    
    render(<TournamentEditPage />);
    
    expect(screen.getByText(/You don't have permission to edit/i)).toBeInTheDocument();
  });
  
  it('handles form submission and updates tournament', async () => {
    // Get the setLocation mock function directly from the wouter mock module
    const setLocationMock = require('wouter').useLocation()[1];
    
    // Ensure updateTournament returns a promise that resolves
    (tournamentApi.updateTournament as jest.Mock).mockResolvedValue(mockTournament);
    
    // Create a new mock of TournamentForm with the specific implementation we need
    const TournamentFormMock = ({ onSubmit }: any) => (
      <div data-testid="tournament-form">
        <div>Form Component (mocked) - Edit Mode</div>
        <button 
          type="button"
          data-testid="mock-submit-button"
          onClick={() => onSubmit({
            name: 'Updated Tournament Name',
            description: 'Updated description',
            durationDays: 10, // Changed from 7
            startDate: new Date('2023-02-01'),
            requiresVerification: true, // Changed from false
            timezone: 'UTC'
          })}
        >
          Submit Form
        </button>
      </div>
    );
    
    // Replace the original mock with our specific implementation
    const TournamentFormModule = require('@/features/tournament/components/tournament/TournamentForm');
    const originalTournamentForm = TournamentFormModule.TournamentForm;
    TournamentFormModule.TournamentForm = TournamentFormMock;
    
    try {
      render(<TournamentEditPage />);
      
      // Wait for the form to be rendered
      await waitFor(() => {
        expect(screen.getByTestId('tournament-form')).toBeInTheDocument();
      });
      
      // Simulate form submission using fireEvent
      fireEvent.click(screen.getByTestId('mock-submit-button'));
      
      // Wait for the async operations to complete
      await waitFor(() => {
        expect(tournamentApi.updateTournament).toHaveBeenCalled();
      });
      
      expect(mockRefetch).toHaveBeenCalled();
      expect(setLocationMock).toHaveBeenCalledWith('/tournaments/test-id');
    } finally {
      // Restore the original mock to not affect other tests
      TournamentFormModule.TournamentForm = originalTournamentForm;
    }
  });
  
  it('handles submission errors', async () => {
    // Get the setLocation mock function directly from the wouter mock module
    const setLocationMock = require('wouter').useLocation()[1];
    
    const errorMessage = 'Failed to update tournament';
    (tournamentApi.updateTournament as jest.Mock).mockRejectedValue(new Error(errorMessage));
    
    // Create a new mock of TournamentForm with the specific implementation we need
    const TournamentFormMock = ({ onSubmit }: any) => (
      <div data-testid="tournament-form">
        <div>Form Component (mocked) - Edit Mode</div>
        <button 
          type="button"
          data-testid="mock-submit-button"
          onClick={() => onSubmit({
            name: 'Updated Tournament Name',
            description: 'Updated description',
            durationDays: 10,
            startDate: new Date('2023-02-01'),
            requiresVerification: true,
            timezone: 'UTC'
          })}
        >
          Submit Form
        </button>
      </div>
    );
    
    // Replace the original mock with our specific implementation
    const TournamentFormModule = require('@/features/tournament/components/tournament/TournamentForm');
    const originalTournamentForm = TournamentFormModule.TournamentForm;
    TournamentFormModule.TournamentForm = TournamentFormMock;
    
    try {
      render(<TournamentEditPage />);
      
      // Wait for the form to be rendered
      await waitFor(() => {
        expect(screen.getByTestId('tournament-form')).toBeInTheDocument();
      });
      
      // Simulate form submission
      fireEvent.click(screen.getByTestId('mock-submit-button'));
      
      // Wait for the error message to appear
      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    } finally {
      // Restore the original mock to not affect other tests
      TournamentFormModule.TournamentForm = originalTournamentForm;
    }
  });
}); 