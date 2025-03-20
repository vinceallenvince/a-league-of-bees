import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import { createApp } from '../../../../server/core';
import { createMockSession, resetMockSession } from '../../../utils/session-mock';
import { testDb } from '../../../server/core/test-db';
import { createTestUser, createTestTournament } from '../../../utils/test-data';

describe('Dashboard API', () => {
  let app: Express.Application;
  let userId: string;
  
  beforeEach(async () => {
    // Set up test app
    const { app: testApp } = createApp();
    app = testApp;
    
    // Reset the database
    await testDb.reset();
    
    // Create a test user
    const user = await createTestUser();
    userId = user.id;
    
    // Set up mock session with the user
    createMockSession(userId);
  });
  
  afterEach(() => {
    // Reset the mock session
    resetMockSession();
  });
  
  describe('GET /api/dashboard', () => {
    it('should return 401 when not authenticated', async () => {
      // Reset session to simulate unauthenticated request
      resetMockSession();
      
      const response = await request(app).get('/api/dashboard');
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
    
    it('should return dashboard data for authenticated user', async () => {
      // Create some tournaments for the user
      await createTestTournament({ 
        creatorId: userId, 
        name: 'Test Tournament 1',
        status: 'pending'
      });
      
      await createTestTournament({
        creatorId: userId,
        name: 'Test Tournament 2',
        status: 'in_progress'
      });
      
      const response = await request(app).get('/api/dashboard');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('userInfo');
      expect(response.body).toHaveProperty('tournamentSummary');
      expect(response.body).toHaveProperty('participation');
      expect(response.body).toHaveProperty('recentActivity');
      expect(response.body).toHaveProperty('upcomingTournaments');
      expect(response.body).toHaveProperty('unreadNotificationsCount');
      
      // Verify tournament counts in summary
      expect(response.body.tournamentSummary.pending).toBe(1);
      expect(response.body.tournamentSummary.active).toBe(1);
    });
    
    it('should return 404 when user not found', async () => {
      // Set an invalid user ID in the session
      createMockSession('non-existent-user-id');
      
      const response = await request(app).get('/api/dashboard');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('User not found');
    });
  });
}); 