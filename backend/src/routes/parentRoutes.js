import { Router } from 'express';
import * as parentController from '../controllers/parentController.js';
import { authenticate, checkPermission } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/', checkPermission('students:view'), parentController.getParents);
router.get('/:id', checkPermission('students:view'), parentController.getParentById);
router.post('/', checkPermission('students:create'), parentController.createParent);
router.put('/:id', checkPermission('students:update'), parentController.updateParent);
router.post('/link', checkPermission('students:update'), parentController.linkStudentToParent);

export default router;
