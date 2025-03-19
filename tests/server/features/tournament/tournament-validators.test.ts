import { describe, it, expect } from '@jest/globals';
import { 
  validateCreateTournament,
  validateUpdateTournament
} from '../../../../server/features/tournament/validators/tournament';

describe('Tournament Validators', () => {
  describe('validateCreateTournament', () => {
    it('should validate a valid tournament creation request', () => {
      const validTournament = {
        name: 'Test Tournament',
        description: 'A test tournament',
        durationDays: 7,
        startDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        requiresVerification: false,
        timezone: 'UTC'
      };
      
      const result = validateCreateTournament(validTournament);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          ...validTournament,
          startDate: expect.any(Date)
        });
      }
    });
    
    it('should convert startDate string to Date object', () => {
      const dateString = new Date(Date.now() + 86400000).toISOString();
      const tournament = {
        name: 'Test Tournament',
        description: 'A test tournament',
        durationDays: 7,
        startDate: dateString,
        requiresVerification: false,
        timezone: 'UTC'
      };
      
      const result = validateCreateTournament(tournament);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.startDate).toBeInstanceOf(Date);
        expect(result.data.startDate.toISOString()).toBe(dateString);
      }
    });
    
    it('should reject when name is missing', () => {
      const invalidTournament = {
        description: 'A test tournament',
        durationDays: 7,
        startDate: new Date(Date.now() + 86400000).toISOString(),
        requiresVerification: false,
        timezone: 'UTC'
      };
      
      const result = validateCreateTournament(invalidTournament);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => issue.path.includes('name'))).toBe(true);
      }
    });
    
    it('should reject when name is too short', () => {
      const invalidTournament = {
        name: 'Te',
        description: 'A test tournament',
        durationDays: 7,
        startDate: new Date(Date.now() + 86400000).toISOString(),
        requiresVerification: false,
        timezone: 'UTC'
      };
      
      const result = validateCreateTournament(invalidTournament);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => issue.path.includes('name'))).toBe(true);
      }
    });
    
    it('should reject when durationDays is not a positive number', () => {
      const invalidTournament = {
        name: 'Test Tournament',
        description: 'A test tournament',
        durationDays: 0,
        startDate: new Date(Date.now() + 86400000).toISOString(),
        requiresVerification: false,
        timezone: 'UTC'
      };
      
      const result = validateCreateTournament(invalidTournament);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => issue.path.includes('durationDays'))).toBe(true);
      }
    });
    
    it('should reject when startDate is in the past', () => {
      const invalidTournament = {
        name: 'Test Tournament',
        description: 'A test tournament',
        durationDays: 7,
        startDate: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        requiresVerification: false,
        timezone: 'UTC'
      };
      
      const result = validateCreateTournament(invalidTournament);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => issue.path.includes('startDate'))).toBe(true);
      }
    });
    
    it('should reject when timezone is invalid', () => {
      const invalidTournament = {
        name: 'Test Tournament',
        description: 'A test tournament',
        durationDays: 7,
        startDate: new Date(Date.now() + 86400000).toISOString(),
        requiresVerification: false,
        timezone: 'Invalid/Timezone'
      };
      
      const result = validateCreateTournament(invalidTournament);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => issue.path.includes('timezone'))).toBe(true);
      }
    });
  });
  
  describe('validateUpdateTournament', () => {
    it('should validate a valid tournament update request with all fields', () => {
      const validUpdate = {
        name: 'Updated Tournament',
        description: 'An updated test tournament',
        durationDays: 14,
        startDate: new Date(Date.now() + 172800000).toISOString(), // 2 days from now
        requiresVerification: true,
        timezone: 'America/New_York'
      };
      
      const result = validateUpdateTournament(validUpdate);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          ...validUpdate,
          startDate: expect.any(Date)
        });
      }
    });
    
    it('should validate a partial update with only name', () => {
      const partialUpdate = {
        name: 'Updated Tournament Name'
      };
      
      const result = validateUpdateTournament(partialUpdate);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(partialUpdate);
      }
    });
    
    it('should validate a partial update with only description', () => {
      const partialUpdate = {
        description: 'Updated tournament description'
      };
      
      const result = validateUpdateTournament(partialUpdate);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(partialUpdate);
      }
    });
    
    it('should reject when name is too short', () => {
      const invalidUpdate = {
        name: 'T'
      };
      
      const result = validateUpdateTournament(invalidUpdate);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => issue.path.includes('name'))).toBe(true);
      }
    });
    
    it('should reject when durationDays is negative', () => {
      const invalidUpdate = {
        durationDays: -1
      };
      
      const result = validateUpdateTournament(invalidUpdate);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => issue.path.includes('durationDays'))).toBe(true);
      }
    });
    
    it('should reject when startDate is in the past', () => {
      const invalidUpdate = {
        startDate: new Date(Date.now() - 86400000).toISOString() // Yesterday
      };
      
      const result = validateUpdateTournament(invalidUpdate);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => issue.path.includes('startDate'))).toBe(true);
      }
    });
  });
}); 