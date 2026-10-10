import { Router } from 'express';
import * as itHelpdeskController from '../controllers/itHelpdeskController.js';
import { authenticate, checkPermission } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

// IT Assets
router.get('/assets', checkPermission('it:view'), itHelpdeskController.getAssets);
router.post('/assets', checkPermission('it:create'), itHelpdeskController.createAsset);
router.put('/assets/:id', checkPermission('it:update'), itHelpdeskController.updateAsset);

// Helpdesk Tickets
router.get('/tickets', checkPermission('it:view'), itHelpdeskController.getTickets);
router.post('/tickets', checkPermission('it:create'), itHelpdeskController.createTicket);
router.put('/tickets/:id/status', checkPermission('it:update'), itHelpdeskController.updateTicketStatus);
router.post('/tickets/:id/comments', checkPermission('it:create'), itHelpdeskController.addTicketComment);

export default router;
