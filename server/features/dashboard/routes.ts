import express from 'express';
import { requireAuth } from '../../core/middleware/auth';
import { dashboardController } from './controllers/dashboardController';

// Create a router for dashboard routes
const router = express.Router();

// Dashboard route
router.get('/', requireAuth, dashboardController.getDashboardHandler);

// Export the router
export const dashboardRoutes = router; 