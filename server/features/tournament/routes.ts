import express from 'express';
import { requireAuth } from '../../core/middleware/auth';
import { tournamentController } from './controllers/tournament';
import { participantController } from './controllers/participant';
import { scoreController } from './controllers/score';
import { dashboardController } from './controllers/dashboard';
import { notificationController } from './controllers/notification';

// Create a router for tournament routes
const router = express.Router();

// Tournament routes
router.get('/', requireAuth, tournamentController.getTournamentsHandler);
router.get('/:id', requireAuth, tournamentController.getTournamentByIdHandler);
router.post('/', requireAuth, tournamentController.createTournamentHandler);
router.put('/:id', requireAuth, tournamentController.updateTournamentHandler);
router.delete('/:id', requireAuth, tournamentController.cancelTournamentHandler);

// Participant routes
router.get('/:id/participants', requireAuth, participantController.getTournamentParticipantsHandler);
router.post('/:id/invite', requireAuth, participantController.inviteParticipantsHandler);
router.post('/:id/join', requireAuth, participantController.joinTournamentHandler);
router.put('/:id/participants/:userId', requireAuth, participantController.updateParticipantStatusHandler);

// Score routes
router.post('/:id/scores', requireAuth, scoreController.submitScoreHandler);
router.put('/:id/scores/:day', requireAuth, scoreController.updateScoreHandler);
router.get('/:id/scores', requireAuth, scoreController.getScoreHistoryHandler);
router.get('/:id/leaderboard', requireAuth, scoreController.getLeaderboardHandler);

// Dashboard route - will be registered at /api/tournaments/dashboard
router.get('/dashboard', requireAuth, dashboardController.getDashboardHandler);

// Notification routes - will be registered at /api/tournaments/notifications
router.get('/notifications', requireAuth, notificationController.getNotificationsHandler);
router.put('/notifications/read', requireAuth, notificationController.markAsReadHandler);

// Export the router
export const tournamentRoutes = router; 