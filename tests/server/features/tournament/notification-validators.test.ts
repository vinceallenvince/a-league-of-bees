import { describe, it, expect } from '@jest/globals';
import { validateMarkAsRead } from '../../../../server/features/tournament/validators/notification';

describe('Notification Validators', () => {
  describe('validateMarkAsRead', () => {
    it('should validate valid notification IDs array', () => {
      const validData = {
        notificationIds: ['notification-1', 'notification-2']
      };
      
      const result = validateMarkAsRead(validData);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data.notificationIds).toEqual(['notification-1', 'notification-2']);
      }
    });
    
    it('should validate a single notification ID', () => {
      const validData = {
        notificationIds: ['notification-1']
      };
      
      const result = validateMarkAsRead(validData);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data.notificationIds).toEqual(['notification-1']);
      }
    });
    
    it('should reject when notificationIds is missing', () => {
      const invalidData = {};
      
      const result = validateMarkAsRead(invalidData);
      expect(result.success).toBe(false);
    });
    
    it('should reject when notificationIds is empty', () => {
      const invalidData = {
        notificationIds: []
      };
      
      const result = validateMarkAsRead(invalidData);
      expect(result.success).toBe(false);
    });
    
    it('should reject when notificationIds contains non-string values', () => {
      const invalidData = {
        notificationIds: ['notification-1', 123, 'notification-3']
      };
      
      const result = validateMarkAsRead(invalidData as any);
      expect(result.success).toBe(false);
    });
    
    it('should reject when notificationIds is not an array', () => {
      const invalidData = {
        notificationIds: 'notification-1'
      };
      
      const result = validateMarkAsRead(invalidData as any);
      expect(result.success).toBe(false);
    });
    
    it('should reject when too many notification IDs are provided', () => {
      // Create an array with 101 items (exceeding the 100 limit)
      const notificationIds = Array.from({ length: 101 }, (_, i) => `notification-${i}`);
      
      const invalidData = {
        notificationIds
      };
      
      const result = validateMarkAsRead(invalidData);
      expect(result.success).toBe(false);
    });
  });
}); 