/**
 * Comprehensive mocked types for tournament feature
 */

// Tournament status enum
export type TournamentStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

// Tournament participant status enum
export type ParticipantStatus = 'invited' | 'joined' | 'declined';

// Tournament entity
export interface Tournament {
  id: string;
  name: string;
  description?: string;
  durationDays: number;
  startDate: string; // ISO date string
  status: TournamentStatus;
  requiresVerification?: boolean;
  timezone?: string;
  creatorId: string;
  creatorUsername?: string;
  participantCount: number;
}

// Tournament creation form data
export interface TournamentFormData {
  name: string;
  description?: string;
  durationDays: number;
  startDate: Date;
  requiresVerification: boolean;
  timezone: string;
}

// Tournament update form data
export interface TournamentUpdateData {
  name?: string;
  description?: string;
  durationDays?: number;
  startDate?: Date;
  requiresVerification?: boolean;
  timezone?: string;
}

// Score submission form data
export interface ScoreFormData {
  day: number;
  score: number;
  screenshot?: File;
}

// Participant entity
export interface Participant {
  id: string;
  userId: string;
  tournamentId: string;
  username: string;
  joinedAt: string;
  status: ParticipantStatus;
}

// Leaderboard entry
export interface LeaderboardEntry {
  userId: string;
  username: string;
  totalScore: number;
  scoresSubmitted: number;
  rank?: number;
}

// Score history entry
export interface ScoreEntry {
  id: string;
  userId: string;
  tournamentId: string;
  day: number;
  score: number;
  screenshotUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// Notification type enum
export type NotificationType = 
  | 'invitation' 
  | 'reminder' 
  | 'tournament_start' 
  | 'tournament_end' 
  | 'tournament_cancelled';

// Notification entity
export interface Notification {
  id: string;
  userId: string;
  tournamentId: string;
  type: NotificationType;
  message: string;
  read: boolean;
  createdAt: string;
}

// Pagination data
export interface Pagination {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

// API response for tournament list
export interface TournamentListResponse {
  tournaments: Tournament[];
  pagination: Pagination;
}

// API response for participant list
export interface ParticipantListResponse {
  participants: Participant[];
  pagination: Pagination;
}

// API response for notification list
export interface NotificationListResponse {
  notifications: Notification[];
  pagination: Pagination;
  unreadCount: number;
}

// Dashboard data
export interface DashboardData {
  userInfo: {
    id: string;
    username: string;
    email: string;
  };
  tournamentSummary: {
    active: number;
    pending: number;
    completed: number;
    cancelled: number;
  };
  participation: {
    hosting: number;
    joined: number;
    invited: number;
  };
  recentActivity: {
    id: string;
    type: NotificationType;
    tournamentId: string;
    tournamentName: string;
    message: string;
    timestamp: string; // ISO date string
    read: boolean;
  }[];
  upcomingTournaments: {
    id: string;
    name: string;
    startDate: string; // ISO date string
    creatorId: string;
  }[];
  unreadNotificationsCount: number;
} 