import { useQuery, useQueryClient } from '@tanstack/react-query';
import { tournamentApi } from '../api/tournamentApi';
import { DashboardData } from '../types';

/**
 * Hook for fetching dashboard data for the current user
 */
export function useDashboardData() {
  const queryClient = useQueryClient();
  
  const {
    data,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => tournamentApi.getDashboard(),
  });
  
  const refreshDashboard = () => {
    // Refresh dashboard data and related queries
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['tournaments'] });
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };
  
  return {
    dashboardData: data as DashboardData,
    isLoading,
    error,
    refetch,
    refreshDashboard
  };
} 