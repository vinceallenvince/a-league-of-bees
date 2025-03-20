import { describe, it, expect } from '@jest/globals';
import { validateSubmitScore, validateUpdateScore } from '../../../../server/features/tournament/validators/score';

describe('Score Validators', () => {
  describe('validateSubmitScore', () => {
    it('should validate valid score submission data', () => {
      const validData = {
        score: 100,
        day: 1
      };
      
      const result = validateSubmitScore(validData);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data.score).toBe(100);
        expect(result.data.day).toBe(1);
      }
    });
    
    it('should validate score submission with screenshot URL', () => {
      const validData = {
        score: 100,
        day: 1,
        screenshotUrl: 'https://example.com/screenshot.jpg'
      };
      
      const result = validateSubmitScore(validData);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data.screenshotUrl).toBe('https://example.com/screenshot.jpg');
      }
    });
    
    it('should reject when score is negative', () => {
      const invalidData = {
        score: -10,
        day: 1
      };
      
      const result = validateSubmitScore(invalidData);
      expect(result.success).toBe(false);
    });
    
    it('should reject when score is too high', () => {
      const invalidData = {
        score: 20000, // Exceeds max of 10000
        day: 1
      };
      
      const result = validateSubmitScore(invalidData);
      expect(result.success).toBe(false);
    });
    
    it('should reject when day is negative or zero', () => {
      const invalidData = {
        score: 100,
        day: 0
      };
      
      const result = validateSubmitScore(invalidData);
      expect(result.success).toBe(false);
    });
    
    it('should reject when day is too high', () => {
      const invalidData = {
        score: 100,
        day: 32 // Exceeds max of 31
      };
      
      const result = validateSubmitScore(invalidData);
      expect(result.success).toBe(false);
    });
    
    it('should reject with invalid screenshot URL format', () => {
      const invalidData = {
        score: 100,
        day: 1,
        screenshotUrl: 'not-a-url'
      };
      
      const result = validateSubmitScore(invalidData);
      expect(result.success).toBe(false);
    });
    
    it('should reject when required fields are missing', () => {
      // Missing score
      const missingScore = {
        day: 1
      };
      
      const result1 = validateSubmitScore(missingScore);
      expect(result1.success).toBe(false);
      
      // Missing day
      const missingDay = {
        score: 100
      };
      
      const result2 = validateSubmitScore(missingDay);
      expect(result2.success).toBe(false);
    });
  });
  
  describe('validateUpdateScore', () => {
    it('should validate valid score update data', () => {
      const validData = {
        score: 150
      };
      
      const result = validateUpdateScore(validData);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data.score).toBe(150);
      }
    });
    
    it('should validate score update with screenshot URL', () => {
      const validData = {
        score: 150,
        screenshotUrl: 'https://example.com/new-screenshot.jpg'
      };
      
      const result = validateUpdateScore(validData);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data.screenshotUrl).toBe('https://example.com/new-screenshot.jpg');
      }
    });
    
    it('should reject when score is negative', () => {
      const invalidData = {
        score: -10
      };
      
      const result = validateUpdateScore(invalidData);
      expect(result.success).toBe(false);
    });
    
    it('should reject when score is too high', () => {
      const invalidData = {
        score: 20000 // Exceeds max of 10000
      };
      
      const result = validateUpdateScore(invalidData);
      expect(result.success).toBe(false);
    });
    
    it('should reject with invalid screenshot URL format', () => {
      const invalidData = {
        score: 150,
        screenshotUrl: 'not-a-url'
      };
      
      const result = validateUpdateScore(invalidData);
      expect(result.success).toBe(false);
    });
    
    it('should reject when score is missing', () => {
      const invalidData = {
        screenshotUrl: 'https://example.com/screenshot.jpg'
      };
      
      const result = validateUpdateScore(invalidData);
      expect(result.success).toBe(false);
    });
  });
}); 