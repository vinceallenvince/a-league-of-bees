import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { NotificationType } from '../types';
import { tournamentApi } from '../api/tournamentApi';

/**
 * Hook for managing user notifications
 */
export function useNotifications() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [typeFilter, setTypeFilter] = useState<NotificationType | undefined>(undefined);
  const [readFilter, setReadFilter] = useState<boolean | undefined>(undefined);
  
  // Fetch notifications
  const {
    data,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['notifications', page, pageSize, typeFilter, readFilter],
    queryFn: () => tournamentApi.getNotifications({
      page,
      pageSize,
      type: typeFilter,
      isRead: readFilter
    }),
  });
  
  // Mark notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) => tournamentApi.markNotificationAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }); // Also invalidate dashboard data
    },
  });
  
  // Mark all notifications as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: () => tournamentApi.markAllNotificationsAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }); // Also invalidate dashboard data
    },
  });
  
  return {
    notifications: data?.notifications || [],
    unreadCount: data?.unreadCount || 0,
    pagination: data?.pagination || { page, pageSize, totalCount: 0, totalPages: 0 },
    isLoading,
    error,
    setPage,
    setPageSize,
    setTypeFilter,
    setReadFilter,
    refetch,
    
    // Mark as read
    markAsRead: (notificationId: string) => markAsReadMutation.mutateAsync(notificationId),
    isMarkingAsRead: markAsReadMutation.isPending,
    markAsReadError: markAsReadMutation.error,
    
    // Mark all as read
    markAllAsRead: () => markAllAsReadMutation.mutateAsync(),
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
    markAllAsReadError: markAllAsReadMutation.error,
  };
} 