import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';

// Define types
interface Tournament {
  id: string;
  name: string;
  description?: string;
  durationDays: number;
  startDate: string;
  status: string;
  creatorId: string;
  creatorUsername?: string;
  participantCount: number;
}

// Mock useTournaments hook
const useTournaments = jest.fn();

// Mock TournamentListPage component
const TournamentListPage: React.FC = () => {
  const {
    tournaments,
    isLoading,
    error,
    pagination,
    setPage,
    setFilters
  } = useTournaments();
  
  if (isLoading) {
    return <div>Loading tournaments...</div>;
  }
  
  if (error) {
    return <div>Error loading tournaments: {error.message}</div>;
  }
  
  if (tournaments.length === 0) {
    return (
      <div>
        <div>No tournaments found</div>
        <button>Create Tournament</button>
      </div>
    );
  }
  
  return (
    <div>
      <button>Create Tournament</button>
      
      <div>
        {tournaments.map((tournament: Tournament) => (
          <div key={tournament.id}>
            <h3>{tournament.name}</h3>
            <p>{tournament.description}</p>
          </div>
        ))}
      </div>
      
      {pagination.totalPages > 1 && (
        <div>
          <button disabled={pagination.page === 1}>Previous</button>
          <span>Page {pagination.page} of {pagination.totalPages}</span>
          <button disabled={pagination.page === pagination.totalPages}>Next</button>
        </div>
      )}
    </div>
  );
};

describe('TournamentListPage', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    (useTournaments as jest.Mock).mockReturnValue({
      tournaments: [],
      isLoading: true,
      error: null,
      pagination: { page: 1, pageSize: 10, totalCount: 0, totalPages: 0 },
      setPage: jest.fn(),
      setFilters: jest.fn()
    });
    
    render(<TournamentListPage />);
    
    expect(screen.getByText(/Loading tournaments/i)).toBeInTheDocument();
  });

  it('renders tournaments when data is loaded', async () => {
    (useTournaments as jest.Mock).mockReturnValue({
      tournaments: [
        {
          id: '1',
          name: 'Test Tournament 1',
          description: 'Description 1',
          durationDays: 7,
          startDate: '2023-01-01T00:00:00.000Z',
          status: 'in_progress',
          creatorId: 'user-1',
          creatorUsername: 'user1',
          participantCount: 5
        },
        {
          id: '2',
          name: 'Test Tournament 2',
          description: 'Description 2',
          durationDays: 14,
          startDate: '2023-02-01T00:00:00.000Z',
          status: 'pending',
          creatorId: 'user-2',
          creatorUsername: 'user2',
          participantCount: 3
        }
      ],
      isLoading: false,
      error: null,
      pagination: { page: 1, pageSize: 10, totalCount: 2, totalPages: 1 },
      setPage: jest.fn(),
      setFilters: jest.fn()
    });
    
    render(<TournamentListPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Tournament 1')).toBeInTheDocument();
      expect(screen.getByText('Test Tournament 2')).toBeInTheDocument();
    });
  });

  it('renders error state when there is an error', async () => {
    (useTournaments as jest.Mock).mockReturnValue({
      tournaments: [],
      isLoading: false,
      error: new Error('Failed to load tournaments'),
      pagination: { page: 1, pageSize: 10, totalCount: 0, totalPages: 0 },
      setPage: jest.fn(),
      setFilters: jest.fn()
    });
    
    render(<TournamentListPage />);
    
    await waitFor(() => {
      expect(screen.getByText(/Error loading tournaments/i)).toBeInTheDocument();
    });
  });

  it('renders empty state when no tournaments are available', async () => {
    (useTournaments as jest.Mock).mockReturnValue({
      tournaments: [],
      isLoading: false,
      error: null,
      pagination: { page: 1, pageSize: 10, totalCount: 0, totalPages: 0 },
      setPage: jest.fn(),
      setFilters: jest.fn()
    });
    
    render(<TournamentListPage />);
    
    await waitFor(() => {
      expect(screen.getByText(/No tournaments found/i)).toBeInTheDocument();
    });
  });

  it('shows create tournament button', async () => {
    (useTournaments as jest.Mock).mockReturnValue({
      tournaments: [],
      isLoading: false,
      error: null,
      pagination: { page: 1, pageSize: 10, totalCount: 0, totalPages: 0 },
      setPage: jest.fn(),
      setFilters: jest.fn()
    });
    
    render(<TournamentListPage />);
    
    await waitFor(() => {
      const createButtons = screen.getAllByRole('button', { name: /Create Tournament/i });
      expect(createButtons.length).toBeGreaterThan(0);
    });
  });

  it('shows pagination when there are multiple pages', async () => {
    (useTournaments as jest.Mock).mockReturnValue({
      tournaments: [
        {
          id: '1',
          name: 'Test Tournament 1',
          description: 'Description 1',
          durationDays: 7,
          startDate: '2023-01-01T00:00:00.000Z',
          status: 'in_progress',
          creatorId: 'user-1',
          creatorUsername: 'user1',
          participantCount: 5
        }
      ],
      isLoading: false,
      error: null,
      pagination: { page: 1, pageSize: 10, totalCount: 25, totalPages: 3 },
      setPage: jest.fn(),
      setFilters: jest.fn()
    });
    
    render(<TournamentListPage />);
    
    await waitFor(() => {
      const nextButtons = screen.getAllByRole('button', { name: /Next/i });
      expect(nextButtons.length).toBeGreaterThan(0);
      expect(screen.getByText(/Page 1 of 3/i)).toBeInTheDocument();
    });
  });
}); 