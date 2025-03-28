import { pgTable, text, serial, timestamp, boolean, integer, pgEnum, uuid, varchar } from "drizzle-orm/pg-core";
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

export const tournamentParticipants = pgTable('tournament_participants', {
  id: uuid('id').primaryKey().defaultRandom(),
  tournamentId: uuid('tournament_id').references(() => tournaments.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  joinedAt: timestamp('joined_at').defaultNow(),
  status: varchar('status', { length: 255 }).notNull().default('invited'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const tournamentScores = pgTable('tournament_scores', {
  id: uuid('id').primaryKey().defaultRandom(),
  tournamentId: uuid('tournament_id').references(() => tournaments.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  day: integer('day').notNull(),
  score: integer('score').notNull(),
  screenshotUrl: text('screenshot_url'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  tournamentId: uuid('tournament_id').references(() => tournaments.id).notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  message: text('message').notNull(),
  read: boolean('read').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow(),
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
export type TournamentParticipant = typeof tournamentParticipants.$inferSelect;