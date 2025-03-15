import { users, adminApprovals, type User, type InsertUser } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { randomBytes } from "crypto";
import logger from "./logger";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
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
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
    logger.info("Memory storage initialized");
  }

  async getUser(id: string): Promise<User | undefined> {
    logger.debug("Getting user by ID", { userId: id });
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    logger.debug("Getting user by email", { email });
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(user: Partial<User>): Promise<User> {
    logger.debug("Creating user", { email: user.email });

    if (!user.email) {
      throw new Error("Email is required");
    }

    // Check if a user with this email already exists
    const existingUser = await this.getUserByEmail(user.email);
    if (existingUser) {
      return existingUser;
    }

    const isFirstUser = this.users.size === 0;
    const newUser = {
      id: crypto.randomUUID(), // Use UUID instead of incrementing number
      email: user.email!,
      firstName: user.firstName || null,
      lastName: user.lastName || null,
      username: user.username || null,
      bio: user.bio || null,
      avatar: user.avatar || null,
      isAdmin: isFirstUser, // First user is automatically an admin
      lastLogin: null,
      otpSecret: null,
      otpExpiry: null,
      otpAttempts: 0,
      otpLastRequest: null,
    };

    this.users.set(newUser.id, newUser);
    this.currentId++; // Still increment the counter for tracking purposes
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