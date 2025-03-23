import { jest } from '@jest/globals';
import { randomUUID } from 'crypto';

// In-memory database for tests
const mockStorage = {
  users: new Map<string, any>()
};

// Create a mock db object with the same interface as the real one
export const mockDbImplementation = {
  select: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  limit: jest.fn().mockImplementation((limit: number) => {
    // Return array of users that match the query
    return Array.from(mockStorage.users.values()).slice(0, limit);
  }),
  delete: jest.fn().mockImplementation((table) => {
    return {
      where: (condition: any) => {
        // Get the condition function and apply it
        if (typeof condition === 'function') {
          const conditionValue = condition();
          if (conditionValue && conditionValue.value && conditionValue.column) {
            // Find the matching users and delete them
            const email = conditionValue.value;
            // Use Array.from to avoid iterator issues
            Array.from(mockStorage.users.entries()).forEach(([id, user]) => {
              if (user.email === email) {
                mockStorage.users.delete(id);
              }
            });
          } else {
            // Delete all if no condition
            mockStorage.users.clear();
          }
        } else {
          // Delete all if no condition
          mockStorage.users.clear();
        }
        return Promise.resolve();
      },
      // Simple delete all implementation
      execute: () => {
        mockStorage.users.clear();
        return Promise.resolve();
      }
    };
  }),
  insert: jest.fn().mockImplementation((table) => {
    return {
      values: (values: any) => {
        // If it's a user, add to the users map
        if (values.email) {
          const id = values.id || randomUUID();
          mockStorage.users.set(id, { ...values, id });
        }
        return Promise.resolve();
      }
    };
  }),
  execute: jest.fn().mockImplementation((query: any) => {
    if (typeof query === 'string' && query.includes('SELECT 1')) {
      return Promise.resolve({ rows: [{ test: 1 }] });
    }
    return Promise.resolve({ rows: [] });
  }),
  // Add other methods as needed
  clearMockDb: () => {
    mockStorage.users.clear();
  },
  // Helper to get a user from the mock DB
  getUserByEmail: (email: string) => {
    // Use Array.from to avoid iterator issues
    for (const user of Array.from(mockStorage.users.values())) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }
};

// Create a jest mock function for db
export const mockDb = jest.fn(() => mockDbImplementation) as any; 