import express from 'express';
import { jobController } from './controller';
import { requireAuth } from '../middleware/auth';
import { requireAdmin } from '../middleware/admin';

// Create router for job management
const router = express.Router();

// Require authentication and admin privileges for all job routes
router.use(requireAuth);
router.use(requireAdmin);

// Job management routes
router.get('/', jobController.getAllJobs);
router.get('/:id', jobController.getJobById);
router.get('/:id/history', jobController.getJobHistory);
router.post('/:id/execute', jobController.executeJob);

export const jobRoutes = router; 