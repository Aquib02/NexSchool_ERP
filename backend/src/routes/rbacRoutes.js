import { Router } from 'express';
import * as rbacController from '../controllers/rbacController.js';
import { authenticate, authorizeRoles } from '../middleware/authMiddleware.js';

const router = Router();

// All RBAC endpoints require authentication and Super Admin / Administrator role
router.use(authenticate);
router.use(authorizeRoles('SUPER_ADMIN', 'ADMINISTRATOR'));

router.get('/roles', rbacController.getRoles);
router.get('/roles/:id', rbacController.getRoleById);
router.post('/roles', rbacController.createRole);
router.put('/roles/:id', rbacController.updateRole);

router.get('/permissions', rbacController.getPermissions);
router.post('/permissions', rbacController.createPermission);

router.get('/users', rbacController.getUsers);
router.post('/users', rbacController.createUser);
router.put('/users/:id', rbacController.updateUserRole);

export default router;
