import { z } from 'zod';

/**
 * Valid timezones list (partial list for example purposes)
 */
const VALID_TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Australia/Sydney'
] as const;

/**
 * Base schema for tournament fields
 */
const tournamentBaseSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().max(1000).optional(),
  durationDays: z.number().int().positive(),
  startDate: z.union([
    z.string().datetime(),
    z.date()
  ]).transform(val => val instanceof Date ? val : new Date(val)),
  requiresVerification: z.boolean(),
  timezone: z.enum(VALID_TIMEZONES)
});

/**
 * Schema for creating a new tournament
 */
export const createTournamentSchema = tournamentBaseSchema.refine(
  data => {
    // Ensure startDate is not in the past
    return data.startDate > new Date();
  },
  {
    message: 'Start date must be in the future',
    path: ['startDate']
  }
);

/**
 * Schema for updating an existing tournament
 */
export const updateTournamentSchema = tournamentBaseSchema.partial().refine(
  data => {
    // If startDate is provided, ensure it's not in the past
    if (data.startDate) {
      return data.startDate > new Date();
    }
    return true;
  },
  {
    message: 'Start date must be in the future',
    path: ['startDate']
  }
);

/**
 * Type for tournament validation result
 */
type ValidationResult<T> = 
  | { success: true; data: T }
  | { success: false; error: z.ZodError };

/**
 * Validate data for creating a tournament
 */
export function validateCreateTournament(data: unknown): ValidationResult<z.infer<typeof createTournamentSchema>> {
  const result = createTournamentSchema.safeParse(data);
  return result;
}

/**
 * Validate data for updating a tournament
 */
export function validateUpdateTournament(data: unknown): ValidationResult<z.infer<typeof updateTournamentSchema>> {
  const result = updateTournamentSchema.safeParse(data);
  return result;
} 