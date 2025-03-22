import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TournamentFilters } from '@/features/tournament/components/tournament/TournamentFilters';

// Mock the onFilterChange function
const mockOnFilterChange = jest.fn();

describe('TournamentFilters', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all filter inputs correctly', () => {
    render(<TournamentFilters onFilterChange={mockOnFilterChange} />);
    
    // Check if all inputs are rendered
    expect(screen.getByLabelText('Search')).toBeInTheDocument();
    expect(screen.getByLabelText('Status')).toBeInTheDocument();
    expect(screen.getByLabelText('Date Range')).toBeInTheDocument();
    expect(screen.getByText('Clear Filters')).toBeInTheDocument();
  });

  it('calls onFilterChange with initial filters on mount', () => {
    render(<TournamentFilters onFilterChange={mockOnFilterChange} />);
    
    expect(mockOnFilterChange).toHaveBeenCalledTimes(1);
    expect(mockOnFilterChange).toHaveBeenCalledWith({
      status: 'all',
      dateRange: 'all'
    });
  });

  it('calls onFilterChange with updated search value', () => {
    render(<TournamentFilters onFilterChange={mockOnFilterChange} />);
    
    // Clear initial call count
    mockOnFilterChange.mockClear();
    
    // Update search input
    const searchInput = screen.getByLabelText('Search');
    fireEvent.change(searchInput, { target: { value: 'test search' } });
    
    expect(mockOnFilterChange).toHaveBeenCalledWith({
      search: 'test search',
      status: 'all',
      dateRange: 'all'
    });
  });

  it('calls onFilterChange with updated status value', () => {
    render(<TournamentFilters onFilterChange={mockOnFilterChange} />);
    
    // Clear initial call count
    mockOnFilterChange.mockClear();
    
    // Open status dropdown and select a status
    const statusTrigger = screen.getByLabelText('Status');
    fireEvent.click(statusTrigger);
    
    // This might need to be adjusted based on how the Select component renders in tests
    const pendingOption = screen.getByText('Pending');
    fireEvent.click(pendingOption);
    
    expect(mockOnFilterChange).toHaveBeenCalledWith({
      status: 'pending',
      dateRange: 'all'
    });
  });

  it('calls onFilterChange with updated date range value', () => {
    render(<TournamentFilters onFilterChange={mockOnFilterChange} />);
    
    // Clear initial call count
    mockOnFilterChange.mockClear();
    
    // Open date range dropdown and select a value
    const dateRangeTrigger = screen.getByLabelText('Date Range');
    fireEvent.click(dateRangeTrigger);
    
    // This might need to be adjusted based on how the Select component renders in tests
    const upcomingOption = screen.getByText('Upcoming');
    fireEvent.click(upcomingOption);
    
    expect(mockOnFilterChange).toHaveBeenCalledWith({
      status: 'all',
      dateRange: 'upcoming'
    });
  });

  it('resets all filters when Clear Filters button is clicked', () => {
    render(<TournamentFilters 
      onFilterChange={mockOnFilterChange} 
      initialFilters={{ search: 'test', status: 'pending', dateRange: 'upcoming' }}
    />);
    
    // Clear initial call count
    mockOnFilterChange.mockClear();
    
    // Click the clear filters button
    fireEvent.click(screen.getByText('Clear Filters'));
    
    expect(mockOnFilterChange).toHaveBeenCalledWith({
      search: '',
      status: 'all',
      dateRange: 'all'
    });
  });

  it('applies custom className when provided', () => {
    render(<TournamentFilters 
      onFilterChange={mockOnFilterChange} 
      className="custom-class"
    />);
    
    // Get the main container div
    const container = screen.getByText('Search').closest('.space-y-4');
    expect(container).toHaveClass('custom-class');
  });
}); 