import React, { useState } from 'react';
import { ScoreEntry } from '../../types';

interface ScoreHistoryProps {
  scores: ScoreEntry[];
  totalDays: number;
  isLoading?: boolean;
  onViewScreenshot?: (screenshotUrl: string) => void;
}

/**
 * ScoreHistory component for displaying user score history
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
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  const handleDayChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedDay(value === 'all' ? null : parseInt(value, 10));
  };
  
  // Empty state
  if (scores.length === 0 && !isLoading) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-md border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">No score history available</h3>
        <p className="text-sm text-gray-600 mt-1">
          Scores will appear here once you submit them.
        </p>
      </div>
    );
  }
  
  // Loading state
  if (isLoading) {
    return <div className="text-center py-4">Loading score history...</div>;
  }
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Score History</h3>
        <div className="flex items-center">
          <label htmlFor="day-filter" className="mr-2 text-sm text-gray-700">
            Day:
          </label>
          <select
            id="day-filter"
            value={selectedDay === null ? 'all' : selectedDay}
            onChange={handleDayChange}
            className="block w-24 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
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
      
      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                Day
              </th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Score
              </th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Submitted
              </th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Screenshot
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {sortedScores.map(score => (
              <tr key={score.id}>
                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                  Day {score.day}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">
                  {score.score}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  {formatDate(score.createdAt)}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  {score.screenshotUrl ? (
                    <button
                      type="button"
                      onClick={() => onViewScreenshot && onViewScreenshot(score.screenshotUrl!)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      View
                    </button>
                  ) : (
                    <span className="text-gray-400">None</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {sortedScores.length === 0 && (
        <p className="text-center py-4 text-sm text-gray-500">
          No scores found for the selected filters.
        </p>
      )}
    </div>
  );
} 