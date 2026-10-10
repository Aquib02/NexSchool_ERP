import { Router } from 'express';
import * as securityController from '../controllers/securityController.js';
import { authenticate, checkPermission } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

// Visitor Passes
router.get('/visitors', checkPermission('security:view'), securityController.getVisitors);
router.post('/visitors', checkPermission('security:create'), securityController.createVisitorPass);
router.put('/visitors/:id/checkout', checkPermission('security:update'), securityController.checkoutVisitor);

// Student & Staff Gate Passes
router.get('/gate-passes', checkPermission('security:view'), securityController.getGatePasses);
router.post('/gate-passes', checkPermission('security:create'), securityController.createGatePass);
router.put('/gate-passes/:id/status', checkPermission('security:update'), securityController.updateGatePassStatus);

// Security Incidents
router.get('/incidents', checkPermission('security:view'), securityController.getSecurityIncidents);
router.post('/incidents', checkPermission('security:create'), securityController.createSecurityIncident);
router.put('/incidents/:id/status', checkPermission('security:update'), securityController.updateIncidentStatus);

export default router;
