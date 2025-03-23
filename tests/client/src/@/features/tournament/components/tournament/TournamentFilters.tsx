import React from 'react';

interface TournamentFiltersProps {
  onFilterChange: (filters: Record<string, string>) => void;
  className?: string;
}

/**
 * TournamentFilters component displays filtering options for tournaments
 */
export function TournamentFilters({ 
  onFilterChange, 
  className = '' 
}: TournamentFiltersProps) {
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ status: e.target.value });
  };
  
  return (
    <div className={`flex gap-4 ${className}`} data-testid="tournament-filters">
      <div>
        <label htmlFor="status-filter" className="block text-sm font-medium">
          Status
        </label>
        <select
          id="status-filter"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          onChange={handleStatusChange}
          defaultValue=""
          data-testid="status-filter"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
    </div>
  );
} 