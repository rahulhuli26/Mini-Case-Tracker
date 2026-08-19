import express from 'express';
import User from '../models/User.js';
import { protect, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/agents', protect, requireRole('Manager'), async (req, res, next) => {
  try {
    const users = await User.find({ role: 'Agent', isActive: true }).select('_id name email');
    res.json(users);
  } catch (error) {
    next(error);
  }
});

export default router;
