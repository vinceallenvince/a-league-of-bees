import React from 'react';
import { Link } from 'wouter';

// Import types with fallback for testing
type StatusType = 'pending' | 'in_progress' | 'completed' | 'cancelled';

// Define Tournament type locally for testing
interface TournamentType {
  id: string;
  name: string;
  description?: string;
  durationDays: number;
  startDate: string;
  status: StatusType;
  requiresVerification?: boolean;
  timezone?: string;
  creatorId: string;
  creatorUsername?: string;
  participantCount: number;
}

// Import Tournament type with fallback - no need to assign a value
let Tournament: any;
try {
  const types = require('../../types');
  Tournament = types.Tournament;
} catch (e) {
  // Fallback not needed as we've defined TournamentType above
}

// Import formatDate with fallback
let formatDate: (date: Date, options?: Intl.DateTimeFormatOptions) => string;
try {
  const dateUtils = require('@/lib/date-utils');
  formatDate = dateUtils.formatDate;
} catch (e) {
  // Fallback for testing
  formatDate = (date: Date) => date.toLocaleDateString();
}

/**
 * Status badge colors based on tournament status
 */
const STATUS_COLORS: Record<StatusType, string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  in_progress: 'bg-green-100 text-green-800 border-green-200',
  completed: 'bg-blue-100 text-blue-800 border-blue-200',
  cancelled: 'bg-gray-100 text-gray-800 border-gray-200'
};

/**
 * Status display names
 */
const STATUS_LABELS: Record<StatusType, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled'
};

interface TournamentCardProps {
  tournament: TournamentType;
  onClick?: (id: string) => void;
}

/**
 * TournamentCard component displays a summary of a tournament
 */
export function TournamentCard({ tournament, onClick }: TournamentCardProps) {
  const {
    id,
    name,
    description,
    durationDays,
    startDate,
    status,
    creatorUsername,
    participantCount
  } = tournament;
  
  const formattedStartDate = formatDate(new Date(startDate));
  const statusColor = STATUS_COLORS[status];
  const statusLabel = STATUS_LABELS[status];
  
  const handleClick = () => {
    if (onClick) {
      onClick(id);
    }
  };
  
  return (
    <div 
      className="border rounded-md shadow-sm p-4 mb-4 hover:shadow-md transition-shadow cursor-pointer bg-white"
      onClick={handleClick}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold">{name}</h3>
        <span className={`text-xs px-2 py-1 rounded-full border ${statusColor}`}>
          {statusLabel}
        </span>
      </div>
      
      {description && (
        <p className="text-sm text-gray-600 mb-3">{description}</p>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
        <div className="flex items-center">
          <span className="text-gray-500 mr-1">Start Date:</span>
          {formattedStartDate}
        </div>
        
        <div className="flex items-center">
          <span className="text-gray-500 mr-1">Duration:</span>
          {durationDays} days
        </div>
        
        <div className="flex items-center">
          <span className="text-gray-500 mr-1">Created by:</span>
          {creatorUsername}
        </div>
        
        <div className="flex items-center">
          <span className="text-gray-500 mr-1">Participants:</span>
          {participantCount}
        </div>
      </div>
      
      <div className="mt-3 text-right">
        <Link href={`/tournaments/${id}`}>
          <a className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            View Details →
          </a>
        </Link>
      </div>
    </div>
  );
} 