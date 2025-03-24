import React from 'react';

// Import types with fallback for testing
type StatusType = 'pending' | 'in_progress' | 'completed' | 'cancelled';
let Status: StatusType;
try {
  const types = require('../../types');
  Status = types.TournamentStatus;
} catch (e) {
  // Fallback for testing - we'll just use 'pending' as default
  Status = 'pending';
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

interface TournamentStatusProps {
  status: StatusType;
  className?: string;
  size?: 'sm' | 'md';
}

/**
 * TournamentStatus component displays a visual indicator of a tournament's status
 */
export function TournamentStatus({ 
  status, 
  className = '', 
  size = 'md' 
}: TournamentStatusProps) {
  const statusColor = STATUS_COLORS[status];
  const statusLabel = STATUS_LABELS[status];
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1'
  };
  
  return (
    <span 
      className={`rounded-full border ${statusColor} ${sizeClasses[size]} inline-block ${className}`}
      aria-label={`Tournament status: ${statusLabel}`}
    >
      {statusLabel}
    </span>
  );
} 