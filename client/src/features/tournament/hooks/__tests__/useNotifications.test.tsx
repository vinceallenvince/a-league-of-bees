import { renderHook, waitFor, act } from '@testing-library/react';
import { useNotifications } from '../useNotifications';
import { tournamentApi } from '../../api/tournamentApi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock the tournamentApi
jest.mock('../../api/tournamentApi');

describe('useNotifications', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient.clear();
  });

  it('should fetch notifications data', async () => {
    const mockNotifications = {
      notifications: [
        {
          id: 'n1',
          userId: 'u1',
          tournamentId: 't1',
          type: 'invitation',
          message: 'You have been invited to a tournament',
          read: false,
          createdAt: '2023-01-01T00:00:00.000Z'
        },
        {
          id: 'n2',
          userId: 'u1',
          tournamentId: 't2',
          type: 'tournament_start',
          message: 'Tournament has started',
          read: true,
          createdAt: '2023-01-02T00:00:00.000Z'
        }
      ],
      unreadCount: 1,
      pagination: {
        page: 1,
        pageSize: 10,
        totalCount: 2,
        totalPages: 1
      }
    };

    (tournamentApi.getNotifications as jest.Mock).mockResolvedValue(mockNotifications);

    const { result } = renderHook(() => useNotifications(), { wrapper });

    // Initial state
    expect(result.current.isLoading).toBe(true);
    expect(result.current.notifications).toEqual([]);

    // Wait for data to load
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.notifications).toEqual(mockNotifications.notifications);
    expect(result.current.unreadCount).toBe(mockNotifications.unreadCount);
    expect(result.current.pagination).toEqual(mockNotifications.pagination);
    expect(result.current.error).toBeNull();
    expect(tournamentApi.getNotifications).toHaveBeenCalledWith({
      page: 1,
      pageSize: 10,
      type: undefined,
      isRead: undefined
    });
  });

  it('should handle error when fetching notifications fails', async () => {
    const errorMessage = 'Failed to fetch notifications';
    (tournamentApi.getNotifications as jest.Mock).mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useNotifications(), { wrapper });

    // Wait for error to be set
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe(errorMessage);
    expect(result.current.notifications).toEqual([]);
  });

  it('should change page and refetch notifications', async () => {
    const page1Response = {
      notifications: [{ id: 'n1', userId: 'u1', tournamentId: 't1', type: 'invitation', message: 'Invitation 1', read: false }],
      unreadCount: 1,
      pagination: { page: 1, pageSize: 10, totalCount: 2, totalPages: 2 }
    };

    const page2Response = {
      notifications: [{ id: 'n2', userId: 'u1', tournamentId: 't2', type: 'reminder', message: 'Reminder 1', read: false }],
      unreadCount: 1,
      pagination: { page: 2, pageSize: 10, totalCount: 2, totalPages: 2 }
    };

    (tournamentApi.getNotifications as jest.Mock)
      .mockResolvedValueOnce(page1Response)
      .mockResolvedValueOnce(page2Response);

    const { result } = renderHook(() => useNotifications(), { wrapper });

    // Wait for initial data to load
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.notifications).toEqual(page1Response.notifications);

    // Change page
    act(() => {
      result.current.setPage(2);
    });

    // Should be loading again
    await waitFor(() => expect(result.current.isLoading).toBe(true));

    // Wait for new data
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.notifications).toEqual(page2Response.notifications);
    expect(result.current.pagination).toEqual(page2Response.pagination);
    expect(tournamentApi.getNotifications).toHaveBeenCalledWith(expect.objectContaining({
      page: 2
    }));
  });

  it('should apply type filter correctly', async () => {
    const initialResponse = {
      notifications: [
        { id: 'n1', type: 'invitation', read: false },
        { id: 'n2', type: 'reminder', read: false }
      ],
      unreadCount: 2,
      pagination: { page: 1, pageSize: 10, totalCount: 2, totalPages: 1 }
    };

    const filteredResponse = {
      notifications: [{ id: 'n1', type: 'invitation', read: false }],
      unreadCount: 1,
      pagination: { page: 1, pageSize: 10, totalCount: 1, totalPages: 1 }
    };

    (tournamentApi.getNotifications as jest.Mock)
      .mockResolvedValueOnce(initialResponse)
      .mockResolvedValueOnce(filteredResponse);

    const { result } = renderHook(() => useNotifications(), { wrapper });

    // Wait for initial data to load
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Apply type filter
    act(() => {
      result.current.setTypeFilter('invitation');
    });

    // Should be loading again
    await waitFor(() => expect(result.current.isLoading).toBe(true));

    // Wait for filtered data
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.notifications).toEqual(filteredResponse.notifications);
    expect(tournamentApi.getNotifications).toHaveBeenCalledWith(expect.objectContaining({
      type: 'invitation'
    }));
  });

  it('should mark notification as read successfully', async () => {
    const markAsReadResponse = {
      id: 'n1',
      read: true
    };

    (tournamentApi.getNotifications as jest.Mock)
      .mockResolvedValue({
        notifications: [],
        unreadCount: 0,
        pagination: { page: 1, pageSize: 10, totalCount: 0, totalPages: 0 }
      });
      
    (tournamentApi.markNotificationAsRead as jest.Mock)
      .mockResolvedValue(markAsReadResponse);

    const { result } = renderHook(() => useNotifications(), { wrapper });

    // Wait for initial data to load
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Call markAsRead
    const response = await result.current.markAsRead('n1');
    
    expect(response).toEqual(markAsReadResponse);
    expect(tournamentApi.markNotificationAsRead).toHaveBeenCalledWith('n1');
  });

  it('should mark all notifications as read successfully', async () => {
    const markAllAsReadResponse = {
      count: 5
    };

    (tournamentApi.getNotifications as jest.Mock)
      .mockResolvedValue({
        notifications: [],
        unreadCount: 0,
        pagination: { page: 1, pageSize: 10, totalCount: 0, totalPages: 0 }
      });
      
    (tournamentApi.markAllNotificationsAsRead as jest.Mock)
      .mockResolvedValue(markAllAsReadResponse);

    const { result } = renderHook(() => useNotifications(), { wrapper });

    // Wait for initial data to load
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Call markAllAsRead
    const response = await result.current.markAllAsRead();
    
    expect(response).toEqual(markAllAsReadResponse);
    expect(tournamentApi.markAllNotificationsAsRead).toHaveBeenCalled();
  });

  it('should handle error when marking notification as read fails', async () => {
    const errorMessage = 'Failed to mark notification as read';
    
    (tournamentApi.getNotifications as jest.Mock)
      .mockResolvedValue({
        notifications: [],
        unreadCount: 0,
        pagination: { page: 1, pageSize: 10, totalCount: 0, totalPages: 0 }
      });
      
    (tournamentApi.markNotificationAsRead as jest.Mock)
      .mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useNotifications(), { wrapper });

    // Wait for initial data to load
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Call markAsRead and expect it to throw
    await expect(result.current.markAsRead('n1')).rejects.toThrow(errorMessage);
    expect(tournamentApi.markNotificationAsRead).toHaveBeenCalledWith('n1');
  });
}); 