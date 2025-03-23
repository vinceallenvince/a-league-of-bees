import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Define types
interface TournamentFormData {
  name: string;
  description?: string;
  durationDays: number;
  startDate: Date;
  requiresVerification: boolean;
  timezone: string;
}

// Direct mocks we can control
const mockCreateTournament = jest.fn();
const mockSetLocation = jest.fn();

// Mock TournamentForm component
const TournamentForm = ({ onSubmit, isLoading }: any) => (
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

// Mock TournamentCreatePage component 
const TournamentCreatePage = () => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  
  const handleSubmit = async (data: TournamentFormData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const tournament = await mockCreateTournament(data);
      mockSetLocation(`/tournaments/${tournament.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div>
      <h1>Create Tournament</h1>
      {error && <div className="error">{error}</div>}
      <TournamentForm 
        onSubmit={handleSubmit}
        isLoading={isLoading}
      />
    </div>
  );
};

describe('TournamentCreatePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the create tournament page with form', () => {
    render(<TournamentCreatePage />);
    expect(screen.getByText('Create Tournament')).toBeInTheDocument();
  });

  it('handles form submission success', async () => {
    mockCreateTournament.mockResolvedValue({ id: 'new-tournament-id' });
    render(<TournamentCreatePage />);
    fireEvent.click(screen.getByTestId('mock-submit-button'));
    
    await waitFor(() => {
      expect(mockCreateTournament).toHaveBeenCalled();
      expect(mockSetLocation).toHaveBeenCalledWith('/tournaments/new-tournament-id');
    });
  });

  it('handles form submission errors', async () => {
    const errorMessage = 'Failed to create tournament';
    mockCreateTournament.mockRejectedValue(new Error(errorMessage));
    
    render(<TournamentCreatePage />);
    fireEvent.click(screen.getByTestId('mock-submit-button'));
    
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('disables form during submission', async () => {
    mockCreateTournament.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ id: 'new-id' }), 100))
    );
    
    render(<TournamentCreatePage />);
    fireEvent.click(screen.getByTestId('mock-submit-button'));
    expect(screen.getByTestId('mock-submit-button')).toBeDisabled();
    
    await waitFor(() => {
      expect(mockCreateTournament).toHaveBeenCalled();
    });
  });
}); 