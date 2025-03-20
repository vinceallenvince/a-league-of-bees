import { z } from 'zod';

/**
 * Valid participant statuses
 */
export const PARTICIPANT_STATUSES = ['invited', 'joined', 'declined'] as const;

/**
 * Schema for updating participant status
 */
export const participantStatusSchema = z.object({
  status: z.enum(PARTICIPANT_STATUSES)
});

/**
 * Schema for inviting participants
 */
export const inviteParticipantsSchema = z.object({
  emails: z
    .array(z.string().email({ message: 'Invalid email address' }))
    .min(1, { message: 'At least one email is required' })
    .max(20, { message: 'Cannot invite more than 20 users at once' })
});

/**
 * Type for validation result
 */
type ValidationResult<T> = 
  | { success: true; data: T }
  | { success: false; error: z.ZodError };

/**
 * Validate participant status data
 */
export function validateParticipantStatus(data: unknown): ValidationResult<z.infer<typeof participantStatusSchema>> {
  const result = participantStatusSchema.safeParse(data);
  return result;
}

/**
 * Validate invite participants data
 */
export function validateInviteParticipants(data: unknown): ValidationResult<z.infer<typeof inviteParticipantsSchema>> {
  const result = inviteParticipantsSchema.safeParse(data);
  return result;
} 