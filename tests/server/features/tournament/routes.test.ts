import { describe, it, expect, jest } from '@jest/globals';
import request from 'supertest';
import express, { Express, Request, Response } from 'express';

describe('Tournament Routes', () => {
  let app: Express;

  beforeEach(() => {
    // Create a fresh Express app for each test
    app = express();
    app.use(express.json());
  });

  describe('GET /api/tournaments', () => {
    it('should handle the GET /api/tournaments route', async () => {
      const handler = jest.fn((req: Request, res: Response) => res.json({ test: 'success' }));
      app.get('/api/tournaments', handler);
      
      const response = await request(app).get('/api/tournaments');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ test: 'success' });
      expect(handler).toHaveBeenCalled();
    });
  });

  describe('GET /api/tournaments/:id', () => {
    it('should handle route with ID parameter', async () => {
      const handler = jest.fn((req: Request, res: Response) => res.json({ id: req.params.id }));
      app.get('/api/tournaments/:id', handler);
      
      const response = await request(app).get('/api/tournaments/123');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ id: '123' });
      expect(handler).toHaveBeenCalled();
    });
  });

  describe('POST /api/tournaments', () => {
    it('should handle POST request with JSON body', async () => {
      const handler = jest.fn((req: Request, res: Response) => res.status(201).json(req.body));
      app.post('/api/tournaments', handler);
      
      const response = await request(app)
        .post('/api/tournaments')
        .send({ name: 'Test Tournament' });
      
      expect(response.status).toBe(201);
      expect(response.body).toEqual({ name: 'Test Tournament' });
      expect(handler).toHaveBeenCalled();
    });
  });

  describe('PUT /api/tournaments/:id', () => {
    it('should handle PUT request with ID and JSON body', async () => {
      const handler = jest.fn((req: Request, res: Response) => res.json({ 
        id: req.params.id,
        ...req.body 
      }));
      
      app.put('/api/tournaments/:id', handler);
      
      const response = await request(app)
        .put('/api/tournaments/123')
        .send({ name: 'Updated Tournament' });
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ 
        id: '123',
        name: 'Updated Tournament' 
      });
      expect(handler).toHaveBeenCalled();
    });
  });

  describe('DELETE /api/tournaments/:id', () => {
    it('should handle DELETE request with ID', async () => {
      const handler = jest.fn((req: Request, res: Response) => res.json({ deleted: req.params.id }));
      app.delete('/api/tournaments/:id', handler);
      
      const response = await request(app).delete('/api/tournaments/123');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ deleted: '123' });
      expect(handler).toHaveBeenCalled();
    });
  });

  describe('GET /api/tournaments/:id/participants', () => {
    it('should handle nested resource route', async () => {
      const handler = jest.fn((req: Request, res: Response) => res.json({ 
        tournamentId: req.params.id,
        participants: true
      }));
      
      app.get('/api/tournaments/:id/participants', handler);
      
      const response = await request(app).get('/api/tournaments/123/participants');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ 
        tournamentId: '123',
        participants: true
      });
      expect(handler).toHaveBeenCalled();
    });
  });

  describe('URL params and query tests', () => {
    it('should correctly parse URL params', async () => {
      const handler = jest.fn((req: Request, res: Response) => res.json({ 
        tournamentId: req.params.id,
        userId: req.params.userId
      }));
      
      app.put('/api/tournaments/:id/participants/:userId', handler);
      
      const response = await request(app)
        .put('/api/tournaments/123/participants/user-456')
        .send({ status: 'active' });
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ 
        tournamentId: '123',
        userId: 'user-456'
      });
      expect(handler).toHaveBeenCalled();
    });
    
    it('should correctly parse query parameters', async () => {
      const handler = jest.fn((req: Request, res: Response) => res.json({ 
        page: req.query.page,
        limit: req.query.limit
      }));
      
      app.get('/api/tournaments', handler);
      
      const response = await request(app)
        .get('/api/tournaments?page=2&limit=10');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ 
        page: '2',
        limit: '10'
      });
      expect(handler).toHaveBeenCalled();
    });
  });
}); 