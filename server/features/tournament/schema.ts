/**
 * Tournament Schema Re-exports
 * 
 * This file re-exports the tournament schema from the shared schema file
 * to provide a consistent import path for the tournament feature.
 */

import { 
  tournamentStatusEnum, 
  tournaments, 
  tournamentParticipants,
  tournamentScores,
  notifications
} from '../../../shared/schema';

export {
  tournamentStatusEnum,
  tournaments,
  tournamentParticipants,
  tournamentScores,
  notifications
};
