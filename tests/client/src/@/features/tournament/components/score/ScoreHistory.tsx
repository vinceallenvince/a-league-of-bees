import React, { useState } from 'react';
import { ScoreEntry } from '../../types';

interface ScoreHistoryProps {
  scores: ScoreEntry[];
  totalDays: number;
  isLoading?: boolean;
  onViewScreenshot?: (screenshotUrl: string) => void;
}

/**
 * ScoreHistory component for displaying user score history - Mock for testing
 */
export function ScoreHistory({
  scores,
  totalDays,
  isLoading = false,
  onViewScreenshot
}: ScoreHistoryProps) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  
  // Filter scores by day if a day is selected
  const filteredScores = selectedDay
    ? scores.filter(score => score.day === selectedDay)
    : scores;
  
  // Sort scores by day in descending order (most recent first)
  const sortedScores = [...filteredScores].sort((a, b) => b.day - a.day);
  
  // Generate days array for filter
  const days = Array.from({ length: totalDays }, (_, i) => i + 1);
  
  const handleDayChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedDay(value === 'all' ? null : parseInt(value, 10));
  };
  
  // Empty state
  if (scores.length === 0 && !isLoading) {
    return (
      <div>
        <h3>No score history available</h3>
      </div>
    );
  }
  
  // Loading state
  if (isLoading) {
    return <div>Loading score history...</div>;
  }
  
  return (
    <div>
      <div>
        <h3>Score History</h3>
        <div>
          <label htmlFor="day-filter">
            Day:
          </label>
          <select
            id="day-filter"
            value={selectedDay === null ? 'all' : selectedDay}
            onChange={handleDayChange}
          >
            <option value="all">All</option>
            {days.map(day => (
              <option key={day} value={day}>
                {day}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Day</th>
            <th>Score</th>
            <th>Submitted</th>
            <th>Screenshot</th>
          </tr>
        </thead>
        <tbody>
          {sortedScores.map(score => (
            <tr key={score.id}>
              <td>Day {score.day}</td>
              <td>{score.score}</td>
              <td>{score.createdAt}</td>
              <td>
                {score.screenshotUrl ? (
                  <button
                    type="button"
                    onClick={() => onViewScreenshot && onViewScreenshot(score.screenshotUrl!)}
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
      
      {sortedScores.length === 0 && (
        <p>No scores found for the selected filters.</p>
      )}
    </div>
  );
} 