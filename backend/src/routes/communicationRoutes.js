import { Router } from 'express';
import * as commController from '../controllers/communicationController.js';
import { authenticate, checkPermission } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

// WhatsApp & SMS Logs and Broadcast
router.get('/logs', checkPermission('communication:view'), commController.getCommunicationLogs);
router.post('/broadcast', checkPermission('communication:broadcast'), commController.sendBroadcast);
router.post('/trigger-alert', checkPermission('communication:broadcast'), commController.triggerAutomatedAlert);

// PTM Slots
router.get('/ptm', checkPermission('communication:view'), commController.getPTMSlots);
router.post('/ptm', checkPermission('communication:ptm'), commController.createPTMSlot);
router.post('/ptm/:id/book', checkPermission('communication:ptm'), commController.bookPTMSlot);

// Chat & Channels
router.get('/chat', checkPermission('communication:chat'), commController.getChatMessages);
router.post('/chat', checkPermission('communication:chat'), commController.sendChatMessage);

export default router;
