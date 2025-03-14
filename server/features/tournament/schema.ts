
import { serial, text, timestamp, boolean, pgEnum, integer, uuid } from 'drizzle-orm/pg-core';
import { pgTable } from 'drizzle-orm/pg-core';

// Tournament status enum
export const tournamentStatusEnum = pgEnum('tournament_status', [
  'pending',
  'in_progress',
  'completed',
  'cancelled'
]);

// Define tournament table schema
export const tournaments = pgTable('tournaments', {
  id: uuid('id').defaultRandom().primaryKey(),
  creatorId: uuid('creator_id').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  durationDays: integer('duration_days').notNull(),
  startDate: timestamp('start_date').notNull(),
  requiresVerification: boolean('requires_verification').default(false).notNull(),
  status: tournamentStatusEnum('status').default('pending').notNull(),
  timezone: text('timezone').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});
