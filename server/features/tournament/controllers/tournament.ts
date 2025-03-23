import { Request, Response } from 'express';
import logger from '../../../core/logger';
import { tournamentService } from '../services/tournament';
import { validateCreateTournament, validateUpdateTournament } from '../validators/tournament';
import { db } from '../db';
import { users } from '../../../../shared/schema';
import { eq } from 'drizzle-orm';
import { storage } from '../../../core/storage';

/**
 * Controller for tournament-related operations
 */
export const tournamentController = {
  /**
   * Get a list of tournaments with pagination
   */
  getTournamentsHandler: async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string || '1', 10);
      const pageSize = parseInt(req.query.pageSize as string || '10', 10);
      const userId = req.session.userId;
      const status = req.query.status as string | undefined;

      // Log request parameters for debugging
      logger.info('Getting tournaments', { 
        page, 
        pageSize, 
        userId, 
        status, 
        query: req.query 
      });

      try {
        const tournaments = await tournamentService.getTournaments(page, pageSize, userId, status as any);
        
        // Log response for debugging
        logger.info('Retrieved tournaments', { 
          count: tournaments.tournaments.length,
          total: tournaments.total
        });
        
        return res.json(tournaments);
      } catch (initialError: any) {
        // If this is a foreign key constraint violation, it means the user doesn't exist in the database
        if (initialError.code === '23503' && userId) {
          try {
            // Get user from memory storage to find email
            const memUser = await storage.getUserById(userId);
            if (!memUser) {
              return res.status(401).json({ error: 'User not found' });
            }
            
            // Find user in database by email
            const dbUser = await db.select().from(users).where(eq(users.email, memUser.email)).limit(1);
            if (dbUser.length > 0) {
              // Update session with the correct database ID
              logger.info('Updating session with database user ID', {
                oldId: userId,
                newId: dbUser[0].id,
                email: memUser.email
              });
              
              // Update the session
              req.session.userId = dbUser[0].id;
              
              // Now try again with the correct ID
              const tournaments = await tournamentService.getTournaments(
                page, 
                pageSize, 
                dbUser[0].id, 
                status as any
              );
              
              logger.info('Retrieved tournaments after session update', { 
                count: tournaments.tournaments.length,
                total: tournaments.total
              });
              
              return res.json(tournaments);
            }
          } catch (retryError) {
            logger.error('Failed to handle user ID mismatch', { error: retryError });
            // Fall through to the general error handler
          }
        }
        
        // Handle other errors
        logger.error('Error getting tournaments', { error: initialError });
        res.status(500).json({
          error: 'Failed to get tournaments',
          details: initialError instanceof Error ? initialError.message : String(initialError)
        });
      }
    } catch (error) {
      logger.error('Error getting tournaments', { error });
      res.status(500).json({
        error: 'Failed to get tournaments',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  },

  /**
   * Get a tournament by ID
   */
  getTournamentByIdHandler: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // Get tournament from actual database
      const tournament = await tournamentService.getTournamentById(id);
      
      if (!tournament) {
        return res.status(404).json({ error: 'Tournament not found' });
      }
      
      res.json(tournament);
    } catch (error) {
      logger.error('Error getting tournament', { error, tournamentId: req.params.id });
      res.status(500).json({
        error: 'Failed to get tournament',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  },

  /**
   * Create a new tournament
   */
  createTournamentHandler: async (req: Request, res: Response) => {
    try {
      // Get user ID from session
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Validate input
      const validationResult = validateCreateTournament(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Invalid tournament data', 
          details: validationResult.error.format()
        });
      }

      // First check if the user exists in the database by ID
      let dbUser = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      
      // User doesn't exist in the database, get from memory and check by email
      if (dbUser.length === 0) {
        // Get user from memory
        const memUser = await storage.getUserById(userId);
        if (!memUser) {
          return res.status(404).json({ error: 'User not found' });
        }
        
        // Check if a user with the same email exists in the database
        const userByEmail = await db.select().from(users).where(eq(users.email, memUser.email)).limit(1);
        
        if (userByEmail.length > 0) {
          // Use the existing database user instead of creating a new one
          logger.info('Using existing database user with same email', {
            memoryId: userId,
            dbId: userByEmail[0].id,
            email: memUser.email
          });
          
          // Use the existing user's ID for creating the tournament
          dbUser = userByEmail;
        } else {
          // No user with this email exists in the database, create one
          logger.info('Creating user in database before tournament creation', { 
            userId, 
            email: memUser.email 
          });
          
          try {
            // Insert the user into the database
            const insertedUser = await db.insert(users).values({
              id: userId,
              email: memUser.email,
              firstName: memUser.firstName,
              lastName: memUser.lastName,
              username: memUser.username || memUser.email.split('@')[0],
              bio: memUser.bio,
              avatar: memUser.avatar,
              isAdmin: memUser.isAdmin,
              lastLogin: memUser.lastLogin,
              otpAttempts: 0,
              otpSecret: null,
              otpExpiry: null,
              otpLastRequest: null
            }).returning();
            
            if (insertedUser.length > 0) {
              dbUser = insertedUser;
            }
          } catch (insertError: any) {
            // Handle unique constraint violation - one more attempt to get user by email
            if (insertError.code === '23505' && insertError.constraint === 'users_email_unique') {
              const retryUserByEmail = await db.select().from(users).where(eq(users.email, memUser.email)).limit(1);
              
              if (retryUserByEmail.length > 0) {
                logger.info('Using existing user after constraint failure', {
                  memoryId: userId,
                  dbId: retryUserByEmail[0].id,
                  email: memUser.email
                });
                dbUser = retryUserByEmail;
              } else {
                throw insertError;
              }
            } else {
              throw insertError;
            }
          }
        }
      }
      
      // At this point dbUser should contain the user to use for tournament creation
      // Get the final user ID to use
      const finalUserId = dbUser[0]?.id || userId;

      // Create tournament with the database user ID
      const tournament = await tournamentService.createTournament(validationResult.data, finalUserId);
      
      // Return the newly created tournament
      res.status(201).json(tournament);
    } catch (error) {
      logger.error('Error creating tournament', { error, tournamentData: req.body });
      
      res.status(500).json({
        error: 'Failed to create tournament',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  },

  /**
   * Update an existing tournament
   */
  updateTournamentHandler: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const validationResult = validateUpdateTournament(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({
          error: 'Invalid update data',
          details: validationResult.error.format()
        });
      }
      
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      const tournament = await tournamentService.updateTournament(id, validationResult.data, userId);
      res.json(tournament);
    } catch (error) {
      logger.error('Error updating tournament', { error, tournamentId: req.params.id });
      
      if (error instanceof Error && error.message.includes('Unauthorized')) {
        return res.status(403).json({ error: error.message });
      }
      
      if (error instanceof Error && error.message.includes('not found')) {
        return res.status(404).json({ error: error.message });
      }
      
      res.status(500).json({
        error: 'Failed to update tournament',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  },

  /**
   * Cancel a tournament
   */
  cancelTournamentHandler: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.session.userId;
      
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      const tournament = await tournamentService.cancelTournament(id, userId);
      res.json(tournament);
    } catch (error) {
      logger.error('Error cancelling tournament', { error, tournamentId: req.params.id });
      
      if (error instanceof Error && error.message.includes('Unauthorized')) {
        return res.status(403).json({ error: error.message });
      }
      
      if (error instanceof Error && error.message.includes('not found')) {
        return res.status(404).json({ error: error.message });
      }
      
      res.status(500).json({
        error: 'Failed to cancel tournament',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  }
}; 