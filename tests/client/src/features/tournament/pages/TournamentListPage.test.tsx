import { render, screen, waitFor } from '@testing-library/react';
import TournamentListPage from '@/features/tournament/pages/TournamentListPage';
import { useTournaments } from '@/features/tournament/hooks/useTournaments';

// Mock the tournament hook
jest.mock('@/features/tournament/hooks/useTournaments');

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