import {
  Tournament,
  TournamentFormData,
  TournamentUpdateData,
  TournamentListResponse,
  LeaderboardEntry,
  ScoreFormData,
  ScoreEntry,
  Participant,
  ParticipantStatus,
  ParticipantListResponse
} from '../types';

// Base API fetch function
const apiFetch = async <T>(url: string, options: RequestInit = {}): Promise<T> => {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || 'API request failed');
  }

  return response.json();
};

/**
 * Tournament API client for interfacing with the tournament backend endpoints
 */
export const tournamentApi = {
  /**
   * Get tournaments with optional filtering and pagination
   */
  async getTournaments(params: {
    page?: number;
    pageSize?: number;
    status?: string;
    creatorId?: string;
  }): Promise<TournamentListResponse> {
    const queryParams = new URLSearchParams();
    
    // Add query parameters
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    if (params.status) queryParams.append('status', params.status);
    if (params.creatorId) queryParams.append('creatorId', params.creatorId);
    
    const queryString = queryParams.toString();
    const url = `/api/tournaments${queryString ? `?${queryString}` : ''}`;
    
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
  
  /**
   * Get a single tournament by ID
   */
  async getTournament(id: string): Promise<Tournament> {
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
  
  /**
   * Create a new tournament
   */
  async createTournament(data: TournamentFormData): Promise<Tournament> {
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
  
  /**
   * Update an existing tournament
   */
  async updateTournament(id: string, data: TournamentUpdateData): Promise<Tournament> {
    // Convert date to ISO string if provided
    const payload = {
      ...data,
      startDate: data.startDate ? data.startDate.toISOString() : undefined,
    };
    
    const response = await fetch(`/api/tournaments/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update tournament: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  },
  
  /**
   * Cancel a tournament
   */
  async cancelTournament(id: string): Promise<{ id: string; status: string }> {
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
  
  /**
   * Join a tournament
   */
  async joinTournament(id: string): Promise<{ success: boolean }> {
    const response = await fetch(`/api/tournaments/${id}/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to join tournament: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  },
  
  /**
   * Get participants for a tournament
   */
  async getParticipants(tournamentId: string, params: {
    page?: number;
    pageSize?: number;
    status?: string;
  } = {}): Promise<ParticipantListResponse> {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    if (params.status) queryParams.append('status', params.status);
    
    const queryString = queryParams.toString();
    const url = `/api/tournaments/${tournamentId}/participants${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch participants: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  },
  
  /**
   * Invite users to a tournament
   */
  async inviteUsers(tournamentId: string, emails: string[]): Promise<{ success: boolean; count: number }> {
    const response = await fetch(`/api/tournaments/${tournamentId}/invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ emails }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to invite users: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  },
  
  /**
   * Remove a participant from a tournament
   */
  async removeParticipant(tournamentId: string, participantId: string): Promise<{ success: boolean }> {
    const response = await fetch(`/api/tournaments/${tournamentId}/participants/${participantId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to remove participant: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  },
  
  /**
   * Submit a score for a tournament
   */
  async submitScore(tournamentId: string, scoreData: ScoreFormData): Promise<{ success: boolean; scoreId: string }> {
    // Create form data for multipart submission (for file upload)
    const formData = new FormData();
    formData.append('day', scoreData.day.toString());
    formData.append('score', scoreData.score.toString());
    
    if (scoreData.screenshot) {
      formData.append('screenshot', scoreData.screenshot);
    }
    
    const response = await fetch(`/api/tournaments/${tournamentId}/scores`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`Failed to submit score: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  },
  
  /**
   * Get scores for a tournament
   */
  async getScores(tournamentId: string, params: {
    userId?: string;
    day?: number;
  } = {}): Promise<any> {
    const queryParams = new URLSearchParams();
    
    if (params.userId) queryParams.append('userId', params.userId);
    if (params.day !== undefined) queryParams.append('day', params.day.toString());
    
    const queryString = queryParams.toString();
    const url = `/api/tournaments/${tournamentId}/scores${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch scores: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  },
  
  /**
   * Get leaderboard for a tournament
   */
  async getLeaderboard(tournamentId: string, day?: number): Promise<LeaderboardEntry[]> {
    const queryParams = day !== undefined ? `?day=${day}` : '';
    const response = await fetch(`/api/tournaments/${tournamentId}/leaderboard${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch leaderboard: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  },

  /**
   * Get dashboard data for the current user
   */
  async getDashboard(): Promise<any> {
    const response = await fetch('/api/dashboard', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch dashboard data: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }
}; 