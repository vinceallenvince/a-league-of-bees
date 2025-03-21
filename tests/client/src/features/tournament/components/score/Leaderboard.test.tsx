import { render, screen, fireEvent } from '@testing-library/react';
import { Leaderboard } from '@/features/tournament/components/score/Leaderboard';
import { LeaderboardEntry } from '@/features/tournament/types';

describe('Leaderboard', () => {
  const mockEntries: LeaderboardEntry[] = [
    {
      userId: 'user-1',
      username: 'user1',
      totalScore: 500,
      scoresSubmitted: 5,
      rank: 1
    },
    {
      userId: 'user-2',
      username: 'user2',
      totalScore: 450,
      scoresSubmitted: 5,
      rank: 2
    },
    {
      userId: 'user-3',
      username: 'user3',
      totalScore: 400,
      scoresSubmitted: 4,
      rank: 3
    },
    {
      userId: 'user-4',
      username: 'user4',
      totalScore: 350,
      scoresSubmitted: 3,
      rank: 4
    },
    {
      userId: 'user-5',
      username: 'user5',
      totalScore: 300,
      scoresSubmitted: 3,
      rank: 5
    }
  ];

  const currentUserId = 'user-3';

  it('renders leaderboard with correct entries', () => {
    render(<Leaderboard entries={mockEntries} currentUserId={currentUserId} />);
    
    // Check if all users are displayed
    expect(screen.getByText('user1')).toBeInTheDocument();
    expect(screen.getByText('user2')).toBeInTheDocument();
    expect(screen.getByText('user3')).toBeInTheDocument();
    expect(screen.getByText('user4')).toBeInTheDocument();
    expect(screen.getByText('user5')).toBeInTheDocument();
    
    // Check if scores are displayed
    expect(screen.getByText('500')).toBeInTheDocument();
    expect(screen.getByText('450')).toBeInTheDocument();
    expect(screen.getByText('400')).toBeInTheDocument();
    expect(screen.getByText('350')).toBeInTheDocument();
    expect(screen.getByText('300')).toBeInTheDocument();
    
    // Check if ranks are displayed
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('#2')).toBeInTheDocument();
    expect(screen.getByText('#3')).toBeInTheDocument();
    expect(screen.getByText('#4')).toBeInTheDocument();
    expect(screen.getByText('#5')).toBeInTheDocument();
  });

  it('highlights the current user row', () => {
    render(<Leaderboard entries={mockEntries} currentUserId={currentUserId} />);
    
    // Find the row for user3 (current user) and check if it has a highlight class
    const rows = screen.getAllByRole('row');
    
    // First row is header, so user rows start at index 1
    // user-3 is at rank 3 in our mockEntries, so it's index 3 (header + position)
    const currentUserRow = rows[3]; // Header row + rank of 3 = index 3
    
    expect(currentUserRow).toHaveClass('highlighted-row');
  });

  it('shows empty state when no entries are provided', () => {
    render(<Leaderboard entries={[]} currentUserId={currentUserId} />);
    
    expect(screen.getByText(/No leaderboard data available/i)).toBeInTheDocument();
  });

  it('renders leaderboard with correct layout on mobile', () => {
    // Mock a mobile viewport width
    Object.defineProperty(window, 'innerWidth', { value: 480, writable: true });
    window.dispatchEvent(new Event('resize'));
    
    render(<Leaderboard entries={mockEntries} currentUserId={currentUserId} />);
    
    // In mobile view, we might hide some columns or show a simplified layout
    // Check that core data is still visible
    expect(screen.getByText('user1')).toBeInTheDocument();
    expect(screen.getByText('500')).toBeInTheDocument();
    expect(screen.getByText('#1')).toBeInTheDocument();
    
    // Reset to desktop viewport
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
    window.dispatchEvent(new Event('resize'));
  });

  it('shows pagination when there are many entries', () => {
    // Create a large array of entries
    const manyEntries: LeaderboardEntry[] = Array.from({ length: 30 }, (_, i) => ({
      userId: `user-${i+1}`,
      username: `user${i+1}`,
      totalScore: 500 - i * 10,
      scoresSubmitted: 5,
      rank: i + 1
    }));
    
    render(<Leaderboard entries={manyEntries} currentUserId={currentUserId} pageSize={10} />);
    
    // There should be pagination controls - use a more specific query for Next button
    const nextButtons = screen.getAllByRole('button', { name: /Next/i });
    expect(nextButtons.length).toBeGreaterThan(0);
    
    // Use the desktop pagination button (the second one) for our test
    const nextButton = nextButtons[1]; 
    expect(nextButton).toBeInTheDocument();
    
    expect(screen.getByText(/Page 1 of 3/i)).toBeInTheDocument();
    
    // Only the first 10 entries should be visible
    expect(screen.getByText('user1')).toBeInTheDocument();
    expect(screen.getByText('user10')).toBeInTheDocument();
    expect(screen.queryByText('user11')).not.toBeInTheDocument();
    
    // Go to next page
    fireEvent.click(nextButton);
    
    // Now entries 11-20 should be visible
    expect(screen.queryByText('user1')).not.toBeInTheDocument();
    expect(screen.getByText('user11')).toBeInTheDocument();
    expect(screen.getByText('user20')).toBeInTheDocument();
  });
}); 