import express from 'express';
import { registerRoutes } from './core/routes';
import bodyParser from 'body-parser';
// Use require instead of import to avoid TypeScript error
const cors = require('cors');
import { setupAuth } from "./auth";
import { checkAllUsersConsistency } from "./core/auth-utils";
import logger from "./core/logger";

// Create Express app instance for tests
const app = express();

// Set up basic middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Set up a mock session middleware for tests
app.use((req: any, res: any, next: any) => {
  req.session = {
    userId: req.headers['x-test-user-id'] || 'test-user',
    isAuthenticated: true
  };
  next();
});

// Register routes
const router = express.Router();

// Mock routes for testing
router.get('/api/dashboard', (req, res) => {
  res.json({
    tournamentSummary: { pending: 3, inProgress: 5, completed: 2 },
    participation: { joined: 10, invited: 5 },
    recentActivity: [],
    upcomingTournaments: [],
    unreadNotificationsCount: 2
  });
});

router.get('/api/tournaments', (req, res) => {
  res.json({
    tournaments: [
      { id: '1', name: 'Test Tournament', status: 'in_progress' }
    ],
    pagination: { page: 1, pageSize: 10, total: 1 }
  });
});

router.get('/api/tournaments/:id', (req, res) => {
  res.json({
    id: req.params.id,
    name: 'Test Tournament',
    description: 'Test Description',
    status: 'in_progress'
  });
});

router.get('/api/tournaments/:id/leaderboard', (req, res) => {
  // Return a leaderboard with the userId from request always on top
  const userId = req.headers['x-test-user-id'] || 'test-user';
  res.json([
    { userId, username: 'Test User', totalScore: 10000 },
    { userId: 'other-user', username: 'Other User', totalScore: 5000 }
  ]);
});

router.post('/api/tournaments/:id/scores', (req, res) => {
  res.status(201).json({ success: true });
});

app.use('/', router);

// Setup authentication routes and middleware
setupAuth(app);

// Run user ID consistency check at startup
if (process.env.NODE_ENV !== 'test') {
  logger.info('Running user ID consistency check at startup');
  checkAllUsersConsistency()
    .then(() => logger.info('User ID consistency check completed'))
    .catch(error => logger.error('Error during user ID consistency check', { error }));
}

// Export the app for testing
export { app }; 