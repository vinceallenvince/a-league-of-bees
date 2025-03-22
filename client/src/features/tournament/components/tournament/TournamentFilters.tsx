import React, { useState, useEffect } from 'react';
import { TournamentStatus } from '../../types';
import { Button } from '@/core/ui/button';
import { Input } from '@/core/ui/input';
import { Label } from '@/core/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/core/ui/select';

interface FilterOptions {
  search?: string;
  status?: TournamentStatus | 'all';
  dateRange?: 'upcoming' | 'past' | 'all';
}

interface TournamentFiltersProps {
  onFilterChange: (filters: FilterOptions) => void;
  initialFilters?: FilterOptions;
  className?: string;
}

/**
 * TournamentFilters component for filtering tournament lists
 */
export function TournamentFilters({
  onFilterChange,
  initialFilters = { status: 'all', dateRange: 'all' },
  className = ''
}: TournamentFiltersProps) {
  const [filters, setFilters] = useState<FilterOptions>(initialFilters);
  
  // Apply filters when they change
  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, search: e.target.value }));
  };
  
  const handleStatusChange = (value: string) => {
    setFilters(prev => ({ 
      ...prev, 
      status: value as TournamentStatus | 'all'
    }));
  };
  
  const handleDateRangeChange = (value: string) => {
    setFilters(prev => ({ 
      ...prev, 
      dateRange: value as 'upcoming' | 'past' | 'all'
    }));
  };
  
  const handleClearFilters = () => {
    setFilters({ status: 'all', dateRange: 'all', search: '' });
  };
  
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="w-full sm:w-1/3">
          <Label htmlFor="search" className="mb-1 block">Search</Label>
          <Input
            id="search"
            type="text"
            placeholder="Search tournaments..."
            value={filters.search || ''}
            onChange={handleSearchChange}
            className="w-full"
          />
        </div>
        
        <div className="w-full sm:w-1/3">
          <Label htmlFor="status" className="mb-1 block">Status</Label>
          <Select
            value={filters.status || 'all'}
            onValueChange={handleStatusChange}
          >
            <SelectTrigger id="status">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="w-full sm:w-1/3">
          <Label htmlFor="dateRange" className="mb-1 block">Date Range</Label>
          <Select
            value={filters.dateRange || 'all'}
            onValueChange={handleDateRangeChange}
          >
            <SelectTrigger id="dateRange">
              <SelectValue placeholder="Select date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Dates</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="past">Past</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={handleClearFilters}
          type="button"
        >
          Clear Filters
        </Button>
      </div>
    </div>
  );
} 