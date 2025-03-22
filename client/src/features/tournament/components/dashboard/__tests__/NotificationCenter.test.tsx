import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { render } from '../../../test-utils';
import NotificationCenter from '../NotificationCenter';
import { Notification, NotificationType } from '../../../types';

// Mock functions for testing
const mockMarkAsRead = jest.fn();
const mockMarkAllAsRead = jest.fn();

// Mock the notifications data
const mockNotifications: Notification[] = [
  {
    id: '1',
    userId: 'user1',
    tournamentId: 'tournament1',
    type: 'invitation' as NotificationType,
    message: 'You have been invited to Summer Tournament',
    read: false,
    createdAt: '2023-05-01T10:00:00Z'
  },
  {
    id: '2',
    userId: 'user1',
    tournamentId: 'tournament2',
    type: 'tournament_start' as NotificationType,
    message: 'Winter Challenge has started',
    read: true,
    createdAt: '2023-04-30T15:30:00Z'
  }
];

// Mock the useNotifications hook
jest.mock('../../../hooks/useNotifications', () => ({
  useNotifications: () => ({
    notifications: mockNotifications,
    unreadCount: 1,
    pagination: { page: 1, pageSize: 10, totalCount: 2, totalPages: 1 },
    isLoading: false,
    error: null,
    setPage: jest.fn(),
    setPageSize: jest.fn(),
    setTypeFilter: jest.fn(),
    setReadFilter: jest.fn(),
    refetch: jest.fn(),
    markAsRead: mockMarkAsRead,
    isMarkingAsRead: false,
    markAsReadError: null,
    markAllAsRead: mockMarkAllAsRead,
    isMarkingAllAsRead: false,
    markAllAsReadError: null
  })
}));

// Mock wouter's Link component
jest.mock('wouter', () => ({
  Link: ({ href, children }: { href: string, children: React.ReactNode }) => (
    <a href={href} data-testid="mock-link">{children}</a>
  )
}));

describe('NotificationCenter', () => {
  beforeEach(() => {
    // Clear mock function calls before each test
    mockMarkAsRead.mockClear();
    mockMarkAllAsRead.mockClear();
  });
  
  test('renders notification list correctly', () => {
    render(<NotificationCenter />);
    
    // Check that the component title is displayed
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    
    // Check that unread count badge is displayed
    expect(screen.getByText('1 unread')).toBeInTheDocument();
    
    // Check that notifications are displayed
    expect(screen.getByText('You have been invited to Summer Tournament')).toBeInTheDocument();
    expect(screen.getByText('Winter Challenge has started')).toBeInTheDocument();
    
    // Check that notification types are displayed
    expect(screen.getByText('Invitation')).toBeInTheDocument();
    expect(screen.getByText('Tournament Started')).toBeInTheDocument();
  });
  
  test('clicking mark all as read button calls markAllAsRead', () => {
    render(<NotificationCenter />);
    
    const markAllButton = screen.getByText('Mark all as read');
    fireEvent.click(markAllButton);
    
    expect(mockMarkAllAsRead).toHaveBeenCalled();
  });
  
  test('clicking on a notification calls markAsRead', () => {
    render(<NotificationCenter />);
    
    // Find the unread notification
    const notification = screen.getByText('You have been invited to Summer Tournament');
    // Get the parent div that has the onClick handler
    const notificationItem = notification.closest('div[class*="border-l-4"]');
    
    if (notificationItem) {
      fireEvent.click(notificationItem);
      expect(mockMarkAsRead).toHaveBeenCalledWith('1');
    }
  });
  
  test('renders empty state when no notifications', () => {
    // Override the mock to return no notifications
    jest.spyOn(require('../../../hooks/useNotifications'), 'useNotifications').mockReturnValueOnce({
      notifications: [],
      unreadCount: 0,
      pagination: { page: 1, pageSize: 10, totalCount: 0, totalPages: 0 },
      isLoading: false,
      error: null,
      setPage: jest.fn(),
      setPageSize: jest.fn(),
      setTypeFilter: jest.fn(),
      setReadFilter: jest.fn(),
      refetch: jest.fn(),
      markAsRead: jest.fn(),
      isMarkingAsRead: false,
      markAsReadError: null,
      markAllAsRead: jest.fn(),
      isMarkingAllAsRead: false,
      markAllAsReadError: null
    });
    
    render(<NotificationCenter />);
    
    expect(screen.getByText('No notifications')).toBeInTheDocument();
  });
  
  test('renders loading state', () => {
    // Override the mock to simulate loading state
    jest.spyOn(require('../../../hooks/useNotifications'), 'useNotifications').mockReturnValueOnce({
      notifications: [],
      unreadCount: 0,
      pagination: { page: 1, pageSize: 10, totalCount: 0, totalPages: 0 },
      isLoading: true,
      error: null,
      setPage: jest.fn(),
      setPageSize: jest.fn(),
      setTypeFilter: jest.fn(),
      setReadFilter: jest.fn(),
      refetch: jest.fn(),
      markAsRead: jest.fn(),
      isMarkingAsRead: false,
      markAsReadError: null,
      markAllAsRead: jest.fn(),
      isMarkingAllAsRead: false,
      markAllAsReadError: null
    });
    
    render(<NotificationCenter />);
    
    expect(screen.getByTestId('notification-center-loading')).toBeInTheDocument();
  });
}); 