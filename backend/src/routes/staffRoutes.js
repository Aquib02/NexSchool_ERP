import { Router } from 'express';
import * as staffController from '../controllers/staffController.js';
import { authenticate, checkPermission } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

// Security boundary: Students are strictly blocked from HR & staff records
router.use((req, res, next) => {
  if (req.user?.role?.name === 'STUDENT') {
    return res.status(403).json({
      success: false,
      message: 'Students are not authorized to access Staff or Human Resources operations',
    });
  }
  next();
});

// Departments & Designations
router.get('/departments', checkPermission('staff:view'), staffController.getDepartments);
router.post('/departments', checkPermission('staff:create'), staffController.createDepartment);
router.get('/designations', checkPermission('staff:view'), staffController.getDesignations);
router.post('/designations', checkPermission('staff:create'), staffController.createDesignation);

// Employees Directory
router.get('/employees', checkPermission('staff:view'), staffController.getEmployees);
router.post('/employees', checkPermission('staff:create'), staffController.createEmployee);
router.get('/employees/:id', checkPermission('staff:view'), staffController.getEmployeeById);
router.put('/employees/:id', checkPermission('staff:update'), staffController.updateEmployee);

// Staff Leaves
router.post('/leaves', staffController.submitLeaveRequest); // Staff can apply for own leave
router.get('/leaves', checkPermission('staff:view'), staffController.getLeaveRequests);
router.put('/leaves/:id/review', checkPermission('staff:update'), staffController.reviewLeaveRequest);

// Payroll
router.post('/payroll/generate', checkPermission('payroll:create'), staffController.generatePayroll);
router.get('/payroll', checkPermission('payroll:view'), staffController.getPayrolls);
router.put('/payroll/:id/status', checkPermission('payroll:approve'), staffController.updatePayrollStatus);

export default router;
