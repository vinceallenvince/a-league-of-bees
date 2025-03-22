import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tournamentApi } from '../api/tournamentApi';
import { ScoreFormData } from '../types';
import { useState } from 'react';

/**
 * Hook for managing tournament scores
 */
export function useTournamentScores(tournamentId?: string) {
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [day, setDay] = useState<number | undefined>(undefined);
  
  // Fetch scores
  const {
    data: scores,
    isLoading: isLoadingScores,
    error: scoresError,
    refetch: refetchScores
  } = useQuery({
    queryKey: ['tournament', tournamentId, 'scores', userId, day],
    queryFn: () => tournamentApi.getScores(
      tournamentId!,
      {
        userId,
        day
      }
    ),
    enabled: !!tournamentId,
  });
  
  // Fetch leaderboard
  const {
    data: leaderboard,
    isLoading: isLoadingLeaderboard,
    error: leaderboardError,
    refetch: refetchLeaderboard
  } = useQuery({
    queryKey: ['tournament', tournamentId, 'leaderboard', day],
    queryFn: () => tournamentApi.getLeaderboard(tournamentId!, day),
    enabled: !!tournamentId,
  });
  
  // Submit score mutation
  const submitScoreMutation = useMutation({
    mutationFn: ({ tournamentId, scoreData }: { tournamentId: string; scoreData: ScoreFormData }) => 
      tournamentApi.submitScore(tournamentId, scoreData),
    onSuccess: () => {
      if (tournamentId) {
        queryClient.invalidateQueries({ 
          queryKey: ['tournament', tournamentId, 'scores'] 
        });
        queryClient.invalidateQueries({ 
          queryKey: ['tournament', tournamentId, 'leaderboard'] 
        });
      }
    },
  });
  
  return {
    // Scores data and filters
    scores,
    isLoadingScores,
    scoresError,
    refetchScores,
    setUserId,
    setDay,
    
    // Leaderboard data
    leaderboard,
    isLoadingLeaderboard,
    leaderboardError,
    refetchLeaderboard,
    
    // Score submission
    submitScore: (scoreData: ScoreFormData) => 
      submitScoreMutation.mutateAsync({ tournamentId: tournamentId!, scoreData }),
    isSubmittingScore: submitScoreMutation.isPending,
    submitScoreError: submitScoreMutation.error,
  };
} 