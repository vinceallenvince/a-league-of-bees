/**
 * Type definitions for the tournament feature
 */

export type TournamentStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface TournamentParticipantStatus {
  invited: 'invited';
  joined: 'joined';
  declined: 'declined';
}

export type NotificationType = 'invitation' | 'reminder' | 'tournament_start' | 'tournament_end' | 'tournament_cancelled';

// Database view result types
export interface ActiveTournament {
  id: string;
  creator_id: string;
  name: string;
  description?: string;
  duration_days: number;
  start_date: Date;
  requires_verification: boolean;
  status: TournamentStatus;
  timezone: string;
  created_at: Date;
  updated_at: Date;
  creator_email: string;
  creator_username?: string;
  creator_first_name?: string;
  creator_last_name?: string;
  participant_count: number;
}

export interface TournamentLeaderboardEntry {
  tournament_id: string;
  tournament_name: string;
  user_id: string;
  username?: string;
  email: string;
  total_score: number;
  highest_score: number;
  days_participated: number;
}

export interface UserTournament {
  user_id: string;
  email: string;
  username?: string;
  tournament_id: string;
  tournament_name: string;
  tournament_status: TournamentStatus;
  start_date: Date;
  duration_days: number;
  participation_status: string;
  joined_at: Date;
  score_submissions: number;
  total_score?: number;
}

export interface UnreadNotificationSummary {
  user_id: string;
  type: NotificationType;
  notification_count: number;
}

export interface TournamentDailyStat {
  tournament_id: string;
  day: number;
  participants: number;
  average_score: number;
  highest_score: number;
  lowest_score: number;
} 