import { Tournament, TournamentFormData, TournamentUpdateData, 
  TournamentListResponse, DashboardData, Participant, 
  ParticipantListResponse, Notification, NotificationListResponse,
  LeaderboardEntry } from '../types';

// Mock tournament data
const mockTournament: Tournament = {
  id: '1',
  name: 'Test Tournament',
  description: 'This is a test tournament',
  durationDays: 7,
  startDate: '2023-01-01T00:00:00.000Z',
  status: 'pending',
  requiresVerification: true,
  timezone: 'UTC',
  creatorId: 'user-1',
  creatorUsername: 'testuser',
  participantCount: 5
};

// Mock pagination data
const mockPagination = {
  page: 1,
  pageSize: 10,
  totalCount: 5,
  totalPages: 1
};

// Mock API functions
export const tournamentApi = {
  // Tournament CRUD operations
  getTournaments: jest.fn().mockResolvedValue({
    tournaments: [mockTournament, {...mockTournament, id: '2', name: 'Second Tournament'}],
    pagination: mockPagination
  } as TournamentListResponse),

  getTournament: jest.fn().mockResolvedValue(mockTournament),

  createTournament: jest.fn().mockImplementation((data: TournamentFormData) => {
    return Promise.resolve({
      ...mockTournament,
      name: data.name,
      description: data.description || '',
      durationDays: data.durationDays,
      startDate: data.startDate.toISOString(),
      requiresVerification: data.requiresVerification,
      timezone: data.timezone
    });
  }),

  updateTournament: jest.fn().mockImplementation((id: string, data: TournamentUpdateData) => {
    return Promise.resolve({
      ...mockTournament,
      id,
      ...(data.name && { name: data.name }),
      ...(data.description && { description: data.description }),
      ...(data.durationDays && { durationDays: data.durationDays }),
      ...(data.startDate && { startDate: data.startDate.toISOString() }),
      ...(data.requiresVerification !== undefined && { requiresVerification: data.requiresVerification }),
      ...(data.timezone && { timezone: data.timezone })
    });
  }),

  deleteTournament: jest.fn().mockResolvedValue({ success: true }),

  // Dashboard data
  getDashboardData: jest.fn().mockResolvedValue({
    userInfo: {
      id: 'user-1',
      username: 'testuser',
      email: 'test@example.com'
    },
    tournamentSummary: {
      active: 2,
      pending: 1,
      completed: 3,
      cancelled: 0
    },
    participation: {
      hosting: 3,
      joined: 2,
      invited: 1
    },
    recentActivity: [
      {
        id: 'activity-1',
        type: 'tournament_start',
        tournamentId: '1',
        tournamentName: 'Test Tournament',
        message: 'Tournament has started',
        timestamp: '2023-01-01T00:00:00.000Z',
        read: false
      }
    ],
    upcomingTournaments: [
      {
        id: '2',
        name: 'Upcoming Tournament',
        startDate: '2023-02-01T00:00:00.000Z',
        creatorId: 'user-2'
      }
    ],
    unreadNotificationsCount: 1
  } as DashboardData),

  // Participant operations
  getTournamentParticipants: jest.fn().mockResolvedValue({
    participants: [
      {
        id: 'participant-1',
        userId: 'user-2',
        tournamentId: '1',
        username: 'participant1',
        joinedAt: '2023-01-01T00:00:00.000Z',
        status: 'joined'
      }
    ],
    pagination: mockPagination
  } as ParticipantListResponse),

  inviteParticipant: jest.fn().mockResolvedValue({ success: true }),

  // Notification operations
  getNotifications: jest.fn().mockResolvedValue({
    notifications: [
      {
        id: 'notification-1',
        userId: 'user-1',
        tournamentId: '1',
        type: 'tournament_start',
        message: 'Tournament has started',
        read: false,
        createdAt: '2023-01-01T00:00:00.000Z'
      }
    ],
    pagination: mockPagination,
    unreadCount: 1
  } as NotificationListResponse),

  markNotificationAsRead: jest.fn().mockResolvedValue({ success: true }),

  // Leaderboard operations
  getTournamentLeaderboard: jest.fn().mockResolvedValue([
    {
      userId: 'user-2',
      username: 'participant1',
      totalScore: 100,
      scoresSubmitted: 3,
      rank: 1
    },
    {
      userId: 'user-3',
      username: 'participant2',
      totalScore: 75,
      scoresSubmitted: 3,
      rank: 2
    }
  ] as LeaderboardEntry[]),

  // Score operations
  submitScore: jest.fn().mockResolvedValue({ success: true }),
  getScoreHistory: jest.fn().mockResolvedValue([
    {
      id: 'score-1',
      userId: 'user-1',
      tournamentId: '1',
      day: 1,
      score: 100,
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z'
    }
  ])
}; 