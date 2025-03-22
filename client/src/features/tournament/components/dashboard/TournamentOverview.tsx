import React from 'react';
import { Link } from 'wouter';
import { DashboardData } from '../../types';
import { format } from 'date-fns';
import { ChevronRight } from 'lucide-react';

interface TournamentOverviewProps {
  dashboardData?: DashboardData;
  isLoading: boolean;
  error: Error | null;
}

/**
 * TournamentOverview component
 * 
 * Displays tournament summary and upcoming tournaments
 */
export default function TournamentOverview({ dashboardData, isLoading, error }: TournamentOverviewProps) {
  // Format timestamp for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'MMM d, yyyy');
  };
  
  if (isLoading) {
    return (
      <div data-testid="tournament-overview-loading" className="space-y-6 animate-pulse">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-4 gap-4">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-16"></div>
          </div>
          
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="h-5 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="h-5 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </div>
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
              Failed to load tournament data: {error.message}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return null;
  }
  
  const { tournamentSummary, upcomingTournaments } = dashboardData;
  
  return (
    <div className="space-y-6">
      {/* Tournament summary */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Tournament Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
      
      {/* Upcoming tournaments */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Upcoming Tournaments</h2>
          <Link href="/tournaments" className="text-sm text-blue-600 hover:text-blue-800 flex items-center">
            View all
            <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </div>
        
        {upcomingTournaments.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No upcoming tournaments</p>
        ) : (
          <div className="space-y-4">
            {upcomingTournaments.map(tournament => (
              <div key={tournament.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">{tournament.name}</h3>
                  <span className="text-sm text-gray-500">
                    {formatDate(tournament.startDate)}
                  </span>
                </div>
                <div className="mt-2">
                  <Link 
                    href={`/tournaments/${tournament.id}`}
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    View details
                    <ChevronRight className="h-3 w-3 ml-1" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 