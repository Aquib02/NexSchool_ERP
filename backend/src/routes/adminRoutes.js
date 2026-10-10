import { Router } from 'express';
import * as adminController from '../controllers/adminController.js';
import { authenticate, authorizeRoles } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

// Publicly accessible within authenticated users (for dropdowns)
router.get('/sessions', adminController.getSessions);
router.get('/classes', adminController.getClasses);
router.get('/sections', adminController.getSections);
router.get('/subjects', adminController.getSubjects);
router.get('/departments', adminController.getDepartments);
router.get('/designations', adminController.getDesignations);
router.get('/notices', adminController.getNotices);
router.get('/stats', adminController.getSystemStats);

// Administrative write routes (SUPER_ADMIN, PRINCIPAL, ADMINISTRATOR only)
router.use(authorizeRoles('SUPER_ADMIN', 'PRINCIPAL', 'ADMINISTRATOR'));

router.post('/sessions', adminController.createSession);
router.put('/sessions/:id', adminController.updateSession);

router.post('/classes', adminController.createClass);
router.put('/classes/:id', adminController.updateClass);

router.post('/sections', adminController.createSection);
router.put('/sections/:id', adminController.updateSection);

router.post('/subjects', adminController.createSubject);
router.put('/subjects/:id', adminController.updateSubject);

router.post('/departments', adminController.createDepartment);
router.post('/designations', adminController.createDesignation);

router.post('/notices', adminController.createNotice);
router.delete('/notices/:id', adminController.deleteNotice);

export default router;
