import React from 'react';
import { useRoute } from 'wouter';
import { useTournament } from '../hooks/useTournaments';

/**
 * Tournament Detail Page
 * 
 * Displays detailed information about a specific tournament
 */
export default function TournamentDetailPage() {
  const [, params] = useRoute('/tournaments/:id');
  const tournamentId = params?.id || '';
  
  const { tournament, isLoading, error } = useTournament(tournamentId);
  
  if (isLoading) {
    return <div className="container mx-auto py-8 px-4">Loading tournament details...</div>;
  }
  
  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <p className="text-red-700">Error loading tournament: {error.message}</p>
        </div>
      </div>
    );
  }
  
  if (!tournament) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <p className="text-yellow-700">Tournament not found.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-4">{tournament.name}</h1>
      {tournament.description && (
        <p className="text-gray-600 mb-6">{tournament.description}</p>
      )}
      
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Tournament Details</h3>
        </div>
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                {tournament.status.charAt(0).toUpperCase() + tournament.status.slice(1)}
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Start Date</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                {new Date(tournament.startDate).toLocaleDateString()}
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Duration</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                {tournament.durationDays} days
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Created By</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                {tournament.creatorUsername}
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Participants</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                {tournament.participantCount}
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Verification Required</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                {tournament.requiresVerification ? 'Yes' : 'No'}
              </dd>
            </div>
          </dl>
        </div>
      </div>
      
      <div className="bg-gray-100 p-4 rounded-md">
        <p className="text-center text-gray-700 italic">
          Leaderboard and participant management to be implemented in the next phase.
        </p>
      </div>
    </div>
  );
} 