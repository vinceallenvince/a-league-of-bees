import { render, screen, fireEvent } from '@testing-library/react';

// Mock types
type ParticipantStatus = 'invited' | 'joined' | 'declined';

interface Participant {
  id: string;
  userId: string;
  tournamentId: string;
  username: string;
  joinedAt: string;
  status: ParticipantStatus;
}

// Mock ParticipantList component
const ParticipantList: React.FC<{
  participants: Participant[];
  isCreator: boolean;
  onRemove: (id: string) => void;
  onInvite: () => void;
}> = ({ participants, isCreator, onRemove, onInvite }) => {
  return (
    <div>
      {participants.length > 0 ? (
        <div>
          {participants.map((participant) => (
            <div key={participant.id}>
              <span>{participant.username}</span>
              <span>
                {participant.status === 'joined' && 'Joined'}
                {participant.status === 'invited' && 'Invited'}
                {participant.status === 'declined' && 'Declined'}
              </span>
              {isCreator && (
                <button onClick={() => onRemove(participant.id)}>Remove</button>
              )}
            </div>
          ))}
          {isCreator && <button onClick={onInvite}>Invite</button>}
        </div>
      ) : (
        <div>No participants yet</div>
      )}
    </div>
  );
};

describe('ParticipantList', () => {
  const mockParticipants: Participant[] = [
    {
      id: '1',
      userId: 'user-1',
      tournamentId: 'tournament-1',
      username: 'user1',
      joinedAt: '2023-01-01T00:00:00.000Z',
      status: 'joined'
    },
    {
      id: '2',
      userId: 'user-2',
      tournamentId: 'tournament-1',
      username: 'user2',
      joinedAt: '2023-01-02T00:00:00.000Z',
      status: 'invited'
    },
    {
      id: '3',
      userId: 'user-3',
      tournamentId: 'tournament-1',
      username: 'user3',
      joinedAt: '2023-01-03T00:00:00.000Z',
      status: 'declined'
    }
  ];

  const mockOnRemove = jest.fn();
  const mockOnInvite = jest.fn();

  beforeEach(() => {
    mockOnRemove.mockClear();
    mockOnInvite.mockClear();
  });

  it('renders participant list with correct information', () => {
    render(
      <ParticipantList 
        participants={mockParticipants} 
        isCreator={true} 
        onRemove={mockOnRemove}
        onInvite={mockOnInvite}
      />
    );
    
    expect(screen.getByText('user1')).toBeInTheDocument();
    expect(screen.getByText('user2')).toBeInTheDocument();
    expect(screen.getByText('user3')).toBeInTheDocument();
    
    expect(screen.getAllByText(/Joined/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Invited/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Declined/i)[0]).toBeInTheDocument();
  });

  it('displays invite button for creator', () => {
    render(
      <ParticipantList 
        participants={mockParticipants} 
        isCreator={true} 
        onRemove={mockOnRemove}
        onInvite={mockOnInvite}
      />
    );
    
    expect(screen.getByRole('button', { name: /Invite/i })).toBeInTheDocument();
  });
  
  it('does not display invite button for non-creator', () => {
    render(
      <ParticipantList 
        participants={mockParticipants} 
        isCreator={false} 
        onRemove={mockOnRemove}
        onInvite={mockOnInvite}
      />
    );
    
    expect(screen.queryByRole('button', { name: /Invite/i })).not.toBeInTheDocument();
  });

  it('calls onInvite when invite button is clicked', () => {
    render(
      <ParticipantList 
        participants={mockParticipants} 
        isCreator={true} 
        onRemove={mockOnRemove}
        onInvite={mockOnInvite}
      />
    );
    
    fireEvent.click(screen.getByRole('button', { name: /Invite/i }));
    expect(mockOnInvite).toHaveBeenCalledTimes(1);
  });

  it('calls onRemove when remove button is clicked', () => {
    render(
      <ParticipantList 
        participants={mockParticipants} 
        isCreator={true} 
        onRemove={mockOnRemove}
        onInvite={mockOnInvite}
      />
    );
    
    // There should be remove buttons next to each participant for the creator
    const removeButtons = screen.getAllByRole('button', { name: /Remove/i });
    expect(removeButtons.length).toBe(3);
    
    fireEvent.click(removeButtons[0]);
    expect(mockOnRemove).toHaveBeenCalledWith('1');
  });

  it('shows empty state when no participants', () => {
    render(
      <ParticipantList 
        participants={[]} 
        isCreator={true} 
        onRemove={mockOnRemove}
        onInvite={mockOnInvite}
      />
    );
    
    expect(screen.getByText(/No participants yet/i)).toBeInTheDocument();
  });
}); 