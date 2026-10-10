import { Router } from 'express';
import * as medicalController from '../controllers/medicalController.js';
import { authenticate, checkPermission } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

// Student Medical Records
router.get('/records', checkPermission('medical:view'), medicalController.getMedicalRecords);
router.get('/records/student/:studentId', checkPermission('medical:view'), medicalController.getMedicalRecordByStudent);
router.post('/records', checkPermission('medical:update'), medicalController.upsertMedicalRecord);

// Clinic Visits
router.get('/visits', checkPermission('medical:view'), medicalController.getMedicalVisits);
router.post('/visits', checkPermission('medical:create'), medicalController.createMedicalVisit);
router.put('/visits/:id/status', checkPermission('medical:update'), medicalController.updateMedicalVisitStatus);

// Medicine Inventory
router.get('/inventory', checkPermission('medical:view'), medicalController.getMedicineInventory);
router.post('/inventory', checkPermission('medical:create'), medicalController.createMedicineItem);
router.put('/inventory/:id', checkPermission('medical:update'), medicalController.updateMedicineItem);

export default router;
