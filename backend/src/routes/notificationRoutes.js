import { Router } from 'express';
import * as notificationController from '../controllers/notificationController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

// User notification center
router.get('/', notificationController.getUserNotifications);
router.put('/:id/read', notificationController.markAsRead);

// Broadcast
const canBroadcast = (req, res, next) => {
  if (['SUPER_ADMIN', 'PRINCIPAL', 'ADMINISTRATOR'].includes(req.user?.role?.name)) {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Access denied: Broadcast privileges required',
  });
};

router.post('/broadcast', canBroadcast, notificationController.createBroadcastNotification);

export default router;
