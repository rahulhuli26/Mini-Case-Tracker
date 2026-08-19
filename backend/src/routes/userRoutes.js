import express from 'express';
import User from '../models/User.js';
import { protect, requireRole } from '../middleware/authMiddleware.js';

/** @file User-related routes (agent lookup) mounted at `/api/users`. */

const router = express.Router();

/**
 * GET /api/users/agents
 * Manager-only. Returns the id, name, and email of every active `Agent`,
 * used to populate case assignment dropdowns.
 */
router.get('/agents', protect, requireRole('Manager'), async (req, res, next) => {
  try {
    const users = await User.find({ role: 'Agent', isActive: true }).select('_id name email');
    res.json(users);
  } catch (error) {
    next(error);
  }
});

export default router;
