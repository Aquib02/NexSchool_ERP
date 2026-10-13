import { Router } from 'express';
import * as certController from '../controllers/certificateController.js';
import { authenticate, checkPermission } from '../middleware/authMiddleware.js';

const router = Router();

// Public verification endpoint
router.get('/verify/:code', certController.verifyCertificate);

// Protected routes
router.use(authenticate);
router.get('/', checkPermission('certificates:view'), certController.getCertificates);
router.post('/generate', checkPermission('certificates:create'), certController.generateCertificate);
router.get('/id-cards', checkPermission('certificates:view'), certController.generateBulkIDCards);
router.get('/hall-tickets', checkPermission('certificates:view'), certController.generateExamHallTickets);

export default router;
