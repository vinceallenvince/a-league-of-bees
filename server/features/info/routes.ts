import { Router, Request, Response } from 'express';
import logger from '../../core/logger';

const router = Router();

// Get application info
router.get('/', async (_req: Request, res: Response) => {
  try {
    const info = {
      name: 'Web Auth Scaffold',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      features: ['Authentication', 'User Profiles', 'Admin Management']
    };
    
    res.json(info);
  } catch (error) {
    logger.error('Error fetching application info', { error });
    res.status(500).json({ error: 'Failed to fetch application info' });
  }
});

// Get server health status
router.get('/health', (_req: Request, res: Response) => {
  try {
    const health = {
      status: 'UP',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    };
    
    res.json(health);
  } catch (error) {
    logger.error('Error checking health', { error });
    res.status(500).json({ error: 'Failed to check health' });
  }
});

export default router; 