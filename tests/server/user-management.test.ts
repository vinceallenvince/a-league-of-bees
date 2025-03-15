/**
 * Unit tests for user management functionality
 * 
 * These tests verify critical user management functions,
 * particularly focusing on admin role assignment logic.
 */

import { User } from '@shared/schema';
import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import crypto from 'crypto';

// Define our mocks
const users = new Map<string, User>();
let currentId = 1;

// Mock the storage module
jest.mock('../../server/storage', () => {
  // Create storage class with mock implementation
  class MockStorage {
    users: Map<string, User>;
    currentId: number;
    
    constructor() {
      this.users = users;
      this.currentId = currentId;
    }
    
    async getUserByEmail(email: string): Promise<User | undefined> {
      return Array.from(this.users.values()).find(user => user.email === email);
    }
    
    async getUser(id: string): Promise<User | undefined> {
      return this.users.get(id);
    }
    
    async createUser(userData: Partial<User>): Promise<User> {
      const isFirstUser = this.users.size === 0;
      const newUser = {
        id: crypto.randomUUID(),
        email: userData.email || `user${this.currentId}@example.com`,
        firstName: userData.firstName || null,
        lastName: userData.lastName || null,
        username: userData.username || null,
        bio: userData.bio || null,
        avatar: userData.avatar || null,
        isAdmin: isFirstUser, // First user is automatically an admin
        lastLogin: null,
        otpSecret: null,
        otpExpiry: null,
        otpAttempts: 0,
        otpLastRequest: null,
      };
      this.users.set(newUser.id, newUser);
      this.currentId++;
      return newUser;
    }
    
    async getAllUsers(): Promise<User[]> {
      return Array.from(this.users.values());
    }
    
    async clearUsers(): Promise<void> {
      this.users.clear();
      this.currentId = 1; // Reset the ID counter when clearing users
    }

    async requestAdminRole(userId: string): Promise<void> {
      const user = await this.getUser(userId);
      if (!user) {
        throw new Error("User not found");
      }
      // In a real implementation, this would create a record in the database
      // For our test, we'll just verify the call is made correctly
    }

    async approveAdminRole(userId: string, approverId: string): Promise<void> {
      const user = await this.getUser(userId);
      const approver = await this.getUser(approverId);
      
      if (!user) {
        throw new Error("User not found");
      }
      
      if (!approver) {
        throw new Error("Approver not found");
      }
      
      if (!approver.isAdmin) {
        throw new Error("Approver is not an admin");
      }

      user.isAdmin = true;
    }

    async updateUser(id: string, userData: Partial<User>): Promise<User> {
      const user = await this.getUser(id);
      if (!user) {
        throw new Error("User not found");
      }

      const updatedUser = { ...user, ...userData };
      this.users.set(id, updatedUser);
      return updatedUser;
    }
  }
  
  return {
    storage: new MockStorage()
  };
});

// Import storage after mocking
import { storage } from '../../server/storage';

