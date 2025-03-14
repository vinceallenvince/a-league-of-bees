import { Router, Request, Response } from 'express';
import { storage } from '../../core/storage';
import { insertUserSchema } from '@shared/schema';
import logger from '../../core/logger';
import { requireAuth } from '../../core/middleware/auth';

const router = Router();

// Get profile
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = await storage.getUser(req.session.userId!);
    res.json(user);
  } catch (error) {
    logger.error('Error fetching profile', { error });
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update profile
router.put('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const result = await insertUserSchema.safeParseAsync(req.body);
    if (!result.success) {
      return res.status(400).json({ error: "Invalid input", details: result.error.errors });
    }
    
    const userData = result.data;
    // Ensure user cannot change their own admin status
    delete userData.isAdmin;
    
    const updatedUser = await storage.updateUser(req.session.userId!, userData);
    res.json(updatedUser);
  } catch (error) {
    logger.error('Error updating profile', { error });
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router; 