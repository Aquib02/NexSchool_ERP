import { Router } from 'express';
import * as portalController from '../controllers/portalController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

// Student Self-Service Portal
router.get('/student', portalController.getStudentPortalData);
router.get('/student/attendance', portalController.getStudentAttendanceHistory);

// Parent Self-Service Portal (with child switcher)
router.get('/parent', portalController.getParentPortalData);

export default router;
