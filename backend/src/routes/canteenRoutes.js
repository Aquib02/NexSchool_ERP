import { Router } from 'express';
import * as canteenController from '../controllers/canteenController.js';
import { authenticate, checkPermission } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

// Canteen Menu Items
router.get('/items', checkPermission('canteen:view'), canteenController.getCanteenItems);
router.post('/items', checkPermission('canteen:create'), canteenController.createCanteenItem);
router.put('/items/:id', checkPermission('canteen:update'), canteenController.updateCanteenItem);

// POS Transactions
router.get('/transactions', checkPermission('canteen:view'), canteenController.getTransactions);
router.post('/transactions', checkPermission('canteen:create'), canteenController.createTransaction);

export default router;
