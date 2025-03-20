import { NotificationType } from '../tournament/types';

/**
 * Interface for user dashboard data
 */
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
    timestamp: Date;
    read: boolean;
  }[];
  upcomingTournaments: {
    id: string;
    name: string;
    startDate: Date;
    creatorId: string;
  }[];
  unreadNotificationsCount: number;
} 