import React from 'react';
import { useDashboardData } from '../hooks/useDashboardData';
import { 
  DashboardHeader,
  TournamentOverview,
  NotificationCenter,
  QuickActions
} from '../components/dashboard';

/**
 * Dashboard Page
 * 
 * Main entry point for users showing tournament overview and notifications
 */
export default function DashboardPage() {
  const { dashboardData, isLoading, error } = useDashboardData();
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      {/* Dashboard header with user info and stats */}
      <DashboardHeader 
        dashboardData={dashboardData} 
        isLoading={isLoading} 
        error={error} 
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Left column with tournament overview */}
        <div className="lg:col-span-2">
          <TournamentOverview 
            dashboardData={dashboardData} 
            isLoading={isLoading} 
            error={error} 
          />
        </div>
        
        {/* Right column with quick actions and notifications */}
        <div className="space-y-6">
          <QuickActions />
          <NotificationCenter />
        </div>
      </div>
    </div>
  );
} 