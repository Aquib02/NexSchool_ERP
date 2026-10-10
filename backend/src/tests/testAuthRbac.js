import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { generateTokens } from '../services/authService.js';
import { authorizeRoles, checkPermission } from '../middleware/authMiddleware.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import {
  validateLoginInput,
  validatePasswordChange,
  validateForgotPassword,
  validateResetPassword,
} from '../validators/authValidator.js';
import ENV from '../config/env.js';
import app from '../app.js';

console.log('----------------------------------------------------');
console.log('School ERP - Auth & RBAC Security & Unit Test Suite');
console.log('----------------------------------------------------');

let passed = 0;
let failed = 0;

const assert = (condition, title) => {
  if (condition) {
    console.log(`  ✓ PASS: ${title}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${title}`);
    failed++;
  }
};

const runSuite = async () => {
  try {
    // 1. Password Hashing & Bcrypt Verification
    console.log('\n[Suite 1: Cryptographic Security & Password Hashing]');
    const rawPassword = 'AdminSecurePassword@2026';
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(rawPassword, salt);

    assert(hashedPassword !== rawPassword, 'Password is not stored in plain text');
    assert(hashedPassword.startsWith('$2'), 'Password hashed using bcrypt format');

    const validMatch = await bcrypt.compare(rawPassword, hashedPassword);
    assert(validMatch === true, 'Bcrypt correctly matches valid password');

    const invalidMatch = await bcrypt.compare('WrongPassword@123', hashedPassword);
    assert(invalidMatch === false, 'Bcrypt rejects incorrect password');

    // 2. JWT Token Generation & Verification
    console.log('\n[Suite 2: JWT Access & Refresh Token Architecture]');
    const mockUser = {
      _id: '66e855c3a1b2c3d4e5f6a7b8',
      username: 'admin',
      role: { name: 'SUPER_ADMIN' },
    };

    const tokens = generateTokens(mockUser);
    assert(typeof tokens.accessToken === 'string', 'Access token generated as valid string');
    assert(typeof tokens.refreshToken === 'string', 'Refresh token generated as valid string');

    const decodedAccess = jwt.verify(tokens.accessToken, ENV.JWT_SECRET);
    assert(decodedAccess.id === mockUser._id, 'Decoded JWT payload contains correct user ID');
    assert(decodedAccess.role === 'SUPER_ADMIN', 'Decoded JWT payload contains correct user role');

    // Verify token rejection with wrong secret
    let rejectedWithWrongSecret = false;
    try {
      jwt.verify(tokens.accessToken, 'invalid_secret_key_12345');
    } catch {
      rejectedWithWrongSecret = true;
    }
    assert(rejectedWithWrongSecret === true, 'JWT verification fails when signed with incorrect secret');

    // 3. RBAC authorizeRoles Middleware
    console.log('\n[Suite 3: RBAC Role Authorization Middleware]');
    const roleMiddleware = authorizeRoles('SUPER_ADMIN', 'ADMINISTRATOR');

    // Test 3.1: Super Admin Access
    let superAdminAllowed = false;
    const reqSuperAdmin = { user: { role: { name: 'SUPER_ADMIN' } } };
    roleMiddleware(reqSuperAdmin, {}, (err) => {
      if (!err) superAdminAllowed = true;
    });
    assert(superAdminAllowed === true, 'SUPER_ADMIN passes role authorization');

    // Test 3.2: Administrator Access
    let adminAllowed = false;
    const reqAdmin = { user: { role: { name: 'ADMINISTRATOR' } } };
    roleMiddleware(reqAdmin, {}, (err) => {
      if (!err) adminAllowed = true;
    });
    assert(adminAllowed === true, 'ADMINISTRATOR passes role authorization');

    // Test 3.3: Unauthorized Teacher Access
    let teacherBlocked = false;
    const reqTeacher = { user: { role: { name: 'TEACHER' } } };
    roleMiddleware(reqTeacher, {}, (err) => {
      if (err instanceof ApiError && err.statusCode === 403) {
        teacherBlocked = true;
      }
    });
    assert(teacherBlocked === true, 'TEACHER is blocked with 403 Forbidden on admin role-check');

    // 4. Granular Permission Middleware (checkPermission)
    console.log('\n[Suite 4: Granular Permission-Based Access Control]');
    const feePermissionMiddleware = checkPermission('fees:approve');

    // Test 4.1: User without permission blocked
    let feeBlocked = false;
    const reqNoPerm = {
      user: {
        role: {
          name: 'TEACHER',
          permissions: [{ code: 'attendance:create' }, { code: 'homework:create' }],
        },
      },
    };
    feePermissionMiddleware(reqNoPerm, {}, (err) => {
      if (err instanceof ApiError && err.statusCode === 403) feeBlocked = true;
    });
    assert(feeBlocked === true, 'User lacking fees:approve is blocked with 403');

    // Test 4.2: User with permission allowed
    let feeAllowed = false;
    const reqWithPerm = {
      user: {
        role: {
          name: 'ACCOUNTANT',
          permissions: [{ code: 'fees:view' }, { code: 'fees:approve' }],
        },
      },
    };
    feePermissionMiddleware(reqWithPerm, {}, (err) => {
      if (!err) feeAllowed = true;
    });
    assert(feeAllowed === true, 'Accountant holding fees:approve permission is granted access');

    // Test 4.3: Super Admin bypasses check
    let superAdminBypass = false;
    const reqSuperAdminPerm = {
      user: {
        role: {
          name: 'SUPER_ADMIN',
          permissions: [],
        },
      },
    };
    feePermissionMiddleware(reqSuperAdminPerm, {}, (err) => {
      if (!err) superAdminBypass = true;
    });
    assert(superAdminBypass === true, 'SUPER_ADMIN bypasses granular permission requirement');

    // 5. Input Validation Suite
    console.log('\n[Suite 5: Request Input Validation Middleware]');

    // Test 5.1: Missing Login Credentials
    let loginValidationFailed = false;
    validateLoginInput({ body: { username: '' } }, {}, (err) => {
      if (err && err.statusCode === 400) loginValidationFailed = true;
    });
    assert(loginValidationFailed === true, 'Empty username/password fails validation (400 Bad Request)');

    // Test 5.2: Valid Login Credentials
    let loginValidationPassed = false;
    validateLoginInput({ body: { username: 'admin', password: 'password123' } }, {}, (err) => {
      if (!err) loginValidationPassed = true;
    });
    assert(loginValidationPassed === true, 'Valid login payload passes validation');

    // Test 5.3: Password Mismatch in Password Change
    let pwMismatchCaught = false;
    validatePasswordChange(
      { body: { currentPassword: 'old', newPassword: 'abc', confirmPassword: 'xyz' } },
      {},
      (err) => {
        if (err && err.statusCode === 400) pwMismatchCaught = true;
      }
    );
    assert(pwMismatchCaught === true, 'Password mismatch caught by validation');

    // 6. Response & Error Envelopes
    console.log('\n[Suite 6: API Protocol Envelope Standards]');
    const errorInstance = ApiError.notFound('Student record STU001 not found');
    assert(errorInstance.statusCode === 404, 'ApiError.notFound creates 404 status');
    assert(errorInstance.success === false, 'ApiError success flag is false');

    // 7. Express App Architecture & Health Endpoint
    console.log('\n[Suite 7: Express Application Server & Routes]');
    const server = app.listen(0);
    const port = server.address().port;

    const res = await fetch(`http://localhost:${port}/api/health`);
    const healthBody = await res.json();
    assert(res.status === 200, 'HTTP GET /api/health responds with 200');
    assert(healthBody.success === true, 'Response conforms to standardized ApiResponse envelope');
    assert(healthBody.data.status === 'UP', 'Health status is UP');

    server.close();

    console.log('\n====================================================');
    console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
    console.log('====================================================');

    if (failed === 0) {
      console.log('ALL AUTH & RBAC SECURITY TESTS PASSED SUCCESSFULLY!\n');
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  }
};

runSuite();
