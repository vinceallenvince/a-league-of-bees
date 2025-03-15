import { pgTable, text, serial, timestamp, boolean, integer, pgEnum, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const tournamentStatusEnum = pgEnum('tournament_status', ['pending', 'in_progress', 'completed', 'cancelled']);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
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
  userId: uuid("userId").references(() => users.id),
  approvedBy: uuid("approvedBy").references(() => users.id),
  status: text("status").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
});

export const tournaments = pgTable("tournaments", {
  id: uuid("id").primaryKey().defaultRandom(),
  creatorId: uuid("creator_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  durationDays: integer("duration_days").notNull(),
  startDate: timestamp("start_date").notNull(),
  requiresVerification: boolean("requires_verification").notNull().default(false),
  status: tournamentStatusEnum("status").notNull().default("pending"),
  timezone: text("timezone").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

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