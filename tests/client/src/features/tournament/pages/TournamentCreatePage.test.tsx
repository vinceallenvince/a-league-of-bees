import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import TournamentCreatePage from '@/features/tournament/pages/TournamentCreatePage';
import { tournamentApi } from '@/features/tournament/api/tournamentApi';
import { TournamentFormData } from '@/features/tournament/types';

// Mock the API and wouter hooks
jest.mock('@/features/tournament/api/tournamentApi');
jest.mock('wouter', () => {
  const setLocation = jest.fn();
  return {
    useLocation: () => ['/', setLocation]
  };
});

// Mock the tournament form component for easier testing
jest.mock('@/features/tournament/components/tournament/TournamentForm', () => ({
  TournamentForm: ({ onSubmit, initialData, isLoading }: {
    onSubmit: (data: TournamentFormData) => void;
    initialData: TournamentFormData;
    isLoading: boolean;
  }) => (
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
  )
}));

describe('TournamentCreatePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the create tournament page with form', () => {
    render(<TournamentCreatePage />);
    
    expect(screen.getByText('Create Tournament')).toBeInTheDocument();
    expect(screen.getByTestId('tournament-form')).toBeInTheDocument();
    expect(screen.getByText('Form Component (mocked)')).toBeInTheDocument();
  });

  it('handles form submission success', async () => {
    // Get the setLocation mock function directly from the wouter mock module
    const setLocationMock = require('wouter').useLocation()[1];
    
    // Mock successful API response
    const createdTournament = { id: 'new-tournament-id', name: 'New Tournament' };
    (tournamentApi.createTournament as jest.Mock).mockResolvedValue(createdTournament);
    
    // Create a new mock of TournamentForm with the specific implementation we need
    const TournamentFormMock = ({ onSubmit }: any) => (
      <div data-testid="tournament-form">
        <div>Form Component (mocked)</div>
        <button 
          type="button"
          data-testid="mock-submit-button"
          onClick={() => onSubmit({
            name: 'New Tournament',
            description: 'Test description',
            durationDays: 7,
            startDate: new Date('2023-02-01'),
            requiresVerification: false,
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
      render(<TournamentCreatePage />);
      
      // Wait for the form to be rendered
      await waitFor(() => {
        expect(screen.getByTestId('tournament-form')).toBeInTheDocument();
      });
      
      // Simulate form submission
      fireEvent.click(screen.getByTestId('mock-submit-button'));
      
      // Wait for the async operation to complete
      await waitFor(() => {
        expect(tournamentApi.createTournament).toHaveBeenCalled();
        expect(setLocationMock).toHaveBeenCalledWith('/tournaments/new-tournament-id');
      });
    } finally {
      // Restore the original mock to not affect other tests
      TournamentFormModule.TournamentForm = originalTournamentForm;
    }
  });

  it('handles form submission errors', async () => {
    // Get the setLocation mock function directly from the wouter mock module
    const setLocationMock = require('wouter').useLocation()[1];
    
    // Mock API error
    const errorMessage = 'Failed to create tournament';
    (tournamentApi.createTournament as jest.Mock).mockRejectedValue(new Error(errorMessage));
    
    // Create a new mock of TournamentForm with the specific implementation we need
    const TournamentFormMock = ({ onSubmit }: any) => (
      <div data-testid="tournament-form">
        <div>Form Component (mocked)</div>
        <button 
          type="button"
          data-testid="mock-submit-button"
          onClick={() => onSubmit({
            name: 'New Tournament',
            description: 'Test description',
            durationDays: 7,
            startDate: new Date('2023-02-01'),
            requiresVerification: false,
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
      render(<TournamentCreatePage />);
      
      // Wait for the form to be rendered
      await waitFor(() => {
        expect(screen.getByTestId('tournament-form')).toBeInTheDocument();
      });
      
      // Simulate form submission
      fireEvent.click(screen.getByTestId('mock-submit-button'));
      
      // Wait for the error to be displayed
      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    } finally {
      // Restore the original mock to not affect other tests
      TournamentFormModule.TournamentForm = originalTournamentForm;
    }
  });

  it('disables form during submission', async () => {
    // Get the setLocation mock function directly from the wouter mock module
    const setLocationMock = require('wouter').useLocation()[1];
    
    // Mock a slow API response
    (tournamentApi.createTournament as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ id: 'new-id' }), 100))
    );
    
    // Create a TournamentForm mock that reflects loading state
    const TournamentFormMock = ({ onSubmit, isLoading }: any) => (
      <div data-testid="tournament-form">
        <div>Form Component (mocked)</div>
        <button 
          type="button"
          data-testid="mock-submit-button"
          disabled={isLoading}
          onClick={() => onSubmit({
            name: 'New Tournament',
            description: 'Test description',
            durationDays: 7,
            startDate: new Date('2023-02-01'),
            requiresVerification: false,
            timezone: 'UTC'
          })}
        >
          {isLoading ? 'Submitting...' : 'Submit Form'}
        </button>
      </div>
    );
    
    // Replace the original mock with our specific implementation
    const TournamentFormModule = require('@/features/tournament/components/tournament/TournamentForm');
    const originalTournamentForm = TournamentFormModule.TournamentForm;
    TournamentFormModule.TournamentForm = TournamentFormMock;
    
    try {
      render(<TournamentCreatePage />);
      
      // Wait for the form to be rendered
      await waitFor(() => {
        expect(screen.getByTestId('tournament-form')).toBeInTheDocument();
      });
      
      // Simulate form submission
      fireEvent.click(screen.getByTestId('mock-submit-button'));
      
      // The button should be disabled immediately after submission
      expect(screen.getByTestId('mock-submit-button')).toBeDisabled();
      
      // Wait for the submission to complete
      await waitFor(() => {
        expect(tournamentApi.createTournament).toHaveBeenCalled();
      });
    } finally {
      // Restore the original mock to not affect other tests
      TournamentFormModule.TournamentForm = originalTournamentForm;
    }
  });
}); 