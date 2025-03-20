import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import { createApp } from '../../../../server/core';
import { notifications } from '../../../../shared/schema';
import { db } from '../../../../server/features/tournament/db';
import { createMockSession, resetMockSession } from '../../../utils/session-mock';
import { testDb } from '../../../server/core/test-db';
import { createTestUser, createTestTournament } from '../../../utils/test-data';

describe('Notification API', () => {
  let app: Express.Application;
  let userId: string;
  let tournamentId: string;
  
  beforeEach(async () => {
    // Set up test app
    const { app: testApp } = createApp();
    app = testApp;
    
    // Reset the database
    await testDb.reset();
    
    // Create a test user
    const user = await createTestUser();
    userId = user.id;
    
    // Create a test tournament
    const tournament = await createTestTournament({ creatorId: userId });
    tournamentId = tournament.id;
    
    // Create some test notifications
    await db.insert(notifications).values([
      {
        userId,
        tournamentId,
        type: 'invitation',
        message: 'You have been invited to a tournament',
        read: false
      },
      {
        userId,
        tournamentId,
        type: 'tournament_start',
        message: 'Tournament has started',
        read: true
      }
    ]);
    
    // Set up mock session with the user
    createMockSession(userId);
  });
  
  afterEach(() => {
    // Reset the mock session
    resetMockSession();
  });
  
  describe('GET /api/notifications', () => {
    it('should return 401 when not authenticated', async () => {
      // Reset session to simulate unauthenticated request
      resetMockSession();
      
      const response = await request(app).get('/api/notifications');
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
    
    it('should return all notifications for authenticated user', async () => {
      const response = await request(app).get('/api/notifications');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('notifications');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('pageSize');
      expect(response.body).toHaveProperty('totalPages');
      expect(response.body.notifications.length).toBe(2);
    });
    
    it('should filter notifications by type', async () => {
      const response = await request(app).get('/api/notifications?type=invitation');
      
      expect(response.status).toBe(200);
      expect(response.body.notifications.length).toBe(1);
      expect(response.body.notifications[0].type).toBe('invitation');
    });
    
    it('should filter notifications by read status', async () => {
      const response = await request(app).get('/api/notifications?read=false');
      
      expect(response.status).toBe(200);
      expect(response.body.notifications.length).toBe(1);
      expect(response.body.notifications[0].read).toBe(false);
    });
    
    it('should paginate notifications', async () => {
      // Add 10 more notifications
      const notifications = [];
      for (let i = 0; i < 10; i++) {
        notifications.push({
          userId,
          tournamentId,
          type: 'reminder',
          message: `Reminder ${i + 1}`,
          read: false
        });
      }
      
      await db.insert(notifications).values(notifications);
      
      // Get page 1 with page size 5
      const page1Response = await request(app).get('/api/notifications?page=1&pageSize=5');
      
      expect(page1Response.status).toBe(200);
      expect(page1Response.body.notifications.length).toBe(5);
      expect(page1Response.body.page).toBe(1);
      expect(page1Response.body.pageSize).toBe(5);
      expect(page1Response.body.total).toBe(12); // 2 initial + 10 new
      
      // Get page 2 with page size 5
      const page2Response = await request(app).get('/api/notifications?page=2&pageSize=5');
      
      expect(page2Response.status).toBe(200);
      expect(page2Response.body.notifications.length).toBe(5);
      expect(page2Response.body.page).toBe(2);
    });
  });
  
  describe('PUT /api/notifications/read', () => {
    it('should return 401 when not authenticated', async () => {
      // Reset session to simulate unauthenticated request
      resetMockSession();
      
      const response = await request(app)
        .put('/api/notifications/read')
        .send({ notificationIds: ['some-id'] });
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
    
    it('should mark notifications as read', async () => {
      // Get all unread notifications
      const notificationsResponse = await request(app).get('/api/notifications?read=false');
      const notificationIds = notificationsResponse.body.notifications.map(n => n.id);
      
      // Mark them as read
      const response = await request(app)
        .put('/api/notifications/read')
        .send({ notificationIds });
      
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(notificationIds.length);
      
      // Verify they are now read
      const verifyResponse = await request(app).get('/api/notifications?read=false');
      expect(verifyResponse.body.notifications.length).toBe(0);
    });
    
    it('should reject invalid notification IDs', async () => {
      const response = await request(app)
        .put('/api/notifications/read')
        .send({ notificationIds: [] });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
    
    it('should reject notifications that do not belong to user', async () => {
      const response = await request(app)
        .put('/api/notifications/read')
        .send({ notificationIds: ['non-existent-id'] });
      
      // Should either be 403 (forbidden) or 404 (not found)
      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.body).toHaveProperty('error');
    });
  });
}); 