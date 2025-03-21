import { db } from '../db';
import { tournaments, notifications, tournamentParticipants, tournamentScores } from '../../../../shared/schema';
import { and, eq, lte, gt, isNull, not, sql, between } from 'drizzle-orm';
import { jobScheduler } from '../../../core/jobs/scheduler';
import { JobContext, JobResult } from '../../../core/jobs/types';
import logger from '../../../core/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * Reminder notification job
 * 
 * This job creates reminders for:
 * 1. Daily score submissions for active tournaments
 * 2. Upcoming tournament start notifications (1 day in advance)
 */
export const reminderNotificationJob = async (context: JobContext): Promise<JobResult> => {
  const startTimestamp = Date.now();
  const currentDate = new Date();
  
  try {
    logger.info('Running reminder notification job', {
      jobId: context.jobId,
      currentDate: currentDate.toISOString()
    });

    // Track metrics
    let dailyRemindersSent = 0;
    let upcomingTournamentRemindersSent = 0;
    
    // 1. Daily score submission reminders
    dailyRemindersSent = await sendDailyScoreReminders(currentDate);
    
    // 2. Upcoming tournament reminders (1 day in advance)
    upcomingTournamentRemindersSent = await sendUpcomingTournamentReminders(currentDate);
    
    const executionTimeMs = Date.now() - startTimestamp;
    logger.info('Reminder notification job completed', {
      executionTimeMs,
      dailyRemindersSent,
      upcomingTournamentRemindersSent
    });
    
    return {
      success: true,
      executionTimeMs,
      data: {
        dailyRemindersSent,
        upcomingTournamentRemindersSent
      }
    };
  } catch (error) {
    const executionTimeMs = Date.now() - startTimestamp;
    logger.error('Error in reminder notification job', { error, executionTimeMs });
    
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
      executionTimeMs
    };
  }
};

/**
 * Send daily score submission reminders for active tournaments
 */
async function sendDailyScoreReminders(currentDate: Date): Promise<number> {
  try {
    // Get active tournaments
    const activeTournaments = await db.select()
      .from(tournaments)
      .where(eq(tournaments.status, 'in_progress'));
    
    let remindersSent = 0;
    
    for (const tournament of activeTournaments) {
      try {
        // Calculate current tournament day (0-indexed)
        const startDate = new Date(tournament.startDate);
        const diffTime = Math.abs(currentDate.getTime() - startDate.getTime());
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        logger.debug('Tournament day calculation', {
          tournamentId: tournament.id,
          startDate: startDate.toISOString(),
          currentDate: currentDate.toISOString(),
          diffTime,
          diffDays
        });
        
        // Only send reminders if within tournament duration
        if (diffDays < tournament.durationDays) {
          const currentDay = diffDays + 1; // 1-indexed for user display
          
          // Get participants who haven't submitted a score for the current day
          const participants = await db.select({
            userId: tournamentParticipants.userId
          })
          .from(tournamentParticipants)
          .where(and(
            eq(tournamentParticipants.tournamentId, tournament.id),
            eq(tournamentParticipants.status, 'joined')
          ));
          
          // For each participant, check if they've submitted a score today
          for (const participant of participants) {
            // Get the day for which we should check scores
            // Since tournament days are 0-indexed, with day 0 being the start date,
            // if the tournament started yesterday (diffDays = 1), we should look for day 0 scores
            const dayToCheck = Math.max(0, diffDays - 1);
            
            logger.debug('Checking for scores', {
              tournamentId: tournament.id,
              userId: participant.userId,
              dayToCheck,
              diffDays
            });
            
            const todayScore = await db.select()
              .from(tournamentScores)
              .where(and(
                eq(tournamentScores.tournamentId, tournament.id),
                eq(tournamentScores.userId, participant.userId),
                eq(tournamentScores.day, dayToCheck)
              ))
              .limit(1);
            
            // Check if there are any existing reminders for today to avoid duplicates
            const existingReminders = await db.select()
              .from(notifications)
              .where(and(
                eq(notifications.tournamentId, tournament.id),
                eq(notifications.userId, participant.userId),
                eq(notifications.type, 'reminder'),
                sql`DATE(${notifications.createdAt}) = DATE(${currentDate})`
              ))
              .limit(1);
              
            // If no score submitted today and no reminder yet, send a reminder
            if (todayScore.length === 0 && existingReminders.length === 0) {
              await db.insert(notifications)
                .values({
                  id: uuidv4(),
                  userId: participant.userId,
                  tournamentId: tournament.id,
                  type: 'reminder',
                  message: `Don't forget to submit your score for Day ${currentDay} of "${tournament.name}"!`,
                  read: false
                })
                .execute();
              
              remindersSent++;
              
              logger.info('Sent score submission reminder', {
                tournamentId: tournament.id,
                userId: participant.userId,
                day: dayToCheck,
                currentDay
              });
            } else {
              logger.debug('Skipped sending reminder', {
                tournamentId: tournament.id,
                userId: participant.userId,
                day: dayToCheck,
                hasScore: todayScore.length > 0,
                hasReminder: existingReminders.length > 0
              });
            }
          }
        }
      } catch (error) {
        logger.error(`Error sending daily reminders for tournament ${tournament.id}`, { error });
      }
    }
    
    return remindersSent;
  } catch (error) {
    logger.error('Error sending daily score reminders', { error });
    return 0;
  }
}

