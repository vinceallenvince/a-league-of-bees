import { useQuery } from '@tanstack/react-query';
import { tournamentApi } from '../api/tournamentApi';
import { DashboardData } from '../types';

/**
 * Hook for fetching dashboard data for the current user
 */
export function useDashboardData() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => tournamentApi.getDashboard(),
  });
  
  return {
    dashboardData: data as DashboardData,
    isLoading,
    error,
    refetch
  };
} 