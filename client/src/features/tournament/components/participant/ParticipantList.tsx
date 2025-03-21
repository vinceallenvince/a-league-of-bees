import React from 'react';
import { Participant } from '../../types';
import { formatDate } from '@/lib/date-utils';

interface ParticipantListProps {
  participants: Participant[];
  isCreator: boolean;
  onRemove: (participantId: string) => void;
  onInvite: () => void;
  isLoading?: boolean;
}

/**
 * Status badge colors based on participant status
 */
const STATUS_COLORS = {
  invited: 'bg-amber-100 text-amber-800 border-amber-200',
  joined: 'bg-green-100 text-green-800 border-green-200',
  declined: 'bg-gray-100 text-gray-800 border-gray-200'
};

/**
 * Status display names
 */
const STATUS_LABELS = {
  invited: 'Invited',
  joined: 'Joined',
  declined: 'Declined'
};

/**
 * ParticipantList component for displaying and managing tournament participants
 */
export function ParticipantList({
  participants,
  isCreator,
  onRemove,
  onInvite,
  isLoading = false
}: ParticipantListProps) {
  // If there are no participants, show empty state
  if (participants.length === 0 && !isLoading) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-md border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">No participants yet</h3>
        {isCreator && (
          <div className="mt-4">
            <button
              type="button"
              onClick={onInvite}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Invite Participants
            </button>
          </div>
        )}
      </div>
    );
  }

  // If loading, show loading state
  if (isLoading) {
    return <div className="text-center py-4">Loading participants...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Participants ({participants.length})</h3>
        {isCreator && (
          <button
            type="button"
            onClick={onInvite}
            className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Invite
          </button>
        )}
      </div>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {participants.map((participant) => {
            const statusColor = STATUS_COLORS[participant.status];
            const statusLabel = STATUS_LABELS[participant.status];
            const joinedDate = new Date(participant.joinedAt);
            
            return (
              <li key={participant.id}>
                <div className="px-4 py-4 flex items-center justify-between sm:px-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-600 font-medium">
                          {participant.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {participant.username}
                      </div>
                      <div className="text-sm text-gray-500">
                        Joined {formatDate(joinedDate)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs px-2 py-1 rounded-full border ${statusColor}`}>
                      {statusLabel}
                    </span>
                    
                    {isCreator && (
                      <button
                        type="button"
                        onClick={() => onRemove(participant.id)}
                        className="text-red-600 hover:text-red-900 text-sm font-medium"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
} 