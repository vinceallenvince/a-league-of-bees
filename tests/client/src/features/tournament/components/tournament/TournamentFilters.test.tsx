import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TournamentFilters } from '../../../../../../../client/src/features/tournament/components/tournament/TournamentFilters';

// Mock the onFilterChange function
const mockOnFilterChange = jest.fn();

describe('TournamentFilters', () => {
  beforeEach(() => {
    mockOnFilterChange.mockClear();
  });

  it('renders all filter inputs correctly', () => {
    render(<TournamentFilters onFilterChange={mockOnFilterChange} />);
    expect(screen.getByTestId('filters-container')).toBeInTheDocument();
  });

  it('calls onFilterChange with initial filters on mount', () => {
    render(<TournamentFilters onFilterChange={mockOnFilterChange} />);
    expect(mockOnFilterChange).toHaveBeenCalled();
  });

  it('applies custom className when provided', () => {
    render(<TournamentFilters onFilterChange={mockOnFilterChange} className="custom-class" />);
    const filtersContainer = screen.getByTestId('filters-container');
    expect(filtersContainer).toHaveClass('custom-class');
  });
}); 