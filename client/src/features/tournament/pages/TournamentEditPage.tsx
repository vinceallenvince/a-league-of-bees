import React, { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { TournamentForm } from '../components/tournament/TournamentForm';
import { TournamentFormData, TournamentUpdateData } from '../types';
import { useTournament, useIsTournamentCreator, useCanEditTournament } from '../hooks/useTournaments';
import { tournamentApi } from '../api/tournamentApi';

/**
 * Tournament Edit Page
 * 
 * Allows tournament creators to edit tournament details
 */
export default function TournamentEditPage() {
  const [, params] = useRoute('/tournaments/:id/edit');
  const tournamentId = params?.id || '';
  const [, setLocation] = useLocation();
  
  const { tournament, isLoading, error, refetch } = useTournament(tournamentId);
  const [formData, setFormData] = useState<TournamentFormData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<Error | null>(null);
  
  // Get current user ID (in a real app, this would come from an auth context)
  const currentUserId = '1'; // Placeholder, should be replaced with actual user ID
  
  const isCreator = useIsTournamentCreator(tournament, currentUserId);
  const canEdit = useCanEditTournament(tournament, isCreator);
  
  // Prepare form data when tournament is loaded
  useEffect(() => {
    if (tournament) {
      setFormData({
        name: tournament.name,
        description: tournament.description || '',
        durationDays: tournament.durationDays,
        startDate: new Date(tournament.startDate),
        requiresVerification: tournament.requiresVerification || false,
        timezone: tournament.timezone || 'UTC'
      });
    }
  }, [tournament]);
  
  const handleSubmit = async (data: TournamentFormData) => {
    if (!tournament) return;
    
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      // Convert to update format (only changed fields)
      const updateData: TournamentUpdateData = {};
      
      if (data.name !== tournament.name) updateData.name = data.name;
      if (data.description !== tournament.description) updateData.description = data.description;
      if (data.durationDays !== tournament.durationDays) updateData.durationDays = data.durationDays;
      
      // Compare dates
      const currentStartDate = new Date(tournament.startDate);
      if (data.startDate.getTime() !== currentStartDate.getTime()) {
        updateData.startDate = data.startDate;
      }
      
      if (data.requiresVerification !== tournament.requiresVerification) {
        updateData.requiresVerification = data.requiresVerification;
      }
      
      if (data.timezone !== tournament.timezone) updateData.timezone = data.timezone;
      
      // Only send update if there are changes
      if (Object.keys(updateData).length > 0) {
        await tournamentApi.updateTournament(tournamentId, updateData);
      }
      
      // Refetch and redirect
      await refetch();
      setLocation(`/tournaments/${tournamentId}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err : new Error('Failed to update tournament'));
      setIsSubmitting(false);
    }
  };
  
  // Handle loading state
  if (isLoading) {
    return <div className="container mx-auto py-8 px-4">Loading tournament...</div>;
  }
  
  // Handle error state
  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <p className="text-red-700">Error loading tournament: {error.message}</p>
        </div>
      </div>
    );
  }
  
  // Handle not found
  if (!tournament) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <p className="text-yellow-700">Tournament not found.</p>
        </div>
      </div>
    );
  }
  
  // Handle permission denied
  if (!canEdit) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <p className="text-red-700">
            You don't have permission to edit this tournament. 
            Only the creator can edit a pending tournament.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Edit Tournament</h1>
        
        {submitError && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  {submitError.message}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {formData && (
          <div className="bg-white shadow-sm rounded-md p-6">
            <TournamentForm
              initialData={formData}
              onSubmit={handleSubmit}
              isEditing={true}
              isLoading={isSubmitting}
            />
          </div>
        )}
      </div>
    </div>
  );
} 