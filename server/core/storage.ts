import { users, adminApprovals, type User, type InsertUser } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { randomBytes } from "crypto";
import logger from "./logger";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { generateUserId } from "./auth-utils";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>; // For compatibility with tournament service
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: Partial<User>): Promise<User>;
  updateUser(id: string, user: Partial<User>): Promise<User>;
  deleteUser(id: string): Promise<void>;
  getAllUsers(): Promise<User[]>;
  setOtp(email: string, otp: string): Promise<void>;
  clearOtp(email: string): Promise<void>;
  setMagicLinkToken(email: string, token: string): Promise<void>;
  verifyMagicLinkToken(email: string, token: string): Promise<boolean>;
  clearMagicLinkToken(email: string): Promise<void>;
  updateLastLogin(id: string): Promise<void>;
  requestAdminRole(userId: string): Promise<void>;
  approveAdminRole(userId: string, approverId: string): Promise<void>;
  sessionStore: session.Store;
  verifyOtp(email: string, otp: string): Promise<{success: boolean, message?: string, remainingAttempts?: number}>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private currentId: number;
  private magicLinkTokens: Map<string, { token: string, expiry: Date }>;
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.currentId = 1;
    this.magicLinkTokens = new Map();
    
    // Use a simple session store for testing to avoid unref issues
    if (process.env.NODE_ENV === 'test') {
      this.sessionStore = {
        get: jest.fn((sid, cb) => cb(null, null)),
        set: jest.fn((sid, session, cb) => cb?.(null)),
        destroy: jest.fn((sid, cb) => cb?.(null)),
        touch: jest.fn((sid, session, cb) => cb?.(null)),
        all: jest.fn((cb) => cb(null, {})),
        clear: jest.fn((cb) => cb?.(null)),
        length: jest.fn((cb) => cb(null, 0)),
        on: jest.fn(),
        once: jest.fn(),
        emit: jest.fn(),
        removeListener: jest.fn(),
        removeAllListeners: jest.fn()
      } as any;
    } else {
      this.sessionStore = new MemoryStore({
        checkPeriod: 86400000,
      });
    }
    
    logger.info("Memory storage initialized");
  }

  async getUser(id: string): Promise<User | undefined> {
    logger.debug("Getting user by ID", { userId: id });
    return this.users.get(id);
  }
  
  // For compatibility with tournament service
  async getUserById(id: string): Promise<User | undefined> {
    return this.getUser(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    logger.debug("Getting user by email", { email });
    
    // First check memory storage
    const memoryUser = Array.from(this.users.values()).find(user => user.email === email);
    
    if (memoryUser) {
      return memoryUser;
    }
    
    // If not in memory, try to find in the database
    try {
      const dbUsers = await db.select().from(users).where(eq(users.email, email)).limit(1);
      
      if (dbUsers.length > 0) {
        const dbUser = dbUsers[0];
        logger.info("Found user in database but not in memory, adding to memory", { 
          userId: dbUser.id, 
          email 
        });
        
        // Create the user in memory storage with the same ID
        const newMemoryUser = {
          id: dbUser.id as string,
          email: dbUser.email,
          firstName: dbUser.firstName,
          lastName: dbUser.lastName,
          username: dbUser.username || null,
          bio: dbUser.bio,
          avatar: dbUser.avatar,
          isAdmin: !!dbUser.isAdmin,
          lastLogin: dbUser.lastLogin,
          otpSecret: dbUser.otpSecret,
          otpExpiry: dbUser.otpExpiry,
          otpAttempts: dbUser.otpAttempts || 0,
          otpLastRequest: dbUser.otpLastRequest
        };
        
        this.users.set(dbUser.id as string, newMemoryUser);
        return newMemoryUser;
      }
    } catch (error) {
      logger.error("Error searching database for user by email", { error, email });
      // Continue execution to return undefined
    }
    
    return undefined;
  }

  async createUser(user: Partial<User>): Promise<User> {
    logger.debug("Creating user", { email: user.email });

    if (!user.email) {
      throw new Error("Email is required");
    }

    // Check if a user with this email already exists in memory
    const existingUser = await this.getUserByEmail(user.email);
    if (existingUser) {
      logger.info("User already exists with this email", { 
        userId: existingUser.id, 
        email: user.email 
      });
      
      // If an ID was provided and it's different from the existing user,
      // this might be a sync operation where we want to update the ID
      if (user.id && user.id !== existingUser.id) {
        logger.info("Updating existing user with new ID", { 
          oldId: existingUser.id, 
          newId: user.id, 
          email: user.email 
        });
        
        // Delete the old user and create with new ID
        await this.deleteUser(existingUser.id);
        
        // Continue with creation below using the provided ID
      } else {
        return existingUser;
      }
    }

    // Use the provided ID or generate a new UUID using our utility function
    const userId = user.id || generateUserId();
    const isFirstUser = this.users.size === 0;
    
    const newUser = {
      id: userId,
      email: user.email!,
      firstName: user.firstName || null,
      lastName: user.lastName || null,
      username: user.username || null,
      bio: user.bio || null,
      avatar: user.avatar || null,
      isAdmin: user.isAdmin !== undefined ? user.isAdmin : isFirstUser, // First user is automatically an admin
      lastLogin: user.lastLogin || null,
      otpSecret: user.otpSecret || null,
      otpExpiry: user.otpExpiry || null,
      otpAttempts: user.otpAttempts || 0,
      otpLastRequest: user.otpLastRequest || null,
    };

    this.users.set(userId, newUser);
    
    // Also check if the user exists in the database
    try {
      // Check if user already exists in the database
      const dbUser = await db.select().from(users).where(eq(users.email, newUser.email)).limit(1);
      
      if (dbUser.length === 0) {
        // Only insert if the user doesn't exist in the database
        logger.info("Creating user in database during user creation", { 
          userId: newUser.id, 
          email: newUser.email 
        });
        
        try {
          await db.insert(users).values({
            id: newUser.id,
            email: newUser.email,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            username: newUser.username || newUser.email.split('@')[0], // Ensure username is never null
            bio: newUser.bio,
            avatar: newUser.avatar,
            isAdmin: newUser.isAdmin,
            lastLogin: newUser.lastLogin,
            otpAttempts: newUser.otpAttempts,
            otpSecret: newUser.otpSecret,
            otpExpiry: newUser.otpExpiry,
            otpLastRequest: newUser.otpLastRequest
          });
          logger.info("User created in database", { userId: newUser.id, email: newUser.email });
        } catch (insertError: any) {
          if (insertError.code === '23505') { // Unique constraint violation
            logger.warn("User creation in database failed: email already exists", { 
              email: newUser.email,
              constraint: insertError.constraint,
              detail: insertError.detail 
            });
            
            // Try to get the existing user from database to sync IDs
            const existingDbUsers = await db.select().from(users).where(eq(users.email, newUser.email)).limit(1);
            if (existingDbUsers.length > 0) {
              const existingDbUser = existingDbUsers[0];
              logger.info("Found existing user in database with different ID", {
                memoryId: newUser.id,
                databaseId: existingDbUser.id,
                email: newUser.email
              });
              
              // If the IDs don't match, update memory ID to match database
              if (existingDbUser.id !== newUser.id) {
                // Update the memory user's ID to match the database
                const updatedUser = {...newUser, id: existingDbUser.id as string};
                this.users.delete(newUser.id);
                this.users.set(existingDbUser.id as string, updatedUser);
                logger.info("Updated memory user to match database ID", {
                  oldId: newUser.id,
                  newId: existingDbUser.id,
                  email: newUser.email
                });
                return updatedUser;
              }
            }
          } else {
            logger.error("Failed to create user in database", { 
              error: insertError, 
              email: newUser.email,
              code: insertError.code,
              detail: insertError.detail || 'Unknown error' 
            });
          }
          // We don't throw an error here to ensure the auth flow still works with memory storage
        }
      } else {
        const dbUserId = dbUser[0].id as string;
        logger.info("User already exists in database", { 
          userId: dbUserId, 
          email: newUser.email 
        });
        
        // If the IDs don't match, update memory ID to match database
        if (dbUserId !== newUser.id) {
          logger.info("Synchronizing memory ID with database ID", {
            memoryId: newUser.id,
            databaseId: dbUserId,
            email: newUser.email
          });
          
          // Update the memory user's ID to match the database
          const updatedUser = {...newUser, id: dbUserId};
          this.users.delete(newUser.id);
          this.users.set(dbUserId, updatedUser);
          logger.info("Updated memory user to match database ID", {
            oldId: newUser.id,
            newId: dbUserId,
            email: newUser.email
          });
          return updatedUser;
        }
      }
    } catch (error) {
      logger.error("Failed to check/create user in database", { error, email: newUser.email });
      // We don't throw an error here to ensure the auth flow still works
    }
    
    return newUser;
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    const user = await this.getUser(id);
    if (!user) throw new Error("User not found");

    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: string): Promise<void> {
    this.users.delete(id);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async clearUsers(): Promise<void> {
    this.users = new Map();
  }

  async setOtp(email: string, otp: string): Promise<void> {
    const user = await this.getUserByEmail(email);
    if (!user) {
      logger.warn("Attempted to set OTP for non-existent user", { email });
      return;
    }

    // Set OTP with 30 minute expiry
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 30);

    user.otpSecret = otp;
    user.otpExpiry = expiry;
    user.otpAttempts = 0;
    user.otpLastRequest = new Date();

    logger.debug("OTP set for user", { 
      userId: user.id, 
      email, 
      expiry: expiry.toISOString() 
    });
  }

  async verifyOtp(email: string, otp: string): Promise<{success: boolean, message?: string, remainingAttempts?: number}> {
    const user = await this.getUserByEmail(email);
    if (!user) {
      logger.warn("OTP verification attempted for non-existent user", { email });
      return { success: false, message: "Invalid email" };
    }

    if (!user.otpSecret || !user.otpExpiry) {
      logger.warn("OTP verification attempted but no OTP was requested", { 
        userId: user.id, 
        email 
      });
      return { success: false, message: "No OTP requested" };
    }
    
    if (user.otpExpiry < new Date()) {
      logger.warn("OTP verification attempted with expired OTP", { 
        userId: user.id, 
        email, 
        expiry: user.otpExpiry.toISOString() 
      });
      return { success: false, message: "OTP has expired" };
    }

    // Increment attempts
    user.otpAttempts += 1;
    
    // Check max attempts (5)
    const maxAttempts = 5;
    const remainingAttempts = maxAttempts - user.otpAttempts;
    
    if (user.otpAttempts >= maxAttempts) {
      logger.warn("OTP verification max attempts reached", { 
        userId: user.id, 
        email, 
        attempts: user.otpAttempts 
      });
      return { 
        success: false, 
        message: "Maximum verification attempts reached", 
        remainingAttempts: 0 
      };
    }

    if (user.otpSecret !== otp) {
      logger.warn("OTP verification failed - invalid code", { 
        userId: user.id, 
        email, 
        attempts: user.otpAttempts,
        remainingAttempts
      });
      return { 
        success: false, 
        message: "Invalid OTP code", 
        remainingAttempts 
      };
    }

    // Success - clear OTP
    await this.clearOtp(email);
    logger.info("OTP verification successful", { userId: user.id, email });
    return { success: true };
  }

  async clearOtp(email: string): Promise<void> {
    const user = await this.getUserByEmail(email);
    if (!user) {
      logger.warn("Attempted to clear OTP for non-existent user", { email });
      return;
    }

    user.otpSecret = null;
    user.otpExpiry = null;
    logger.debug("OTP cleared for user", { userId: user.id, email });
  }

  async updateLastLogin(id: string): Promise<void> {
    const user = await this.getUser(id);
    if (!user) {
      logger.warn("Attempted to update last login for non-existent user", { userId: id });
      return;
    }

    user.lastLogin = new Date();
    logger.debug("Updated last login timestamp", { userId: id, timestamp: user.lastLogin.toISOString() });
  }

  async requestAdminRole(userId: string): Promise<void> {
    const user = await this.getUser(userId);
    if (!user) {
      logger.warn("Admin role requested for non-existent user", { userId });
      throw new Error("User not found");
    }

    logger.info("Admin role requested", { userId, email: user.email });
    // In a real app, this would create a record in the database
  }

  async approveAdminRole(userId: string, approverId: string): Promise<void> {
    const user = await this.getUser(userId);
    const approver = await this.getUser(approverId);
    
    if (!user) {
      logger.warn("Admin approval attempted for non-existent user", { userId, approverId });
      throw new Error("User not found");
    }
    
    if (!approver) {
      logger.warn("Admin approval attempted by non-existent approver", { userId, approverId });
      throw new Error("Approver not found");
    }
    
    if (!approver.isAdmin) {
      logger.warn("Admin approval attempted by non-admin user", { 
        userId, 
        approverId, 
        approverEmail: approver.email 
      });
      throw new Error("Approver is not an admin");
    }

    user.isAdmin = true;
    logger.info("Admin role approved", { 
      userId, 
      userEmail: user.email, 
      approverId, 
      approverEmail: approver.email 
    });
  }

  async setMagicLinkToken(email: string, token: string): Promise<void> {
    // Set magic link token with 1 hour expiry
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 1);
    
    this.magicLinkTokens.set(email.toLowerCase(), { token, expiry });
    logger.debug("Magic link token set", { email, expiry: expiry.toISOString() });
  }

  async verifyMagicLinkToken(email: string, token: string): Promise<boolean> {
    const lowerEmail = email.toLowerCase();
    const entry = this.magicLinkTokens.get(lowerEmail);
    
    if (!entry) {
      logger.warn("Magic link verification attempted but no token exists", { email });
      return false;
    }
    
    if (entry.expiry < new Date()) {
      logger.warn("Magic link verification attempted with expired token", { 
        email, 
        expiry: entry.expiry.toISOString() 
      });
      return false;
    }
    
    if (entry.token !== token) {
      logger.warn("Magic link verification failed - invalid token", { email });
      return false;
    }
    
    // Clear the token to prevent reuse
    await this.clearMagicLinkToken(email);
    logger.info("Magic link verification successful", { email });
    return true;
  }

  async clearMagicLinkToken(email: string): Promise<void> {
    this.magicLinkTokens.delete(email.toLowerCase());
    logger.debug("Magic link token cleared", { email });
  }
}

export const storage = new MemStorage(); 