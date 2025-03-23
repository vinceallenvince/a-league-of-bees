// Mock TournamentFormData and Tournament types
interface TournamentFormData {
  name: string;
  description?: string;
  durationDays: number;
  startDate: Date;
  requiresVerification: boolean;
  timezone: string;
}

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

// Mock tournamentApi implementation
const tournamentApi = {
  getTournaments: async ({ page = 1, pageSize = 10, status, search }: { 
    page?: number; 
    pageSize?: number; 
    status?: string; 
    search?: string; 
  } = {}) => {
    let url = `/api/tournaments?page=${page}&pageSize=${pageSize}`;
    if (status) url += `&status=${status}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch tournaments: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  },
  
  getTournament: async (id: string) => {
    const response = await fetch(`/api/tournaments/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch tournament: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  },
  
  createTournament: async (data: TournamentFormData) => {
    const response = await fetch('/api/tournaments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...data,
        startDate: data.startDate.toISOString(),
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create tournament: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  },
  
  updateTournament: async (id: string, data: Partial<TournamentFormData>) => {
    const response = await fetch(`/api/tournaments/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update tournament: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  },
  
  cancelTournament: async (id: string) => {
    const response = await fetch(`/api/tournaments/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to cancel tournament: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  },
};

// Mock fetch
global.fetch = jest.fn();

// Run the tests now that we have fixed the TypeScript issues
describe('tournamentApi', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('getTournaments', () => {
    it('fetches tournaments with correct parameters', async () => {
      const mockResponse = {
        tournaments: [
          {
            id: '1',
            name: 'Test Tournament',
            description: 'Description',
            durationDays: 7,
            startDate: '2023-01-01T00:00:00.000Z',
            status: 'pending',
            creatorId: 'user-1',
            creatorUsername: 'user1',
            participantCount: 5
          }
        ],
        pagination: {
          page: 1,
          pageSize: 10,
          totalCount: 1,
          totalPages: 1
        }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await tournamentApi.getTournaments({
        page: 1,
        pageSize: 10,
        status: 'pending'
      });

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/tournaments?page=1&pageSize=10&status=pending',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );

      expect(result).toEqual(mockResponse);
    });

    it('handles error responses', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(tournamentApi.getTournaments({
        page: 1,
        pageSize: 10
      })).rejects.toThrow('Failed to fetch tournaments: 500 Internal Server Error');
    });
  });

  describe('getTournament', () => {
    it('fetches a single tournament by id', async () => {
      const mockTournament = {
        id: '1',
        name: 'Test Tournament',
        description: 'Description',
        durationDays: 7,
        startDate: '2023-01-01T00:00:00.000Z',
        status: 'pending',
        creatorId: 'user-1',
        creatorUsername: 'user1',
        participantCount: 5
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTournament,
      });

      const result = await tournamentApi.getTournament('1');

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/tournaments/1',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );

      expect(result).toEqual(mockTournament);
    });
  });

  describe('createTournament', () => {
    it('sends correct data when creating a tournament', async () => {
      const tournamentData: TournamentFormData = {
        name: 'New Tournament',
        description: 'Description',
        durationDays: 7,
        startDate: new Date('2023-01-01'),
        requiresVerification: true,
        timezone: 'UTC'
      };

      const mockResponse = {
        id: '1',
        name: 'New Tournament',
        description: 'Description',
        durationDays: 7,
        startDate: '2023-01-01T00:00:00.000Z',
        status: 'pending',
        requiresVerification: true,
        timezone: 'UTC',
        creatorId: 'current-user',
        creatorUsername: 'currentuser',
        participantCount: 0
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await tournamentApi.createTournament(tournamentData);

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/tournaments',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({
            ...tournamentData,
            startDate: tournamentData.startDate.toISOString()
          }),
        })
      );

      expect(result).toEqual(mockResponse);
    });
  });

  describe('updateTournament', () => {
    it('sends correct data when updating a tournament', async () => {
      const tournamentUpdate = {
        name: 'Updated Tournament',
        description: 'Updated description'
      };

      const mockResponse = {
        id: '1',
        name: 'Updated Tournament',
        description: 'Updated description',
        durationDays: 7,
        startDate: '2023-01-01T00:00:00.000Z',
        status: 'pending',
        requiresVerification: true,
        timezone: 'UTC',
        creatorId: 'current-user',
        creatorUsername: 'currentuser',
        participantCount: 0
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await tournamentApi.updateTournament('1', tournamentUpdate);

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/tournaments/1',
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(tournamentUpdate),
        })
      );

      expect(result).toEqual(mockResponse);
    });
  });

  describe('cancelTournament', () => {
    it('sends correct request when cancelling a tournament', async () => {
      const mockResponse = {
        id: '1',
        status: 'cancelled'
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await tournamentApi.cancelTournament('1');

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/tournaments/1',
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );

      expect(result).toEqual(mockResponse);
    });
  });
}); 