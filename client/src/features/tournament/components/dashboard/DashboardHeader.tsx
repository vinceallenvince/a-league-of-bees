import React from 'react';
import { Bell } from 'lucide-react';
import { DashboardData } from '../../types';
import { Badge } from '@/core/ui/badge';

interface DashboardHeaderProps {
  dashboardData?: DashboardData;
  isLoading: boolean;
  error: Error | null;
}

/**
 * DashboardHeader component
 * 
 * Displays user information and quick stats at the top of the dashboard
 */
export default function DashboardHeader({ dashboardData, isLoading, error }: DashboardHeaderProps) {
  if (isLoading) {
    return (
      <div data-testid="dashboard-header-loading" className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
        </div>
        <div className="mt-4 grid grid-cols-4 gap-4">
          <div className="h-16 bg-gray-200 rounded"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
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
              Error loading dashboard data: {error.message}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return null;
  }
  
  const { userInfo, tournamentSummary, unreadNotificationsCount } = dashboardData;
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">
          Welcome, <span className="text-blue-600">{userInfo.username}</span>
        </h2>
        
        {/* Notification badge */}
        <div className="relative">
          <Bell className="h-6 w-6 text-gray-500" />
          {unreadNotificationsCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 bg-blue-600" 
              aria-label={`${unreadNotificationsCount} unread notifications`}
            >
              {unreadNotificationsCount}
            </Badge>
          )}
        </div>
      </div>
      
      {/* Tournament summary */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg text-center">
          <span className="block text-2xl font-bold text-blue-600">{tournamentSummary.active}</span>
          <span className="text-sm text-gray-500">Active</span>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg text-center">
          <span className="block text-2xl font-bold text-yellow-600">{tournamentSummary.pending}</span>
          <span className="text-sm text-gray-500">Pending</span>
        </div>
        <div className="bg-green-50 p-4 rounded-lg text-center">
          <span className="block text-2xl font-bold text-green-600">{tournamentSummary.completed}</span>
          <span className="text-sm text-gray-500">Completed</span>
        </div>
        <div className="bg-red-50 p-4 rounded-lg text-center">
          <span className="block text-2xl font-bold text-red-600">{tournamentSummary.cancelled}</span>
          <span className="text-sm text-gray-500">Cancelled</span>
        </div>
      </div>
    </div>
  );
} 