import express from 'express';
import { requireAdmin, requireAuth } from '../auth.js';
import { UserService } from '../services/UserService.js';

const router = express.Router();

router.post('/clear-force-password', requireAuth, async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    await UserService.clearForcePassword(userId);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.post('/', requireAdmin, async (req, res, next) => {
  try {
    const changedBy = req.headers['x-user-id'] as string || null;
    const user = await UserService.createUser({ ...req.body, changedBy });
    res.status(200).json({ success: true, user });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const changedBy = req.headers['x-user-id'] as string || null;
    await UserService.updateUser(id, { ...req.body, changedBy });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const changedBy = req.headers['x-user-id'] as string || null;
    await UserService.deleteUser(id, changedBy);
    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/reset-password', requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    const changedBy = req.headers['x-user-id'] as string || null;
    await UserService.resetPassword(id, password, changedBy);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
