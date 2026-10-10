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

export const sendPasswordOtp = async ({ identifier, userId }) => {
  let user = null;
  if (userId) {
    user = await User.findById(userId);
  } else if (identifier) {
    const cleanId = identifier.trim().toLowerCase();
    user = await User.findOne({
      $or: [{ email: cleanId }, { username: cleanId }],
    });
  }

  if (!user) {
    return {
      message: 'If an account matching those credentials exists, a verification OTP code has been dispatched.',
      delivered: false,
    };
  }

  // Generate 6-digit numeric OTP
  const otp = Math.floor(100000 + crypto.randomInt(900000)).toString();
  const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

  user.passwordResetOtp = hashedOtp;
  user.passwordResetOtpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes validity
  await user.save({ validateBeforeSave: false });

  let emailResult = { delivered: false };
  if (user.email && user.email.includes('@')) {
    emailResult = await emailService.sendPasswordResetOtpEmail({
      to: user.email,
      username: user.username,
      otp,
    });
  }

  const maskedEmail = user.email
    ? user.email.replace(/(.{2})(.*)(?=@)/, (g1, g2, g3) => g2 + '*'.repeat(Math.max(1, g3.length)))
    : '';

  return {
    message: emailResult.delivered
      ? `A 6-digit OTP verification code has been dispatched to ${user.email}. Please check your inbox and spam folder.`
      : (emailResult.reason === 'unconfigured'
          ? `Email server is currently not configured with SMTP credentials. For testing, your 6-digit OTP is: ${otp}`
          : 'A 6-digit verification code has been prepared.'),
    email: user.email,
    maskedEmail,
    delivered: emailResult.delivered,
    debugOtp: !emailResult.delivered ? otp : undefined,
  };
};

export const verifyPasswordOtp = async ({ identifier, userId, otp, newPassword }) => {
  if (!otp || typeof otp !== 'string' || otp.trim().length !== 6) {
    throw ApiError.badRequest('A valid 6-digit OTP code is required.');
  }

  if (!newPassword || newPassword.length < 6) {
    throw ApiError.badRequest('New password must be at least 6 characters.');
  }

  const cleanOtp = otp.trim();
  const hashedOtp = crypto.createHash('sha256').update(cleanOtp).digest('hex');

  const query = {
    passwordResetOtp: hashedOtp,
    passwordResetOtpExpires: { $gt: Date.now() },
  };

  if (userId) {
    query._id = userId;
  } else if (identifier) {
    const cleanId = identifier.trim().toLowerCase();
    query.$or = [{ email: cleanId }, { username: cleanId }];
  }

  const user = await User.findOne(query);
  if (!user) {
    throw ApiError.badRequest('Invalid or expired 6-digit OTP code. Please request a new code.');
  }

  user.password = newPassword;
  user.passwordResetOtp = undefined;
  user.passwordResetOtpExpires = undefined;
  await user.save();

  return { message: 'Password has been updated successfully. You can now sign in with your new password.' };
};

export const requestPasswordReset = async (identifier, clientBaseUrl = null) => {
  // Delegate to sendPasswordOtp to maintain unified OTP functionality
  return sendPasswordOtp({ identifier });
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
  sendPasswordOtp,
  verifyPasswordOtp,
  requestPasswordReset,
  resetUserPassword,
  getUserProfile,
  updateUserProfile,
};
