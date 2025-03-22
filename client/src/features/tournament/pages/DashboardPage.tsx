import React from 'react';
import { Link } from 'wouter';
import { useDashboardData } from '../hooks/useDashboardData';
import { TournamentStatus, NotificationType } from '../types';
import { format } from 'date-fns';

/**
 * Dashboard Page
 * 
 * Main entry point for users showing tournament overview and notifications
 */
export default function DashboardPage() {
  const { dashboardData, isLoading, error } = useDashboardData();
  
  // Format timestamp for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'MMM d, yyyy');
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
  
  // Get status badge color based on tournament status
  const getStatusColor = (status: TournamentStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      {/* Error state */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                Error loading dashboard data: {error.message}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Loading state */}
      {isLoading && (
        <div className="text-center py-12">
          <svg
            className="animate-spin mx-auto h-8 w-8 text-gray-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="mt-2 text-gray-500">Loading dashboard data...</p>
        </div>
      )}
      
      {/* Dashboard content */}
      {!isLoading && dashboardData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tournament summary */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Tournament Summary</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <span className="block text-2xl font-bold text-blue-600">{dashboardData.tournamentSummary.active}</span>
                  <span className="text-sm text-gray-500">Active</span>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg text-center">
                  <span className="block text-2xl font-bold text-yellow-600">{dashboardData.tournamentSummary.pending}</span>
                  <span className="text-sm text-gray-500">Pending</span>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <span className="block text-2xl font-bold text-green-600">{dashboardData.tournamentSummary.completed}</span>
                  <span className="text-sm text-gray-500">Completed</span>
                </div>
                <div className="bg-red-50 p-4 rounded-lg text-center">
                  <span className="block text-2xl font-bold text-red-600">{dashboardData.tournamentSummary.cancelled}</span>
                  <span className="text-sm text-gray-500">Cancelled</span>
                </div>
              </div>
            </div>
            
            {/* Participation summary */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Your Participation</h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <span className="block text-2xl font-bold text-purple-600">{dashboardData.participation.hosting}</span>
                  <span className="text-sm text-gray-500">Hosting</span>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <span className="block text-2xl font-bold text-blue-600">{dashboardData.participation.joined}</span>
                  <span className="text-sm text-gray-500">Joined</span>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg text-center">
                  <span className="block text-2xl font-bold text-yellow-600">{dashboardData.participation.invited}</span>
                  <span className="text-sm text-gray-500">Invited</span>
                </div>
              </div>
            </div>
            
            {/* Upcoming tournaments */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Upcoming Tournaments</h2>
                <Link href="/tournaments">
                  <a className="text-sm text-blue-600 hover:text-blue-800">View all</a>
                </Link>
              </div>
              
              {dashboardData.upcomingTournaments.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No upcoming tournaments</p>
              ) : (
                <div className="space-y-4">
                  {dashboardData.upcomingTournaments.map(tournament => (
                    <div key={tournament.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between">
                        <h3 className="font-medium">{tournament.name}</h3>
                        <span className="text-sm text-gray-500">
                          {formatDate(tournament.startDate)}
                        </span>
                      </div>
                      <div className="mt-2">
                        <Link href={`/tournaments/${tournament.id}`}>
                          <a className="text-sm text-blue-600 hover:text-blue-800">View details</a>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Right column */}
          <div className="space-y-6">
            {/* Quick actions */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
              <div className="space-y-2">
                <Link href="/tournaments/new">
                  <a className="block w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-center">
                    Create Tournament
                  </a>
                </Link>
                <Link href="/tournaments">
                  <a className="block w-full py-2 px-4 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-md text-center">
                    Browse Tournaments
                  </a>
                </Link>
              </div>
            </div>
            
            {/* Recent activity */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Recent Activity</h2>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {dashboardData.unreadNotificationsCount} unread
                </span>
              </div>
              
              {dashboardData.recentActivity.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No recent activity</p>
              ) : (
                <div className="space-y-4">
                  {dashboardData.recentActivity.map(activity => (
                    <div 
                      key={activity.id} 
                      className={`border-l-4 rounded-r-lg p-4 ${!activity.read ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mb-1 ${getNotificationColor(activity.type)}`}>
                            {getNotificationTypeLabel(activity.type)}
                          </span>
                          <p className="text-sm text-gray-800">{activity.message}</p>
                          <Link href={`/tournaments/${activity.tournamentId}`}>
                            <a className="text-xs text-blue-600 hover:text-blue-800 mt-1 inline-block">
                              {activity.tournamentName}
                            </a>
                          </Link>
                        </div>
                        <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                          {formatDate(activity.timestamp)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 