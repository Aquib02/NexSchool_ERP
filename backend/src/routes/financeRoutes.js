import { Router } from 'express';
import * as financeController from '../controllers/financeController.js';
import { authenticate, checkPermission } from '../middleware/authMiddleware.js';

const router = Router();

// All finance routes require active user authentication
router.use(authenticate);

// 1. Fee Structures
router.post('/structures', checkPermission('fees:create'), financeController.createFeeStructure);
router.get('/structures', checkPermission('fees:view'), financeController.getFeeStructures);
router.put('/structures/:id', checkPermission('fees:update'), financeController.updateFeeStructure);

// 2. Invoicing & Billing
router.post('/invoices/generate', checkPermission('fees:create'), financeController.generateInvoices);
router.get('/invoices', checkPermission('fees:view'), financeController.getStudentFees);
router.get('/invoices/:id', checkPermission('fees:view'), financeController.getStudentFeeById);
router.post('/invoices/:id/discount', checkPermission('fees:update'), financeController.applyDiscountOrWaiver);

// 3. Payments & Receipts
router.post('/payments/collect', checkPermission('fees:create'), financeController.collectPayment);
router.get('/payments', checkPermission('fees:view'), financeController.getPayments);
router.get('/receipts', checkPermission('fees:view'), financeController.getReceipts);
router.get('/receipts/:id', checkPermission('fees:view'), financeController.getReceiptById);

// 4. Defaulters & Analytics
router.get('/defaulters', checkPermission('fees:view'), financeController.getDefaulters);
router.get('/overview', checkPermission('fees:view'), financeController.getFinancialOverview);

// 5. Institutional Expenses
router.post('/expenses', checkPermission('fees:create'), financeController.createExpense);
router.get('/expenses', checkPermission('fees:view'), financeController.getExpenses);
router.put('/expenses/:id/status', checkPermission('fees:approve'), financeController.updateExpenseStatus);

export default router;
