import { z } from 'zod';

/**
 * Base schema for score fields
 */
const scoreBaseSchema = z.object({
  score: z.number().int().min(0).max(10000),
  day: z.number().int().min(1).max(31),
  screenshotUrl: z.string().url().optional(),
});

/**
 * Schema for submitting a new score
 */
export const submitScoreSchema = scoreBaseSchema;

/**
 * Schema for updating an existing score
 */
export const updateScoreSchema = scoreBaseSchema.omit({ day: true });

/**
 * Type for validation result
 */
type ValidationResult<T> = 
  | { success: true; data: T }
  | { success: false; error: z.ZodError };

/**
 * Validate data for submitting a score
 */
export function validateSubmitScore(data: unknown): ValidationResult<z.infer<typeof submitScoreSchema>> {
  const result = submitScoreSchema.safeParse(data);
  return result;
}

/**
 * Validate data for updating a score
 */
export function validateUpdateScore(data: unknown): ValidationResult<z.infer<typeof updateScoreSchema>> {
  const result = updateScoreSchema.safeParse(data);
  return result;
} 