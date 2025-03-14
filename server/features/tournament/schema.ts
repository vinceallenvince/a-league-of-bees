
import { pgTable, uuid, text, integer, timestamp, boolean, pgEnum } from 'drizzle-orm/pg-core';

export const tournamentStatusEnum = pgEnum('tournament_status', ['pending', 'in_progress', 'completed', 'cancelled']);

export const tournaments = pgTable('tournaments', {
  id: uuid('id').primaryKey().defaultRandom(),
  creatorId: uuid('creator_id').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  durationDays: integer('duration_days').notNull(),
  startDate: timestamp('start_date').notNull(),
  requiresVerification: boolean('requires_verification').notNull().default(false),
  status: tournamentStatusEnum('status').notNull().default('pending'),
  timezone: text('timezone').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});
