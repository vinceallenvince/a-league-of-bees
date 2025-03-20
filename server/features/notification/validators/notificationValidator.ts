import { z } from 'zod';

/**
 * Schema for marking notifications as read
 */
export const markAsReadSchema = z.object({
  notificationIds: z
    .array(z.string().min(1))
    .min(1, { message: 'At least one notification ID is required' })
    .max(100, { message: 'Cannot mark more than 100 notifications at once' })
});

/**
 * Type for validation result
 */
type ValidationResult<T> = 
  | { success: true; data: T }
  | { success: false; error: z.ZodError };

/**
 * Validate data for marking notifications as read
 */
export function validateMarkAsRead(data: unknown): ValidationResult<z.infer<typeof markAsReadSchema>> {
  const result = markAsReadSchema.safeParse(data);
  return result;
} 