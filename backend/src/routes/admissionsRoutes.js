import { Router } from 'express';
import * as admissionsController from '../controllers/admissionsController.js';
import { authenticate, checkPermission } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

// Enquiries
router.post('/enquiries', checkPermission('admissions:create'), admissionsController.createEnquiry);
router.get('/enquiries', checkPermission('admissions:view'), admissionsController.getEnquiries);
router.put('/enquiries/:id/status', checkPermission('admissions:update'), admissionsController.updateEnquiryStatus);

// Applications
router.post('/applications', checkPermission('admissions:create'), admissionsController.createApplication);
router.get('/applications', checkPermission('admissions:view'), admissionsController.getApplications);
router.get('/applications/:id', checkPermission('admissions:view'), admissionsController.getApplicationById);
router.put('/applications/:id/status', checkPermission('admissions:update'), admissionsController.updateApplicationStatus);
router.post('/applications/:id/entrance-marks', checkPermission('admissions:update'), admissionsController.recordEntranceMarks);

// Conversion to Student & Parent profile
router.post('/applications/:id/convert', checkPermission('admissions:approve'), admissionsController.convertToStudent);

export default router;
