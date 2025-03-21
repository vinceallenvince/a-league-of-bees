import { jobScheduler } from '../../../core/jobs/scheduler';
import { registerTournamentLifecycleJob } from './tournamentLifecycle';
import { registerReminderNotificationJob } from './reminderNotification';
import logger from '../../../core/logger';

/**
 * Initialize all tournament-related background jobs
 */
export function initializeTournamentJobs(): void {
  logger.info('Initializing tournament background jobs');
  
  // Initialize the job scheduler
  jobScheduler.initialize();
  
  // Register all jobs
  registerTournamentLifecycleJob();
  registerReminderNotificationJob();
  
  logger.info('Tournament background jobs initialized');
}

export default {
  initializeTournamentJobs
}; 