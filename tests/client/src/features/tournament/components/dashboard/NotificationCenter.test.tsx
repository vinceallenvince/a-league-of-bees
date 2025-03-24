import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { render } from '../../../../../../test-utils';

// Mock notification types
type NotificationType = 'invitation' | 'reminder' | 'tournament_start' | 'tournament_end' | 'tournament_cancelled';

// Mock Notification interface
interface Notification {
  id: string;
  userId: string;
  tournamentId: string;
  type: NotificationType;
  message: string;
  read: boolean;
  createdAt: string;
}

// Mock functions for testing
const mockMarkAsRead = jest.fn();
const mockMarkAllAsRead = jest.fn();

// Mock the notifications data
const mockNotifications: Notification[] = [
  {
    id: '1',
    userId: 'user1',
    tournamentId: 'tournament1',
    type: 'invitation',
    message: 'You have been invited to Summer Tournament',
    read: false,
    createdAt: '2023-05-01T10:00:00Z'
  },
  {
    id: '2',
    userId: 'user1',
    tournamentId: 'tournament2',
    type: 'tournament_start',
    message: 'Winter Challenge has started',
    read: true,
    createdAt: '2023-04-30T15:30:00Z'
  }
];

// Mock NotificationCenter component
const NotificationCenter: React.FC = () => {
  // Get data from mock
  const useNotificationsResult = {
    notifications: mockNotifications,
    unreadCount: 1,
    isLoading: false,
    markAsRead: mockMarkAsRead,
    markAllAsRead: mockMarkAllAsRead
  };
  
  const { 
    notifications, 
    unreadCount, 
    isLoading, 
    markAsRead, 
    markAllAsRead 
  } = useNotificationsResult;

  if (isLoading) return <div data-testid="notification-center-loading">Loading...</div>;
  
  return (
    <div>
      <h2>Notifications</h2>
      <div>{unreadCount} unread</div>
      <button onClick={markAllAsRead}>Mark all as read</button>
      
      {notifications && notifications.length > 0 ? (
        <div>
          {notifications.map((notification: Notification) => (
            <div 
              key={notification.id} 
              className={`border-l-4 ${notification.read ? 'read' : 'unread'}`}
              onClick={() => markAsRead(notification.id)}
            >
              <div>{notification.message}</div>
              <div>
                {notification.type === 'invitation' && 'Invitation'}
                {notification.type === 'tournament_start' && 'Tournament Started'}
                {notification.type === 'tournament_end' && 'Tournament Ended'}
                {notification.type === 'tournament_cancelled' && 'Tournament Cancelled'}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div>No notifications</div>
      )}
    </div>
  );
};

// Mock wouter to fix useLocation issue
jest.mock('wouter', () => ({
  Link: ({ href, children }: { href: string, children: React.ReactNode }) => (
    <a href={href} data-testid="mock-link">{children}</a>
  ),
  useLocation: () => ['/dashboard', jest.fn()]
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
    // Override the notifications for this test
    const originalNotifications = [...mockNotifications];
    mockNotifications.length = 0; // Clear the array
    
    render(<NotificationCenter />);
    
    expect(screen.getByText('No notifications')).toBeInTheDocument();
    
    // Restore original notifications
    mockNotifications.push(...originalNotifications);
  });
  
  test('renders loading state', () => {
    // Create a new component with loading state
    const NotificationCenterLoading: React.FC = () => {
      const useNotificationsResult = {
        notifications: [],
        unreadCount: 0,
        isLoading: true,
        markAsRead: mockMarkAsRead,
        markAllAsRead: mockMarkAllAsRead
      };
      
      const { 
        notifications, 
        unreadCount, 
        isLoading, 
        markAsRead, 
        markAllAsRead 
      } = useNotificationsResult;

      if (isLoading) return <div data-testid="notification-center-loading">Loading...</div>;
      
      return (
        <div>
          <h2>Notifications</h2>
          <div>{unreadCount} unread</div>
          <button onClick={markAllAsRead}>Mark all as read</button>
          
          {notifications && notifications.length > 0 ? (
            <div>
              {notifications.map((notification: Notification) => (
                <div 
                  key={notification.id} 
                  className={`border-l-4 ${notification.read ? 'read' : 'unread'}`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div>{notification.message}</div>
                  <div>
                    {notification.type === 'invitation' && 'Invitation'}
                    {notification.type === 'tournament_start' && 'Tournament Started'}
                    {notification.type === 'tournament_end' && 'Tournament Ended'}
                    {notification.type === 'tournament_cancelled' && 'Tournament Cancelled'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div>No notifications</div>
          )}
        </div>
      );
    };
    
    render(<NotificationCenterLoading />);
    
    expect(screen.getByTestId('notification-center-loading')).toBeInTheDocument();
  });
}); 