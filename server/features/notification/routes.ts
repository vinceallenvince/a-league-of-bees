import express from 'express';
import { requireAuth } from '../../core/middleware/auth';
import { notificationController } from './controllers/notificationController';

// Create a router for notification routes
const router = express.Router();

// Notification routes
router.get('/', requireAuth, notificationController.getNotificationsHandler);
router.put('/read', requireAuth, notificationController.markAsReadHandler);

// Export the router
export const notificationRoutes = router; 