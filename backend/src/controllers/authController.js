import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as authService from '../services/authService.js';
import ENV from '../config/env.js';
import { logAudit } from '../utils/auditLogger.js';

export const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await authService.loginUser({ username, password });

    // Store refresh token in secure HTTP-only cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: ENV.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    req._auditLogged = true;
    await logAudit({
      req,
      actor: result.user,
      action: 'USER_LOGIN',
      resource: 'Auth',
      description: `User ${result.user.username} (${result.user.role?.name || 'USER'}) logged into the system`,
      details: {
        userId: result.user._id,
        username: result.user.username,
        role: result.user.role?.name,
        loginTime: new Date().toISOString(),
      },
      status: 'SUCCESS',
    });

    return ApiResponse.ok(
      res,
      {
        user: result.user,
        accessToken: result.accessToken,
      },
      'Login successful'
    );
  } catch (err) {
    req._auditLogged = true;
    await logAudit({
      req,
      action: 'LOGIN_FAILED',
      resource: 'Auth',
      description: `Failed login attempt for username/email: "${username || 'empty'}"`,
      details: {
        attemptedUsername: username,
      },
      status: 'FAILURE',
      failureReason: err.message || 'Invalid credentials',
    });
    throw err;
  }
});

export const logout = asyncHandler(async (req, res) => {
  if (req.user) {
    req._auditLogged = true;
    await logAudit({
      req,
      actor: req.user,
      action: 'USER_LOGOUT',
      resource: 'Auth',
      description: `User ${req.user.username} (${req.user.role?.name || 'USER'}) logged out`,
      status: 'SUCCESS',
    });
  }
  res.clearCookie('refreshToken');
  res.clearCookie('token');
  return ApiResponse.ok(res, null, 'Logged out successfully');
});

export const getMe = asyncHandler(async (req, res) => {
  const profile = await authService.getUserProfile(req.user._id);
  return ApiResponse.ok(res, profile, 'Profile retrieved successfully');
});

export const changePassword = asyncHandler(async (req, res) => {
  const result = await authService.changeUserPassword(req.user._id, req.body);
  return ApiResponse.ok(res, null, result.message);
});

export const updateProfile = asyncHandler(async (req, res) => {
  const updatedUser = await authService.updateUserProfile(req.user._id, req.body);
  return ApiResponse.ok(res, updatedUser, 'Profile updated successfully');
});

export const sendPasswordOtp = asyncHandler(async (req, res) => {
  const identifier = req.body.email || req.body.username || req.body.identifier;
  const userId = req.user ? req.user._id : null;
  const result = await authService.sendPasswordOtp({ identifier, userId });
  return ApiResponse.ok(res, result, result.message);
});

export const verifyPasswordOtp = asyncHandler(async (req, res) => {
  const { identifier, otp, newPassword } = req.body;
  const userId = req.user ? req.user._id : null;
  const result = await authService.verifyPasswordOtp({ identifier, userId, otp, newPassword });
  return ApiResponse.ok(res, null, result.message);
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const identifier = req.body.email || req.body.username || req.body.identifier;
  const clientOrigin = req.headers.origin || null;
  const result = await authService.requestPasswordReset(identifier, clientOrigin);
  return ApiResponse.ok(res, result, result.message);
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  const result = await authService.resetUserPassword(token, password);
  return ApiResponse.ok(res, null, result.message);
});
