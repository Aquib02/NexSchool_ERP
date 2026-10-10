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
import emailService from './emailService.js';

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

export const requestPasswordReset = async (identifier, clientBaseUrl = null) => {
  const cleanId = (identifier || '').trim().toLowerCase();
  const user = await User.findOne({
    $or: [{ email: cleanId }, { username: cleanId }],
  });

  if (!user) {
    // Return friendly message even if email/username not found to prevent user enumeration
    return {
      message: 'If an account matching those credentials exists, password reset instructions have been dispatched.',
    };
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  user.passwordResetToken = hashedToken;
  user.passwordResetExpires = Date.now() + 30 * 60 * 1000; // 30 minutes validity
  await user.save({ validateBeforeSave: false });

  const clientUrl = clientBaseUrl || ENV.CLIENT_URL;
  const resetLink = `${clientUrl.replace(/\/+$/, '')}/reset-password/${resetToken}`;

  let emailResult = { delivered: false };
  if (user.email && user.email.includes('@')) {
    emailResult = await emailService.sendPasswordResetEmail({
      to: user.email,
      username: user.username,
      resetLink,
    });
  }

  return {
    message: emailResult.delivered
      ? `A password reset link has been dispatched to ${user.email}. Please check your inbox and spam folder.`
      : (emailResult.reason === 'unconfigured'
          ? 'Email server is currently not configured with SMTP credentials. Use the direct link below to reset your password.'
          : 'Password reset link prepared.'),
    resetLink: !emailResult.delivered ? resetLink : undefined,
    userEmail: user.email,
    delivered: emailResult.delivered,
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

export const updateUserProfile = async (userId, { email }) => {
  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  if (email) {
    const cleanEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: cleanEmail, _id: { $ne: userId } });
    if (existing) {
      throw ApiError.badRequest('This email address is already in use by another account.');
    }
    user.email = cleanEmail;
  }

  await user.save({ validateBeforeSave: false });

  return getUserProfile(userId);
};

export default {
  generateTokens,
  loginUser,
  changeUserPassword,
  requestPasswordReset,
  resetUserPassword,
  getUserProfile,
  updateUserProfile,
};
