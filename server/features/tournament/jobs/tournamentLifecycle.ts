import { db } from '../db';
import { tournaments, notifications, tournamentParticipants } from '../../../../shared/schema';
import { and, eq, lte, gt } from 'drizzle-orm';
import { jobScheduler } from '../../../core/jobs/scheduler';
import { JobContext, JobResult } from '../../../core/jobs/types';
import logger from '../../../core/logger';
import { v4 as uuidv4 } from 'uuid';
import { NotificationType } from '../types';

/**
 * Tournament lifecycle job to manage tournament status transitions
 * 
 * This job runs on a schedule and handles the following transitions:
 * - 'pending' → 'in_progress' (when current time >= start date)
 * - 'in_progress' → 'completed' (when current time >= start date + duration)
 */
export const tournamentLifecycleJob = async (context: JobContext): Promise<JobResult> => {
  const startTimestamp = Date.now();
  const currentDate = new Date();
  
  try {
    logger.info('Running tournament lifecycle job', {
      jobId: context.jobId,
      currentDate: currentDate.toISOString()
    });
    
    // Find pending tournaments that should start
    const pendingTournaments = await db.select()
      .from(tournaments)
      .where(and(
        eq(tournaments.status, 'pending'),
        lte(tournaments.startDate, currentDate)
      ));
    
    // Start pending tournaments
    for (const tournament of pendingTournaments) {
      try {
        // Update tournament status to 'in_progress'
        await db.update(tournaments)
          .set({ 
            status: 'in_progress',
            updatedAt: currentDate
          })
          .where(eq(tournaments.id, tournament.id))
          .execute();
        
        logger.info(`Tournament started: ${tournament.name} (${tournament.id})`);
        
        // Create tournament_start notifications for participants
        await createTournamentNotifications(
          tournament.id,
          'tournament_start',
          `Tournament "${tournament.name}" has started!`
        );
      } catch (error) {
        logger.error(`Error starting tournament ${tournament.id}`, { error });
      }
    }
    
    // Find in-progress tournaments that should be completed
    const activeTournaments = await db.select()
      .from(tournaments)
      .where(eq(tournaments.status, 'in_progress'));
    
    // Complete tournaments that have reached their end date
    for (const tournament of activeTournaments) {
      try {
        // Calculate end date (start date + duration in days)
        const endDate = new Date(tournament.startDate);
        endDate.setDate(endDate.getDate() + tournament.durationDays);
        
        // Check if tournament should be completed
        if (currentDate >= endDate) {
          // Update tournament status to 'completed'
          await db.update(tournaments)
            .set({ 
              status: 'completed',
              updatedAt: currentDate
            })
            .where(eq(tournaments.id, tournament.id))
            .execute();
          
          logger.info(`Tournament completed: ${tournament.name} (${tournament.id})`);
          
          // Create tournament_end notifications for participants
          await createTournamentNotifications(
            tournament.id,
            'tournament_end',
            `Tournament "${tournament.name}" has ended!`
          );
        }
      } catch (error) {
        logger.error(`Error checking/completing tournament ${tournament.id}`, { error });
      }
    }
    
    const executionTimeMs = Date.now() - startTimestamp;
    logger.info('Tournament lifecycle job completed', {
      executionTimeMs,
      pendingTournamentsStarted: pendingTournaments.length,
    });
    
    return {
      success: true,
      executionTimeMs,
      data: {
        pendingTournamentsStarted: pendingTournaments.length,
        completedTournaments: activeTournaments.filter(t => {
          const endDate = new Date(t.startDate);
          endDate.setDate(endDate.getDate() + t.durationDays);
          return currentDate >= endDate;
        }).length
      }
    };
  } catch (error) {
    const executionTimeMs = Date.now() - startTimestamp;
    logger.error('Error in tournament lifecycle job', { error, executionTimeMs });
    
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
      executionTimeMs
    };
  }
};

/**
 * Create notifications for all participants of a tournament
 */
async function createTournamentNotifications(
  tournamentId: string,
  type: NotificationType,
  message: string
): Promise<void> {
  try {
    // Get tournament participants
    const participantIds = await db.select({
      userId: tournamentParticipants.userId
    })
    .from(tournamentParticipants)
    .where(and(
      eq(tournamentParticipants.tournamentId, tournamentId),
      eq(tournamentParticipants.status, 'joined')
    ));
    
    // Get tournament creator
    const tournamentData = await db.select({
      creatorId: tournaments.creatorId
    })
    .from(tournaments)
    .where(eq(tournaments.id, tournamentId))
    .limit(1);
    
    if (tournamentData.length === 0) {
      logger.error(`Tournament not found: ${tournamentId}`);
      return;
    }
    
    // Include creator in notification recipients if not already included
    const creatorId = tournamentData[0].creatorId;
    const allRecipientIds = [
      ...participantIds.map(p => p.userId),
      creatorId
    ];
    
    // Remove duplicates
    const uniqueRecipientIds = Array.from(new Set(allRecipientIds));
    
    // Create notifications for all recipients
    for (const userId of uniqueRecipientIds) {
      await db.insert(notifications)
        .values({
          id: uuidv4(),
          userId,
          tournamentId,
          type,
          message,
          read: false
        })
        .execute();
    }
    
    logger.info(`Created ${type} notifications for tournament ${tournamentId}`, {
      recipientCount: uniqueRecipientIds.length
    });
  } catch (error) {
    logger.error(`Error creating tournament notifications for ${tournamentId}`, { error });
    throw error;
  }
}

// Register the job with the scheduler
export function registerTournamentLifecycleJob(): void {
  jobScheduler.registerJob(
    {
      id: 'tournament-lifecycle',
      name: 'Tournament Lifecycle Manager',
      description: 'Manages tournament status transitions (start/end)',
      schedule: '0 * * * *', // Run every hour
      enabled: true,
      retryStrategy: {
        maxRetries: 3,
        initialDelayMs: 60000, // 1 minute
        backoffFactor: 2,
        maxDelayMs: 300000 // 5 minutes
      }
    },
    tournamentLifecycleJob
  );
} 