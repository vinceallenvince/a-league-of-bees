import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { TournamentForm } from '../components/tournament/TournamentForm';
import { TournamentFormData } from '../types';
import { tournamentApi } from '../api/tournamentApi';

/**
 * Tournament Create Page
 * 
 * Allows users to create a new tournament
 */
export default function TournamentCreatePage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [, setLocation] = useLocation();
  
  // Initial form data
  const initialData: TournamentFormData = {
    name: '',
    description: '',
    durationDays: 7,
    startDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    requiresVerification: false,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  };
  
  const handleSubmit = async (formData: TournamentFormData) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const tournament = await tournamentApi.createTournament(formData);
      // Redirect to the new tournament
      setLocation(`/tournaments/${tournament.id}`);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create tournament'));
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Create Tournament</h1>
        
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
                  {error.message}
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="bg-white shadow-sm rounded-md p-6">
          <TournamentForm
            initialData={initialData}
            onSubmit={handleSubmit}
            isLoading={isSubmitting}
          />
        </div>
      </div>
    </div>
  );
} 