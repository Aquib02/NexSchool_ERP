import { Router } from 'express';
import * as trackingController from '../controllers/liveTrackingController.js';
import { authenticate, checkPermission } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

// Fleet Telemetry & Live Map
router.get('/fleet', checkPermission('tracking:view'), trackingController.getFleetStatus);
router.post('/telemetry', checkPermission('tracking:telemetry'), trackingController.updateBusTelemetry);
router.post('/sos', checkPermission('tracking:telemetry'), trackingController.triggerEmergencySOS);

// Boarding Checklists
router.get('/boarding', checkPermission('tracking:boarding'), trackingController.getBoardingChecklist);
router.post('/boarding', checkPermission('tracking:boarding'), trackingController.markStudentBoarding);

export default router;
