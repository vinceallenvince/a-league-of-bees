import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tournamentApi } from '../api/tournamentApi';
import { ParticipantStatus } from '../types';
import { useState } from 'react';

/**
 * Hook for managing tournament participants
 */
export function useParticipants(tournamentId?: string) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState<ParticipantStatus | undefined>(undefined);
  
  // Fetch participants
  const {
    data,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['tournament', tournamentId, 'participants', page, pageSize, statusFilter],
    queryFn: () => tournamentApi.getParticipants(
      tournamentId!,
      {
        page,
        pageSize,
        status: statusFilter
      }
    ),
    enabled: !!tournamentId,
  });
  
  // Invite users mutation
  const inviteMutation = useMutation({
    mutationFn: ({ tournamentId, emails }: { tournamentId: string; emails: string[] }) => 
      tournamentApi.inviteUsers(tournamentId, emails),
    onSuccess: () => {
      if (tournamentId) {
        queryClient.invalidateQueries({ 
          queryKey: ['tournament', tournamentId, 'participants'] 
        });
      }
    },
  });
  
  // Remove participant mutation
  const removeMutation = useMutation({
    mutationFn: ({ tournamentId, participantId }: { tournamentId: string; participantId: string }) => 
      tournamentApi.removeParticipant(tournamentId, participantId),
    onSuccess: () => {
      if (tournamentId) {
        queryClient.invalidateQueries({ 
          queryKey: ['tournament', tournamentId, 'participants'] 
        });
        queryClient.invalidateQueries({ 
          queryKey: ['tournament', tournamentId] 
        });
      }
    },
  });
  
  return {
    participants: data?.participants || [],
    pagination: data?.pagination || { page, pageSize, totalCount: 0, totalPages: 0 },
    isLoading,
    error,
    setPage,
    setPageSize,
    setStatusFilter,
    refetch,
    
    // Invite users
    inviteUsers: (emails: string[]) => 
      inviteMutation.mutateAsync({ tournamentId: tournamentId!, emails }),
    isInviting: inviteMutation.isPending,
    inviteError: inviteMutation.error,
    
    // Remove participant
    removeParticipant: (participantId: string) => 
      removeMutation.mutateAsync({ tournamentId: tournamentId!, participantId }),
    isRemoving: removeMutation.isPending,
    removeError: removeMutation.error,
  };
} 