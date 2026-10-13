import { Router } from 'express';
import * as studentController from '../controllers/studentController.js';
import { authenticate, checkPermission } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/', checkPermission('students:view'), studentController.getStudents);
router.get('/export', checkPermission('students:export'), studentController.exportStudents);
router.get('/:id', (req, res, next) => {
  if (req.user?.role?.name === 'STUDENT' && req.user?.studentId?.toString() === req.params.id) {
    return next();
  }
  return checkPermission('students:view')(req, res, next);
}, studentController.getStudentById);

router.post('/', checkPermission('students:create'), studentController.createStudent);
router.put('/:id', checkPermission('students:update'), studentController.updateStudent);
router.patch('/:id/status', checkPermission('students:update'), studentController.updateStudentStatus);

export default router;
