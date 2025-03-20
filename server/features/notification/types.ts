import { NotificationType } from '../tournament/types';

/**
 * Interface for notification data with pagination
 */
export interface PaginatedNotifications {
  notifications: NotificationData[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Interface for notification data
 */
export interface NotificationData {
  id: string;
  userId: string;
  tournamentId: string;
  tournamentName: string;
  type: NotificationType;
  message: string;
  read: boolean;
  createdAt: Date;
}

/**
 * Schema for marking notifications as read
 */
export interface MarkAsReadRequest {
  notificationIds: string[];
} 