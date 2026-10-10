import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as authService from '../services/authService.js';
import ENV from '../config/env.js';

export const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  const result = await authService.loginUser({ username, password });

  // Store refresh token in secure HTTP-only cookie
  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: ENV.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return ApiResponse.ok(
    res,
    {
      user: result.user,
      accessToken: result.accessToken,
    },
    'Login successful'
  );
});

export const logout = asyncHandler(async (req, res) => {
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
