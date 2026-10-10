import ApiError from '../utils/ApiError.js';

export const validateLoginInput = (req, res, next) => {
  const { username, password } = req.body;
  const errors = [];

  if (!username || typeof username !== 'string' || !username.trim()) {
    errors.push('Username or email is required');
  }

  if (!password || typeof password !== 'string' || !password.trim()) {
    errors.push('Password is required');
  }

  if (errors.length > 0) {
    return next(new ApiError(400, 'Validation Error', errors));
  }

  next();
};

export const validatePasswordChange = (req, res, next) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  const errors = [];

  if (!currentPassword) errors.push('Current password is required');
  if (!newPassword || newPassword.length < 6) {
    errors.push('New password must be at least 6 characters');
  }
  if (newPassword !== confirmPassword) {
    errors.push('New password and confirm password do not match');
  }

  if (errors.length > 0) {
    return next(new ApiError(400, 'Validation Error', errors));
  }

  next();
};

export const validateForgotPassword = (req, res, next) => {
  const identifier = req.body.email || req.body.username || req.body.identifier;
  if (!identifier || typeof identifier !== 'string' || !identifier.trim()) {
    return next(new ApiError(400, 'A valid username or email address is required to request a reset link'));
  }
  next();
};

export const validateResetPassword = (req, res, next) => {
  const { password, confirmPassword } = req.body;
  const errors = [];

  if (!password || password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }
  if (password !== confirmPassword) {
    errors.push('Password confirmation does not match');
  }

  if (errors.length > 0) {
    return next(new ApiError(400, 'Validation Error', errors));
  }

  next();
};
