import { randomUUID } from "crypto";
import { db } from "./db";
import { storage } from "./storage";
import { users, type User } from "@shared/schema";
import { eq } from "drizzle-orm";
import logger from "./logger";

/**
 * Ensures database is the source of truth for user IDs
 * 
 * This function will synchronize a user's ID between memory and database:
 * 1. If user exists in database, we use the database ID as the source of truth
 * 2. If user only exists in memory, we ensure the database entry uses the memory ID
 * 
 * @param email The user's email
 * @returns The synchronized user with consistent ID or undefined if sync failed
 */
export async function ensureUserIdConsistency(email: string) {
  logger.debug("Ensuring user ID consistency", { email });
  
  try {
    // Get the user from memory storage
    const memUser = await storage.getUserByEmail(email);
    
    // If no memory user, nothing to do
    if (!memUser) {
      logger.debug("No memory user found for consistency check", { email });
      return undefined;
    }
    
    try {
      // First, check if the user exists in the database (source of truth)
      const dbUsers = await db.select().from(users).where(eq(users.email, email)).limit(1);
      
      // User exists in database
      if (dbUsers.length > 0) {
        const dbUser = dbUsers[0];
        const dbUserId = dbUser.id as string;
        
        // If user exists in memory and has a different ID, synchronize
        if (memUser.id !== dbUserId) {
          logger.info("Synchronizing memory ID with database ID", {
            memoryId: memUser.id,
            databaseId: dbUserId,
            email
          });
          
          // Delete the user with the old ID from memory
          await storage.deleteUser(memUser.id);
          
          // Create a new user with the database ID in memory
          return await storage.createUser({
            ...memUser,
            id: dbUserId
          });
        } 
        // If user exists in memory with same ID, return the memory user
        else {
          return memUser;
        }
      } 
      // User doesn't exist in database
      else {
        // Create user in database with memory ID
        logger.info("Creating user in database with memory ID", {
          memoryId: memUser.id,
          email
        });
        
        try {
          await db.insert(users).values({
            id: memUser.id,
            email: memUser.email,
            firstName: memUser.firstName,
            lastName: memUser.lastName,
            username: memUser.username || memUser.email.split('@')[0],
            bio: memUser.bio,
            avatar: memUser.avatar,
            isAdmin: memUser.isAdmin,
            lastLogin: memUser.lastLogin,
            otpAttempts: memUser.otpAttempts || 0,
            otpSecret: memUser.otpSecret,
            otpExpiry: memUser.otpExpiry,
            otpLastRequest: memUser.otpLastRequest
          });
          
          return memUser;
        } catch (error: any) {
          if (error.code === '23505') { // Unique constraint violation
            // Try to fetch the user that caused the constraint violation
            const conflictUsers = await db.select().from(users).where(eq(users.email, email)).limit(1);
            if (conflictUsers.length > 0) {
              // Use the database ID as the source of truth
              const dbUserId = conflictUsers[0].id as string;
              
              // Delete the user with the old ID from memory
              await storage.deleteUser(memUser.id);
              
              // Create a new user with the database ID
              return await storage.createUser({
                ...memUser,
                id: dbUserId
              });
            }
          }
          
          // For other errors, log but continue with memory user
          logger.warn("Failed to create user in database, continuing with memory user", { 
            error, 
            email: memUser.email 
          });
          return memUser;
        }
      }
    } catch (dbError) {
      // Database connection error - fallback to memory user
      logger.warn("Database unavailable, falling back to memory storage", { 
        error: dbError, 
        email 
      });
      return memUser;
    }
  } catch (error) {
    logger.error("Error ensuring user ID consistency", { error, email });
    return undefined;
  }
}

/**
 * Generates a UUID that will be used consistently for a user
 * @returns A random UUID string
 */
export function generateUserId(): string {
  return randomUUID();
}

/**
 * Checks consistency of memory and database user IDs for all users
 * This can be used for admin operations or background consistency checks
 */
export async function checkAllUsersConsistency() {
  try {
    // Get all users from database
    const dbUsers = await db.select().from(users);
    
    // Get all users from memory
    const memUsers = await storage.getAllUsers();
    
    // Create maps for faster lookups
    const dbUsersByEmail = new Map(dbUsers.map((user: typeof users.$inferSelect) => [user.email, user]));
    const memUsersByEmail = new Map(memUsers.map(user => [user.email, user]));
    
    // Check each database user
    for (const dbUser of dbUsers) {
      const email = dbUser.email;
      const memUser = memUsersByEmail.get(email);
      
      // If user exists in memory with different ID, synchronize
      if (memUser && memUser.id !== dbUser.id) {
        await ensureUserIdConsistency(email);
      }
      // If user doesn't exist in memory, add to memory
      else if (!memUser) {
        await storage.createUser({
          id: dbUser.id as string,
          email: dbUser.email,
          firstName: dbUser.firstName,
          lastName: dbUser.lastName,
          username: dbUser.username || email.split('@')[0],
          bio: dbUser.bio,
          avatar: dbUser.avatar,
          isAdmin: !!dbUser.isAdmin,
          lastLogin: dbUser.lastLogin,
          otpSecret: dbUser.otpSecret,
          otpExpiry: dbUser.otpExpiry,
          otpAttempts: dbUser.otpAttempts || 0,
          otpLastRequest: dbUser.otpLastRequest
        });
      }
    }
    
    // Check each memory user
    for (const memUser of memUsers) {
      const email = memUser.email;
      const dbUser = dbUsersByEmail.get(email);
      
      // If user doesn't exist in database, add to database
      if (!dbUser) {
        await ensureUserIdConsistency(email);
      }
    }
    
    logger.info("User ID consistency check completed");
  } catch (error) {
    logger.error("Error during user ID consistency check", { error });
  }
} 