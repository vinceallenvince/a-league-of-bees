import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tournamentApi } from '../api/tournamentApi';
import { TournamentFormData, TournamentUpdateData } from '../types';

/**
 * Hook for managing a single tournament
 */
export function useTournament(id?: string) {
  const queryClient = useQueryClient();
  
  // Fetch tournament data
  const {
    data: tournament,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['tournament', id],
    queryFn: () => tournamentApi.getTournament(id!),
    enabled: !!id,
  });
  
  // Create tournament mutation
  const createMutation = useMutation({
    mutationFn: (data: TournamentFormData) => tournamentApi.createTournament(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      return data;
    },
  });
  
  // Update tournament mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: TournamentUpdateData }) => 
      tournamentApi.updateTournament(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tournament', data.id] });
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      return data;
    },
  });
  
  // Cancel tournament mutation
  const cancelMutation = useMutation({
    mutationFn: (tournamentId: string) => tournamentApi.cancelTournament(tournamentId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tournament', data.id] });
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      return data;
    },
  });
  
  // Join tournament mutation
  const joinMutation = useMutation({
    mutationFn: (tournamentId: string) => tournamentApi.joinTournament(tournamentId),
    onSuccess: () => {
      if (id) {
        queryClient.invalidateQueries({ queryKey: ['tournament', id] });
        queryClient.invalidateQueries({ queryKey: ['tournaments'] });
        queryClient.invalidateQueries({ queryKey: ['tournament', id, 'participants'] });
      }
    },
  });
  
  return {
    tournament,
    isLoading,
    error,
    refetch,
    createTournament: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    createError: createMutation.error,
    updateTournament: (data: TournamentUpdateData) => 
      updateMutation.mutateAsync({ id: id!, data }),
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,
    cancelTournament: () => cancelMutation.mutateAsync(id!),
    isCancelling: cancelMutation.isPending,
    cancelError: cancelMutation.error,
    joinTournament: () => joinMutation.mutateAsync(id!),
    isJoining: joinMutation.isPending,
    joinError: joinMutation.error,
  };
} 