import { Router } from 'express';
import * as libraryController from '../controllers/libraryController.js';
import { authenticate, checkPermission } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

// Book Catalog
router.get('/books', checkPermission('library:view'), libraryController.getBooks);
router.post('/books', checkPermission('library:create'), libraryController.createBook);
router.get('/books/:id', checkPermission('library:view'), libraryController.getBookById);
router.put('/books/:id', checkPermission('library:update'), libraryController.updateBook);
router.delete('/books/:id', checkPermission('library:delete'), libraryController.deleteBook);

// Transactions (Issue / Return)
router.post('/issue', checkPermission('library:create'), libraryController.issueBook);
router.post('/return/:id', checkPermission('library:update'), libraryController.returnBook);
router.get('/transactions', checkPermission('library:view'), libraryController.getTransactions);

export default router;
