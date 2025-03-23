import { randomInt, randomBytes } from "crypto";
import { Express } from "express";
import session from "express-session";
import { storage } from "./storage";
import { sendOtpEmail, sendMagicLinkEmail } from "./email";
import { insertOtpSchema, insertUserSchema, users } from "@shared/schema";
import logger from "./logger";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { ensureUserIdConsistency } from "./auth-utils";

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      isAdmin: boolean;
    }
    
    interface Session {
      userId: string;
      email?: string;
    }
  }
}

// Environment variable to control auth method
const AUTH_METHOD = process.env.AUTH_METHOD || 'otp'; // 'otp' or 'magic-link'
logger.info('Auth method loaded from environment', { 
  authMethod: AUTH_METHOD, 
  envValue: process.env.AUTH_METHOD 
});

function generateOtp(): string {
  return randomInt(100000, 999999).toString();
}

function generateMagicLinkToken(): string {
  return randomBytes(32).toString('hex');
}

export function setupAuth(app: Express) {
  // Set up session middleware
  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'development-session-secret',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
      store: storage.sessionStore,
    }),
  );

  // Auth endpoints
  app.post("/api/auth/request", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }
      
      // Check for user and ensure ID consistency between memory and database
      let user = await storage.getUserByEmail(email);
      
      // Create user if they don't exist yet
      if (!user) {
        user = await storage.createUser({ 
          email: email,
          username: email.split('@')[0], // Default name from email
          isAdmin: false,
          otpAttempts: 0
        });
        logger.info('Created new user', { email });
      } else {
        // Ensure existing user has consistent ID between memory and database
        user = await ensureUserIdConsistency(email) || user;
      }

      // Handle auth method
      if (AUTH_METHOD === 'magic-link') {
        const token = generateMagicLinkToken();
        await storage.setMagicLinkToken(email, token);
        await sendMagicLinkEmail(email, token);
        
        return res.status(200).json({ method: 'magic-link' });
      } else {
        // Default to OTP if not magic link
        const otp = generateOtp();
        await storage.setOtp(email, otp);
        await sendOtpEmail(email, otp);
        
        return res.status(200).json({ method: 'otp' });
      }
    } catch (error) {
      logger.error('Auth request error', { error });
      res.status(500).json({ error: "Failed to process authentication request" });
    }
  });

  app.post("/api/auth/request-otp", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }
      
      // Check for user and ensure ID consistency between memory and database
      let user = await storage.getUserByEmail(email);
      
      // Create user if they don't exist yet
      if (!user) {
        user = await storage.createUser({ 
          email: email,
          username: email.split('@')[0], // Default name from email
          isAdmin: false,
          otpAttempts: 0
        });
        logger.info('Created new user', { email });
      } else {
        // Ensure existing user has consistent ID between memory and database
        user = await ensureUserIdConsistency(email) || user;
      }

      const otp = generateOtp();
      await storage.setOtp(email, otp);
      await sendOtpEmail(email, otp);
      
      res.status(200).json({ success: true });
    } catch (error) {
      logger.error('OTP request error', { error });
      res.status(500).json({ error: "Failed to send OTP" });
    }
  });

  app.post("/api/auth/verify-otp", async (req, res) => {
    try {
      const result = await insertOtpSchema.safeParseAsync(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid input", details: result.error.errors });
      }
      
      const { email, otp } = result.data;
      
      // First verify the OTP
      const verificationResult = await storage.verifyOtp(email, otp);
      if (!verificationResult.success) {
        return res.status(400).json({ 
          error: verificationResult.message,
          remainingAttempts: verificationResult.remainingAttempts
        });
      }
      
      // Ensure user ID consistency between memory and database
      // This is our new approach that simplifies the complex ID synchronization
      const user = await ensureUserIdConsistency(email);
      if (!user) {
        logger.error('User not found or ID consistency could not be ensured', { email });
        return res.status(500).json({ error: 'Authentication failed, please try again' });
      }
      
      // User ID should now be consistent between memory and database
      // Set up session with the user ID
      req.session.userId = user.id;
      (req.session as Express.Session).email = email;
      
      await storage.updateLastLogin(user.id);
      
      logger.info('OTP verification successful', { 
        userId: user.id, 
        email 
      });
      
      // Return the user information
      res.status(200).json(user);
    } catch (error) {
      logger.error('Error in OTP verification', { error });
      res.status(500).json({ error: "Failed to verify OTP" });
    }
  });

  // Magic link verification
  app.get("/api/auth/verify-magic-link", async (req, res) => {
    try {
      const { email, token } = req.query;
      
      if (!email || !token || typeof email !== 'string' || typeof token !== 'string') {
        return res.status(400).json({ error: "Invalid magic link" });
      }
      
      const isValid = await storage.verifyMagicLinkToken(email, token);
      if (!isValid) {
        return res.status(400).json({ error: "Invalid or expired magic link" });
      }
      
      // Ensure user ID consistency between memory and database
      const user = await ensureUserIdConsistency(email);
      if (!user) {
        logger.error('User not found or ID consistency could not be ensured', { email });
        return res.status(404).json({ error: "User not found" });
      }
      
      // Set up session
      req.session.userId = user.id;
      await storage.updateLastLogin(user.id);
      await storage.clearMagicLinkToken(email);
      
      // Redirect to auth success page
      res.redirect('/auth/success');
    } catch (error) {
      logger.error('Magic link verification error', { error });
      res.status(500).redirect('/auth?error=verification_failed');
    }
  });

  app.get("/api/auth/user", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        // If the user isn't found in memory, try to synchronize with database
        if ((req.session as Express.Session).email) {
          const syncedUser = await ensureUserIdConsistency((req.session as Express.Session).email!);
          if (syncedUser) {
            // Now that we've synced, update the session with the correct ID if needed
            if (syncedUser.id !== req.session.userId) {
              req.session.userId = syncedUser.id;
            }
            return res.status(200).json(syncedUser);
          }
        }
        return res.status(404).json({ error: "User not found" });
      }
      res.status(200).json(user);
    } catch (error) {
      logger.error('Get user error', { error });
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  app.get("/api/auth/method", async (req, res) => {
    res.status(200).json({ method: AUTH_METHOD });
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        logger.error('Logout error', { error: err });
        return res.status(500).json({ error: "Failed to log out" });
      }
      res.status(200).json({ success: true });
    });
  });
} 