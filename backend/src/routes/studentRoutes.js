import { Router } from 'express';
import * as studentController from '../controllers/studentController.js';
import { authenticate, checkPermission } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/', checkPermission('students:view'), studentController.getStudents);
router.get('/export', checkPermission('students:export'), studentController.exportStudents);
router.get('/:id', checkPermission('students:view'), studentController.getStudentById);

router.post('/', checkPermission('students:create'), studentController.createStudent);
router.put('/:id', checkPermission('students:update'), studentController.updateStudent);
router.patch('/:id/status', checkPermission('students:update'), studentController.updateStudentStatus);

export default router;
