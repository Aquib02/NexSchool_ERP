import { Router } from 'express';
import * as facilitiesController from '../controllers/facilitiesController.js';
import { authenticate, checkPermission } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

// Housekeeping Areas
router.get('/areas', checkPermission('housekeeping:view'), facilitiesController.getHousekeepingAreas);
router.post('/areas', checkPermission('housekeeping:create'), facilitiesController.createHousekeepingArea);
router.put('/areas/:id', checkPermission('housekeeping:update'), facilitiesController.updateHousekeepingArea);

// Housekeeping Tasks & Rosters
router.get('/tasks', checkPermission('housekeeping:view'), facilitiesController.getHousekeepingTasks);
router.post('/tasks', checkPermission('housekeeping:create'), facilitiesController.createHousekeepingTask);
router.put('/tasks/:id', checkPermission('housekeeping:update'), facilitiesController.updateHousekeepingTask);

// Cleaning Supplies
router.get('/supplies', checkPermission('housekeeping:view'), facilitiesController.getCleaningSupplies);
router.post('/supplies', checkPermission('housekeeping:create'), facilitiesController.createCleaningSupply);
router.put('/supplies/:id', checkPermission('housekeeping:update'), facilitiesController.updateCleaningSupply);

export default router;