/**
 * Send reminders for tournaments starting soon (1 day in advance)
 */
async function sendUpcomingTournamentReminders(currentDate: Date): Promise<number> {
  try {
    // Calculate the date for tomorrow
    const tomorrowDate = new Date(currentDate);
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    
    // Reset hours to check for the whole day
    tomorrowDate.setHours(0, 0, 0, 0);
    const afterTomorrow = new Date(tomorrowDate);
    afterTomorrow.setDate(afterTomorrow.getDate() + 1);
    
    // Find tournaments starting tomorrow
    const upcomingTournaments = await db.select()
      .from(tournaments)
      .where(and(
        eq(tournaments.status, 'pending'),
        sql`DATE(${tournaments.startDate}) = DATE(${tomorrowDate})`
      ));
    
    let remindersSent = 0;
    
    for (const tournament of upcomingTournaments) {
      try {
        // Get all participants
        const participants = await db.select({
          userId: tournamentParticipants.userId
        })
        .from(tournamentParticipants)
        .where(and(
          eq(tournamentParticipants.tournamentId, tournament.id),
          eq(tournamentParticipants.status, 'joined')
        ));
        
        // Include tournament creator
        const recipientIds = [
          ...participants.map(p => p.userId),
          tournament.creatorId
        ];
        
        // Remove duplicates
        const uniqueRecipientIds = Array.from(new Set(recipientIds));
        
        // Check for existing reminders to avoid duplicates
        for (const userId of uniqueRecipientIds) {
          // Check if we've already sent a reminder today
          const existingReminders = await db.select()
            .from(notifications)
            .where(and(
              eq(notifications.tournamentId, tournament.id),
              eq(notifications.userId, userId),
              eq(notifications.type, 'tournament_start'),
              sql`DATE(${notifications.createdAt}) = DATE(${currentDate})`
            ))
            .limit(1);
            
          // Only send reminder if we haven't already sent one today
          if (existingReminders.length === 0) {
            await db.insert(notifications)
              .values({
                id: uuidv4(),
                userId,
                tournamentId: tournament.id,
                type: 'tournament_start',
                message: `Tournament "${tournament.name}" will start tomorrow!`,
                read: false
              })
              .execute();
            
            remindersSent++;
            
            logger.info('Sent upcoming tournament reminder', {
              tournamentId: tournament.id,
              userId,
              startDate: tournament.startDate
            });
          } else {
            logger.debug('Skipped sending upcoming tournament reminder (already sent today)', {
              tournamentId: tournament.id,
              userId
            });
          }
        }
      } catch (error) {
        logger.error(`Error sending upcoming tournament reminders for ${tournament.id}`, { error });
      }
    }
    
    return remindersSent;
  } catch (error) {
    logger.error('Error sending upcoming tournament reminders', { error });
    return 0;
  }
}

// Register the job with the scheduler
export function registerReminderNotificationJob(): void {
  jobScheduler.registerJob(
    {
      id: 'reminder-notification',
      name: 'Tournament Reminder Notifications',
      description: 'Sends reminders for score submissions and upcoming tournaments',
      schedule: '0 12 * * *', // Run daily at noon UTC
      enabled: true,
      retryStrategy: {
        maxRetries: 3,
        initialDelayMs: 60000, // 1 minute
        backoffFactor: 2,
        maxDelayMs: 300000 // 5 minutes
      }
    },
    reminderNotificationJob
  );
} 