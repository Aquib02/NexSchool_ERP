import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import '../models/index.js';
import User from '../models/User.js';
import Role from '../models/Role.js';
import Employee from '../models/Employee.js';
import Student from '../models/Student.js';
import Parent from '../models/Parent.js';
import ApiError from '../utils/ApiError.js';
import ENV from '../config/env.js';

export const generateTokens = (user) => {
  const payload = {
    id: user._id,
    username: user.username,
    role: user.role?.name || 'USER',
  };

  const accessToken = jwt.sign(payload, ENV.JWT_SECRET, {
    expiresIn: ENV.JWT_EXPIRE,
  });

  const refreshToken = jwt.sign(payload, ENV.JWT_REFRESH_SECRET, {
    expiresIn: ENV.JWT_REFRESH_EXPIRE,
  });

  return { accessToken, refreshToken };
};

export const loginUser = async ({ username, password }) => {
  const user = await User.findOne({
    $or: [{ username: username.toLowerCase() }, { email: username.toLowerCase() }],
  })
    .populate({
      path: 'role',
      populate: {
        path: 'permissions',
        select: 'resource action code',
      },
    })
    .populate('employeeId')
    .populate('studentId')
    .populate('parentId')
    .select('+password');

  if (!user) {
    throw ApiError.unauthorized('Invalid username or password.');
  }

  if (!user.isActive) {
    throw ApiError.forbidden('Your account has been deactivated. Please contact administration.');
  }

  const isPasswordMatch = await user.comparePassword(password);
  if (!isPasswordMatch) {
    throw ApiError.unauthorized('Invalid username or password.');
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  const tokens = generateTokens(user);

  // Sanitize user object for client
  const sanitizedUser = user.toObject();
  delete sanitizedUser.password;
  delete sanitizedUser.passwordResetToken;
  delete sanitizedUser.passwordResetExpires;

  return { user: sanitizedUser, ...tokens };
};

export const changeUserPassword = async (userId, { currentPassword, newPassword }) => {
  const user = await User.findById(userId).select('+password');
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw ApiError.badRequest('Current password does not match.');
  }

  user.password = newPassword;
  await user.save();

  return { message: 'Password updated successfully' };
};

export const requestPasswordReset = async (email) => {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    // Return friendly message even if email not found to avoid user enumeration
    return { message: 'If an account with that email exists, a password reset link has been dispatched.' };
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  user.passwordResetToken = hashedToken;
  user.passwordResetExpires = Date.now() + 30 * 60 * 1000; // 30 minutes validity
  await user.save({ validateBeforeSave: false });

  // In production, this token is sent via Email / SMS
  return {
    message: 'If an account with that email exists, a password reset link has been dispatched.',
    debugResetToken: ENV.NODE_ENV === 'development' ? resetToken : undefined,
  };
};

export const resetUserPassword = async (token, newPassword) => {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    throw ApiError.badRequest('Password reset token is invalid or has expired.');
  }

  user.password = newPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  return { message: 'Password has been reset successfully. You can now log in.' };
};

export const getUserProfile = async (userId) => {
  const user = await User.findById(userId)
    .populate({
      path: 'role',
      populate: {
        path: 'permissions',
        select: 'resource action code',
      },
    })
    .populate('employeeId')
    .populate('studentId')
    .populate('parentId');

  if (!user) {
    throw ApiError.notFound('User profile not found');
  }

  return user;
};

export default {
  generateTokens,
  loginUser,
  changeUserPassword,
  requestPasswordReset,
  resetUserPassword,
  getUserProfile,
};