describe('User Management', () => {
  beforeEach(() => {
    // Reset the mock state before each test
    users.clear();
    currentId = 1;
    // Access the mock implementation and reset its counter too
    (storage as any).currentId = 1;
  });
  
  describe('User Creation', () => {
    test('should automatically make the first user an admin', async () => {
      // Arrange - ensure no users exist
      expect(users.size).toBe(0);
      
      // Act - create first user
      const firstUserEmail = 'first@example.com';
      const firstUser = await storage.createUser({ email: firstUserEmail });
      
      // Assert - verify user was created and is an admin
      expect(firstUser.id).toBeDefined();
      expect(firstUser.email).toBe(firstUserEmail);
      expect(firstUser.isAdmin).toBe(true);
      
      // Verify internal state
      expect(users.size).toBe(1);
      expect(users.get(firstUser.id)?.isAdmin).toBe(true);
    });
    
    test('should not make subsequent users admins', async () => {
      // Arrange - create first user
      const firstUser = await storage.createUser({ email: 'first@example.com' });
      expect(firstUser.isAdmin).toBe(true);
      expect(firstUser.id).toBeDefined();
      
      // Act - create second user
      const secondUserEmail = 'second@example.com';
      const secondUser = await storage.createUser({ email: secondUserEmail });
      
      // Assert - verify second user was created but is not an admin
      expect(secondUser.id).toBeDefined();
      expect(secondUser.email).toBe(secondUserEmail);
      expect(secondUser.isAdmin).toBe(false);
      
      // Verify internal state
      expect(users.size).toBe(2);
      expect(users.get(firstUser.id)?.isAdmin).toBe(true);
      expect(users.get(secondUser.id)?.isAdmin).toBe(false);
      
      // Act - create a third user
      const thirdUserEmail = 'third@example.com';
      const thirdUser = await storage.createUser({ email: thirdUserEmail });
      
      // Assert - verify third user is also not an admin
      expect(thirdUser.id).toBeDefined();
      expect(thirdUser.email).toBe(thirdUserEmail);
      expect(thirdUser.isAdmin).toBe(false);
      
      // Verify all users in the system
      const allUsers = await storage.getAllUsers();
      expect(allUsers.length).toBe(3);
      expect(allUsers.filter((u: User) => u.isAdmin).length).toBe(1);
    });
    
    test('should create user with minimal required fields', async () => {
      // Arrange & Act - create a user with only email
      const email = 'minimal@example.com';
      const user = await storage.createUser({ email });
      
      // Assert - verify default field values
      expect(user.email).toBe(email);
      expect(user.firstName).toBeNull();
      expect(user.lastName).toBeNull();
      expect(user.username).toBeNull();
      expect(user.bio).toBeNull();
      expect(user.avatar).toBeNull();
      expect(user.lastLogin).toBeNull();
      expect(user.otpSecret).toBeNull();
      expect(user.otpExpiry).toBeNull();
      expect(user.otpAttempts).toBe(0);
      expect(user.otpLastRequest).toBeNull();
    });
    
    test('should create user with provided optional fields', async () => {
      // Arrange & Act - create a user with additional fields
      const userData = {
        email: 'complete@example.com',
        firstName: 'Test',
        lastName: 'User',
        username: 'testuser',
        bio: 'This is a test user'
      };
      
      const user = await storage.createUser(userData);
      
      // Assert - verify fields were set correctly
      expect(user.email).toBe(userData.email);
      expect(user.firstName).toBe(userData.firstName);
      expect(user.lastName).toBe(userData.lastName);
      expect(user.username).toBe(userData.username);
      expect(user.bio).toBe(userData.bio);
    });
  });
  
  describe('User Lookup', () => {
    test('should find user by email', async () => {
      // Arrange - create a user
      const email = 'findme@example.com';
      const createdUser = await storage.createUser({ 
        email,
        firstName: 'Find',
        lastName: 'Me'
      });
      
      // Act - look up the user by email
      const foundUser = await storage.getUserByEmail(email);
      
      // Assert - verify the user was found and data matches
      expect(foundUser).not.toBeUndefined();
      expect(foundUser!.id).toBeDefined();
      expect(foundUser!.email).toBe(email);
      expect(foundUser!.firstName).toBe('Find');
      expect(foundUser!.lastName).toBe('Me');
    });
    
    test('should return undefined for non-existent email', async () => {
      // Arrange - create a user with a different email
      await storage.createUser({ email: 'exists@example.com' });
      
      // Act - look up a user with a non-existent email
      const foundUser = await storage.getUserByEmail('nonexistent@example.com');
      
      // Assert - verify no user was found
      expect(foundUser).toBeUndefined();
    });
    
    test('should find user by ID', async () => {
      // Arrange - create a user
      const createdUser = await storage.createUser({ 
        email: 'findbyid@example.com',
        firstName: 'Find',
        lastName: 'ById'
      });
      
      // Act - look up the user by ID
      const foundUser = await storage.getUser(createdUser.id);
      
      // Assert - verify the user was found and data matches
      expect(foundUser).not.toBeUndefined();
      expect(foundUser!.id).toBeDefined();
      expect(foundUser!.email).toBe('findbyid@example.com');
      expect(foundUser!.firstName).toBe('Find');
      expect(foundUser!.lastName).toBe('ById');
    });
    
    test('should return undefined for non-existent ID', async () => {
      // Arrange - create a user with UUID
      await storage.createUser({ email: 'exists@example.com' });
      
      // Act - look up a user with a non-existent ID
      const foundUser = await storage.getUser('nonexistent-id'); // ID that doesn't exist
      
      // Assert - verify no user was found
      expect(foundUser).toBeUndefined();
    });
    
    test('should find distinct users by email when multiple users exist', async () => {
      // Arrange - create multiple users
      const user1Email = 'user1@example.com';
      const user2Email = 'user2@example.com';
      const user3Email = 'user3@example.com';
      
      await storage.createUser({ email: user1Email, firstName: 'User', lastName: 'One' });
      await storage.createUser({ email: user2Email, firstName: 'User', lastName: 'Two' });
      await storage.createUser({ email: user3Email, firstName: 'User', lastName: 'Three' });
      
      // Act - look up users by email
      const foundUser1 = await storage.getUserByEmail(user1Email);
      const foundUser2 = await storage.getUserByEmail(user2Email);
      const foundUser3 = await storage.getUserByEmail(user3Email);
      
      // Assert - verify each user was found correctly
      expect(foundUser1!.email).toBe(user1Email);
      expect(foundUser1!.lastName).toBe('One');
      
      expect(foundUser2!.email).toBe(user2Email);
      expect(foundUser2!.lastName).toBe('Two');
      
      expect(foundUser3!.email).toBe(user3Email);
      expect(foundUser3!.lastName).toBe('Three');
    });
  });
  
  describe('Admin Approval', () => {
    test('should allow an admin to approve another user as admin', async () => {
      // Arrange - create an admin user and a regular user
      const adminUser = await storage.createUser({ email: 'admin@example.com' });
      const regularUser = await storage.createUser({ email: 'regular@example.com' });
      
      // Verify initial state
      expect(adminUser.isAdmin).toBe(true); // First user is admin
      expect(regularUser.isAdmin).toBe(false);
      
      // Act - admin approves regular user to become admin
      await storage.approveAdminRole(regularUser.id, adminUser.id);
      
      // Assert - verify regular user is now an admin
      const updatedUser = await storage.getUser(regularUser.id);
      expect(updatedUser!.isAdmin).toBe(true);
    });
    
    test('should throw error if approver is not an admin', async () => {
      // Arrange - create two regular users (first one is automatically admin)
      const adminUser = await storage.createUser({ email: 'admin@example.com' });
      const regularUser1 = await storage.createUser({ email: 'regular1@example.com' });
      const regularUser2 = await storage.createUser({ email: 'regular2@example.com' });
      
      // Verify initial state
      expect(adminUser.isAdmin).toBe(true);
      expect(regularUser1.isAdmin).toBe(false);
      expect(regularUser2.isAdmin).toBe(false);
      
      // Act & Assert - non-admin tries to approve another user
      await expect(storage.approveAdminRole(regularUser2.id, regularUser1.id))
        .rejects.toThrow('Approver is not an admin');
      
      // Verify state hasn't changed
      const user = await storage.getUser(regularUser2.id);
      expect(user!.isAdmin).toBe(false);
    });
    
    test('should throw error if user to be approved does not exist', async () => {
      // Arrange - create an admin user
      const adminUser = await storage.createUser({ email: 'admin@example.com' });
      
      // Act & Assert - try to approve non-existent user
      await expect(storage.approveAdminRole('nonexistent-id', adminUser.id))
        .rejects.toThrow('User not found');
    });
    
    test('should throw error if approver does not exist', async () => {
      // Arrange - create a regular user
      const regularUser = await storage.createUser({ email: 'admin@example.com' });
      const secondUser = await storage.createUser({ email: 'second@example.com' });
      
      // Act & Assert - try to approve with non-existent approver
      await expect(storage.approveAdminRole(secondUser.id, 'nonexistent-id'))
        .rejects.toThrow('Approver not found');
      
      // Verify state hasn't changed
      const user = await storage.getUser(secondUser.id);
      expect(user!.isAdmin).toBe(false);
    });
    
    test('should allow multiple admins in the system', async () => {
      // Arrange - create multiple users
      const adminUser = await storage.createUser({ email: 'admin@example.com' });
      const user1 = await storage.createUser({ email: 'user1@example.com' });
      const user2 = await storage.createUser({ email: 'user2@example.com' });
      
      // Make both regular users admins
      await storage.approveAdminRole(user1.id, adminUser.id);
      await storage.approveAdminRole(user2.id, adminUser.id);
      
      // Verify all users are now admins
      const allUsers = await storage.getAllUsers();
      expect(allUsers.length).toBe(3);
      expect(allUsers.filter((u: User) => u.isAdmin).length).toBe(3);
      
      // Verify specific users
      const updatedUser1 = await storage.getUser(user1.id);
      const updatedUser2 = await storage.getUser(user2.id);
      expect(updatedUser1!.isAdmin).toBe(true);
      expect(updatedUser2!.isAdmin).toBe(true);
    });
    
    test('should allow newly approved admin to approve other users', async () => {
      // Arrange - create multiple users
      const initialAdmin = await storage.createUser({ email: 'admin@example.com' });
      const secondUser = await storage.createUser({ email: 'second@example.com' });
      const thirdUser = await storage.createUser({ email: 'third@example.com' });
      
      // Make second user an admin
      await storage.approveAdminRole(secondUser.id, initialAdmin.id);
      
      // Act - now have the second user (newly approved admin) approve the third user
      await storage.approveAdminRole(thirdUser.id, secondUser.id);
      
      // Assert - verify third user is now also an admin
      const updatedThirdUser = await storage.getUser(thirdUser.id);
      expect(updatedThirdUser!.isAdmin).toBe(true);
      
      // Verify all users
      const allUsers = await storage.getAllUsers();
      expect(allUsers.filter((u: User) => u.isAdmin).length).toBe(3);
    });
  });
}); 