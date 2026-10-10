import { Router } from 'express';
import * as noticeController from '../controllers/noticeController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

// Role guard for managing circulars
const canManageNotices = (req, res, next) => {
  const allowedRoles = ['SUPER_ADMIN', 'PRINCIPAL', 'ADMINISTRATOR', 'TEACHER'];
  if (allowedRoles.includes(req.user?.role?.name)) {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Access denied: You do not have permission to publish or edit campus notices',
  });
};

// All authenticated users can view notices
router.get('/', noticeController.getNotices);
router.get('/:id', noticeController.getNoticeById);

// Staff and Admins can create and edit notices
router.post('/', canManageNotices, noticeController.createNotice);
router.put('/:id', canManageNotices, noticeController.updateNotice);
router.delete('/:id', canManageNotices, noticeController.deleteNotice);

export default router;
