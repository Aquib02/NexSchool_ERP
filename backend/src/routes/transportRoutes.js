import { Router } from 'express';
import * as transportController from '../controllers/transportController.js';
import { authenticate, checkPermission } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

// Fleet Vehicles
router.get('/vehicles', checkPermission('transport:view'), transportController.getVehicles);
router.post('/vehicles', checkPermission('transport:create'), transportController.createVehicle);
router.put('/vehicles/:id', checkPermission('transport:update'), transportController.updateVehicle);

// Routes & Stops
router.get('/routes', checkPermission('transport:view'), transportController.getRoutes);
router.post('/routes', checkPermission('transport:create'), transportController.createRoute);
router.put('/routes/:id', checkPermission('transport:update'), transportController.updateRoute);

// Student Seat Allocations
router.post('/allocations', checkPermission('transport:create'), transportController.allocateTransport);
router.get('/allocations', checkPermission('transport:view'), transportController.getTransportAllocations);
router.put('/allocations/:id/status', checkPermission('transport:update'), transportController.updateAllocationStatus);

export default router;
