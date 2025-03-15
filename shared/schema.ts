import { pgTable, text, serial, timestamp, boolean, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  firstName: text("firstName"),
  lastName: text("lastName"),
  username: text("username"),
  bio: text("bio"),
  avatar: text("avatar"),
  isAdmin: boolean("isAdmin").notNull().default(false),
  lastLogin: timestamp("lastLogin"),
  otpSecret: text("otpSecret"),
  otpExpiry: timestamp("otpExpiry"),
  otpAttempts: integer("otpAttempts").notNull(),
  otpLastRequest: timestamp("otpLastRequest"),
});

export const adminApprovals = pgTable("adminApprovals", {
  id: serial("id").primaryKey(),
  userId: serial("userId").references(() => users.id),
  approvedBy: serial("approvedBy").references(() => users.id),
  status: text("status").notNull(), // pending, approved, rejected
  createdAt: timestamp("createdAt").defaultNow(),
});

export const tournaments = pgTable("tournaments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate").notNull(),
  status: tournamentStatusEnum("status").notNull().default("pending"),
  maxParticipants: integer("maxParticipants").notNull(),
  // Add other relevant columns as needed
});


export const tournamentStatusEnum = pgEnum('tournament_status', ['pending', 'in_progress', 'completed', 'cancelled']);

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  firstName: true,
  lastName: true,
  username: true,
  bio: true,
  avatar: true,
});

export const insertOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertOtp = z.infer<typeof insertOtpSchema>;
export type User = typeof users.$inferSelect;
export type AdminApproval = typeof adminApprovals.$inferSelect;
export type Tournament = typeof tournaments.$inferSelect;