import { Router } from 'express';
import { globalSearch } from '../controllers/searchController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

// Protect search with authentication
router.use(authenticate);

// GET /api/v1/search?q=...
router.get('/', globalSearch);

export default router;
