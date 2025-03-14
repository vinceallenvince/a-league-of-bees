import { Router, Request, Response } from 'express';
import { storage } from '../../core/storage';
import logger from '../../core/logger';
import { requireAdmin } from '../../core/middleware/auth';

const router = Router();

// Get all users (admin only)
router.get('/users', requireAdmin, async (req: Request, res: Response) => {
  try {
    const users = await storage.getAllUsers();
    res.json(users);
  } catch (error) {
    logger.error('Error fetching users', { error });
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Delete user (admin only)
router.delete('/users/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    // Prevent admin from deleting themselves
    if (userId === req.session.userId) {
      return res.status(400).json({ error: 'Cannot delete yourself' });
    }
    
    await storage.deleteUser(userId);
    res.status(200).json({ success: true });
  } catch (error) {
    logger.error('Error deleting user', { error, userId: req.params.id });
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Request admin role
router.post('/request', async (req: Request, res: Response) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    await storage.requestAdminRole(req.session.userId);
    res.status(200).json({ success: true });
  } catch (error) {
    logger.error('Error requesting admin role', { error });
    res.status(500).json({ error: 'Failed to request admin role' });
  }
});

// Approve admin role (admin only)
router.post('/approve/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    await storage.approveAdminRole(userId, req.session.userId!);
    res.status(200).json({ success: true });
  } catch (error) {
    logger.error('Error approving admin role', { error, userId: req.params.id });
    res.status(500).json({ error: 'Failed to approve admin role' });
  }
});

export default router; 