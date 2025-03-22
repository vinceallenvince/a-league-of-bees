import React from 'react';
import { Link } from 'wouter';
import { NotificationType } from '../../types';
import { useNotifications } from '../../hooks/useNotifications';
import { Button } from '@/core/ui/button';
import { format } from 'date-fns';
import { ChevronRight, Bell, CheckCircle } from 'lucide-react';

/**
 * NotificationCenter component
 * 
 * Displays notifications and provides management controls
 */
export default function NotificationCenter() {
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    isMarkingAsRead,
    isMarkingAllAsRead,
    setPage,
    pagination
  } = useNotifications();
  
  // Format timestamp for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'MMM d, h:mm a');
  };
  
  // Get notification badge color based on type
  const getNotificationColor = (type: NotificationType) => {
    switch (type) {
      case 'invitation':
        return 'bg-blue-100 text-blue-800';
      case 'tournament_start':
        return 'bg-green-100 text-green-800';
      case 'tournament_end':
        return 'bg-purple-100 text-purple-800';
      case 'tournament_cancelled':
        return 'bg-red-100 text-red-800';
      case 'reminder':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Get human-readable notification type
  const getNotificationTypeLabel = (type: NotificationType) => {
    switch (type) {
      case 'invitation':
        return 'Invitation';
      case 'tournament_start':
        return 'Tournament Started';
      case 'tournament_end':
        return 'Tournament Ended';
      case 'tournament_cancelled':
        return 'Tournament Cancelled';
      case 'reminder':
        return 'Reminder';
      default:
        return 'Notification';
    }
  };
  
  // Handle marking a notification as read
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead(notificationId);
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };
  
  // Handle marking all notifications as read
  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };
  
  // Handle loading more notifications
  const handleLoadMore = () => {
    if (pagination.page < pagination.totalPages) {
      setPage(pagination.page + 1);
    }
  };
  
  if (isLoading) {
    return (
      <div data-testid="notification-center-loading" className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
        <div className="flex justify-between items-center mb-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
        </div>
        
        <div className="space-y-4">
          <div className="border-l-4 border-gray-200 rounded-r-lg p-4">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
          <div className="border-l-4 border-gray-200 rounded-r-lg p-4">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">
              Error loading notifications: {error.message}
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <Bell className="h-5 w-5 text-gray-500 mr-2" />
          <h2 className="text-lg font-semibold">Notifications</h2>
        </div>
        
        {unreadCount > 0 && (
          <div className="flex items-center">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2">
              {unreadCount} unread
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleMarkAllAsRead}
              disabled={isMarkingAllAsRead}
              className="text-xs"
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              Mark all as read
            </Button>
          </div>
        )}
      </div>
      
      {notifications.length === 0 ? (
        <div className="text-center py-8">
          <Bell className="h-8 w-8 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500">No notifications</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {notifications.map(notification => (
              <div 
                key={notification.id} 
                className={`border-l-4 rounded-r-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer ${!notification.read ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                onClick={() => !notification.read && handleMarkAsRead(notification.id)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mb-1 ${getNotificationColor(notification.type)}`}>
                      {getNotificationTypeLabel(notification.type)}
                    </span>
                    <p className="text-sm text-gray-800">{notification.message}</p>
                    <Link 
                      href={`/tournaments/${notification.tournamentId}`}
                      className="text-xs text-blue-600 hover:text-blue-800 mt-1 inline-flex items-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View tournament
                      <ChevronRight className="h-3 w-3 ml-1" />
                    </Link>
                  </div>
                  <span className="text-xs text-gray-500">
                    {formatDate(notification.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          {pagination.page < pagination.totalPages && (
            <div className="mt-4 text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLoadMore}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Load more
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
} 