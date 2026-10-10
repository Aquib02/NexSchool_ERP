import { Router } from 'express';
import * as auditController from '../controllers/auditController.js';
import { authenticate, authorizeRoles, checkPermission } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

// Super Admin or Principal access only
const allowAuditView = (req, res, next) => {
  if (
    ['SUPER_ADMIN', 'PRINCIPAL'].includes(req.user?.role?.name) ||
    req.user?.role?.permissions?.some((p) => p.code === 'audit:view')
  ) {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Access denied: Audit log viewing requires SUPER_ADMIN or PRINCIPAL privileges',
  });
};

router.get('/', allowAuditView, auditController.getAuditLogs);
router.get('/stats', allowAuditView, auditController.getAuditStats);
router.get('/export', allowAuditView, auditController.exportAuditLogs);

export default router;
