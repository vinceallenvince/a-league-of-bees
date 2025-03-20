import { describe, it, expect } from '@jest/globals';
import { validateParticipantStatus, validateInviteParticipants } from '../../../../server/features/tournament/validators/participant';

describe('Participant Validators', () => {
  describe('validateParticipantStatus', () => {
    it('should validate a valid status', () => {
      const validData = {
        status: 'joined'
      };
      
      const result = validateParticipantStatus(validData);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data.status).toBe('joined');
      }
    });
    
    it('should reject an invalid status', () => {
      const invalidData = {
        status: 'unknown-status'
      };
      
      const result = validateParticipantStatus(invalidData);
      expect(result.success).toBe(false);
    });
    
    it('should reject when status is missing', () => {
      const invalidData = {};
      
      const result = validateParticipantStatus(invalidData);
      expect(result.success).toBe(false);
    });
  });
  
  describe('validateInviteParticipants', () => {
    it('should validate valid email list', () => {
      const validData = {
        emails: ['user1@example.com', 'user2@example.com']
      };
      
      const result = validateInviteParticipants(validData);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data.emails).toEqual(['user1@example.com', 'user2@example.com']);
      }
    });
    
    it('should reject an empty email list', () => {
      const invalidData = {
        emails: []
      };
      
      const result = validateInviteParticipants(invalidData);
      expect(result.success).toBe(false);
    });
    
    it('should reject invalid email formats', () => {
      const invalidData = {
        emails: ['not-an-email', 'user@example.com']
      };
      
      const result = validateInviteParticipants(invalidData);
      expect(result.success).toBe(false);
    });
    
    it('should reject too many emails', () => {
      // Create an array of 21 emails (exceeding the 20 limit)
      const emails = [];
      for (let i = 1; i <= 21; i++) {
        emails.push(`user${i}@example.com`);
      }
      
      const invalidData = { emails };
      
      const result = validateInviteParticipants(invalidData);
      expect(result.success).toBe(false);
    });
    
    it('should reject when emails field is missing', () => {
      const invalidData = {};
      
      const result = validateInviteParticipants(invalidData);
      expect(result.success).toBe(false);
    });
  });
}); 