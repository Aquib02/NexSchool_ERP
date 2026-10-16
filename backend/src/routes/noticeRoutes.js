import { Router } from 'express';
import * as noticeController from '../controllers/noticeController.js';
import { authenticate, checkPermission } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

// Permission check helper for notice management (supports notices:* and communication:* permissions)
const canManageNotices = (action) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }
    if (req.user.role.name === 'SUPER_ADMIN') {
      return next();
    }
    const permissions = req.user.role.permissions || [];
    const hasPerm = permissions.some((perm) => {
      const code = perm.code || '';
      return (
        code === `notices:${action}` ||
        code === `communication:${action}` ||
        code === 'communication:broadcast' ||
        code === '*:*'
      );
    });

    if (hasPerm) return next();

    return res.status(403).json({
      success: false,
      message: `Access denied: You do not have permission (${action}) for campus notices and circulars.`,
    });
  };
};

// All authenticated users can view notices
router.get('/', noticeController.getNotices);
router.get('/:id', noticeController.getNoticeById);

// Staff and Admins can create and edit notices via RBAC
router.post('/', canManageNotices('create'), noticeController.createNotice);
router.put('/:id', canManageNotices('update'), noticeController.updateNotice);
router.delete('/:id', canManageNotices('delete'), noticeController.deleteNotice);

export default router;
