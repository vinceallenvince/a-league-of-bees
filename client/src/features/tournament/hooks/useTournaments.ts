import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { tournamentApi } from '../api/tournamentApi';
import { Tournament, TournamentStatus } from '../types';

interface TournamentFilters {
  status?: TournamentStatus;
  creatorId?: string;
}

/**
 * Hook for fetching and managing tournaments with filtering and pagination
 */
export function useTournaments() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState<TournamentFilters>({});
  
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['tournaments', page, pageSize, filters],
    queryFn: () => tournamentApi.getTournaments({
      page,
      pageSize,
      ...filters
    }),
  });
  
  return {
    tournaments: data?.tournaments || [],
    pagination: data?.pagination || { page, pageSize, totalCount: 0, totalPages: 0 },
    isLoading,
    error,
    setPage,
    setPageSize,
    setFilters,
    refetch
  };
}

/**
 * Hook for fetching a single tournament by ID
 */
export function useTournament(id: string) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['tournament', id],
    queryFn: () => tournamentApi.getTournament(id),
    enabled: !!id,
  });
  
  return {
    tournament: data,
    isLoading,
    error,
    refetch
  };
}

/**
 * Hook for checking if the current user is the creator of a tournament
 */
export function useIsTournamentCreator(tournament?: Tournament, currentUserId?: string) {
  return !!(tournament && currentUserId && tournament.creatorId === currentUserId);
}

/**
 * Hook for checking if the current user can join a tournament
 */
export function useCanJoinTournament(tournament?: Tournament) {
  return !!(tournament && (tournament.status === 'pending' || tournament.status === 'in_progress'));
}

/**
 * Hook for checking if a tournament can be edited
 */
export function useCanEditTournament(tournament?: Tournament, isCreator?: boolean) {
  return !!(tournament && isCreator && tournament.status === 'pending');
}

/**
 * Hook for checking if a tournament can be cancelled
 */
export function useCanCancelTournament(tournament?: Tournament, isCreator?: boolean) {
  return !!(tournament && isCreator && (tournament.status === 'pending' || tournament.status === 'in_progress'));
} 