import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import request from 'supertest';
import express, { Express, Request, Response } from 'express';
import { tournamentRoutes } from '../../../../server/features/tournament/routes';

// Mock the controllers
jest.mock('../../../../server/features/tournament/controllers/tournament', () => ({
  tournamentController: {
    getTournamentsHandler: jest.fn((req: Request, res: Response) => res.json({ mock: 'getTournaments' })),
    getTournamentByIdHandler: jest.fn((req: Request, res: Response) => res.json({ mock: 'getTournamentById' })),
    createTournamentHandler: jest.fn((req: Request, res: Response) => res.status(201).json({ mock: 'createTournament' })),
    updateTournamentHandler: jest.fn((req: Request, res: Response) => res.json({ mock: 'updateTournament' })),
    cancelTournamentHandler: jest.fn((req: Request, res: Response) => res.json({ mock: 'cancelTournament' }))
  }
}));

jest.mock('../../../../server/features/tournament/controllers/participant', () => ({
  participantController: {
    getTournamentParticipantsHandler: jest.fn((req: Request, res: Response) => res.json({ mock: 'getTournamentParticipants' })),
    inviteParticipantsHandler: jest.fn((req: Request, res: Response) => res.json({ mock: 'inviteParticipants' })),
    joinTournamentHandler: jest.fn((req: Request, res: Response) => res.json({ mock: 'joinTournament' })),
    updateParticipantStatusHandler: jest.fn((req: Request, res: Response) => res.json({ mock: 'updateParticipantStatus' }))
  }
}));

jest.mock('../../../../server/features/tournament/controllers/score', () => ({
  scoreController: {
    submitScoreHandler: jest.fn((req: Request, res: Response) => res.status(201).json({ mock: 'submitScore' })),
    updateScoreHandler: jest.fn((req: Request, res: Response) => res.json({ mock: 'updateScore' })),
    getScoreHistoryHandler: jest.fn((req: Request, res: Response) => res.json({ mock: 'getScoreHistory' })),
    getLeaderboardHandler: jest.fn((req: Request, res: Response) => res.json({ mock: 'getLeaderboard' }))
  }
}));

// Mock middleware
jest.mock('../../../../server/core/middleware/auth', () => ({
  requireAuth: (req: Request, res: Response, next: Function) => {
    req.session = { userId: 'test-user-id' } as any;
    next();
  }
}));

describe('Tournament Routes', () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/tournaments', tournamentRoutes);
  });

  describe('GET /api/tournaments', () => {
    it('should route to getTournamentsHandler', async () => {
      const response = await request(app).get('/api/tournaments');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ mock: 'getTournaments' });
    });
  });

  describe('GET /api/tournaments/:id', () => {
    it('should route to getTournamentByIdHandler', async () => {
      const response = await request(app).get('/api/tournaments/test-id');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ mock: 'getTournamentById' });
    });
  });

  describe('POST /api/tournaments', () => {
    it('should route to createTournamentHandler', async () => {
      const response = await request(app)
        .post('/api/tournaments')
        .send({ name: 'Test Tournament' });
      
      expect(response.status).toBe(201);
      expect(response.body).toEqual({ mock: 'createTournament' });
    });
  });

  describe('PUT /api/tournaments/:id', () => {
    it('should route to updateTournamentHandler', async () => {
      const response = await request(app)
        .put('/api/tournaments/test-id')
        .send({ name: 'Updated Tournament' });
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ mock: 'updateTournament' });
    });
  });

  describe('DELETE /api/tournaments/:id', () => {
    it('should route to cancelTournamentHandler', async () => {
      const response = await request(app).delete('/api/tournaments/test-id');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ mock: 'cancelTournament' });
    });
  });

  describe('GET /api/tournaments/:id/participants', () => {
    it('should route to getTournamentParticipantsHandler', async () => {
      const response = await request(app).get('/api/tournaments/test-id/participants');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ mock: 'getTournamentParticipants' });
    });
  });

  describe('POST /api/tournaments/:id/invite', () => {
    it('should route to inviteParticipantsHandler', async () => {
      const response = await request(app)
        .post('/api/tournaments/test-id/invite')
        .send({ emails: ['user1@example.com'] });
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ mock: 'inviteParticipants' });
    });
  });

  describe('POST /api/tournaments/:id/join', () => {
    it('should route to joinTournamentHandler', async () => {
      const response = await request(app).post('/api/tournaments/test-id/join');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ mock: 'joinTournament' });
    });
  });

  describe('PUT /api/tournaments/:id/participants/:userId', () => {
    it('should route to updateParticipantStatusHandler', async () => {
      const response = await request(app)
        .put('/api/tournaments/test-id/participants/user-id')
        .send({ status: 'declined' });
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ mock: 'updateParticipantStatus' });
    });
  });

  describe('POST /api/tournaments/:id/scores', () => {
    it('should route to submitScoreHandler', async () => {
      const response = await request(app)
        .post('/api/tournaments/test-id/scores')
        .send({ day: 1, score: 100 });
      
      expect(response.status).toBe(201);
      expect(response.body).toEqual({ mock: 'submitScore' });
    });
  });

  describe('PUT /api/tournaments/:id/scores/:day', () => {
    it('should route to updateScoreHandler', async () => {
      const response = await request(app)
        .put('/api/tournaments/test-id/scores/1')
        .send({ score: 150 });
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ mock: 'updateScore' });
    });
  });

  describe('GET /api/tournaments/:id/scores', () => {
    it('should route to getScoreHistoryHandler', async () => {
      const response = await request(app).get('/api/tournaments/test-id/scores');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ mock: 'getScoreHistory' });
    });
  });

  describe('GET /api/tournaments/:id/leaderboard', () => {
    it('should route to getLeaderboardHandler', async () => {
      const response = await request(app).get('/api/tournaments/test-id/leaderboard');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ mock: 'getLeaderboard' });
    });
  });
}); 