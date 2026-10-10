import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import ENV from '../config/env.js';

export const authenticate = async (req, res, next) => {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      throw ApiError.unauthorized('Authentication token missing. Please log in.');
    }

    // Verify token
    const decoded = jwt.verify(token, ENV.JWT_SECRET);

    // Fetch user with populated role and permissions
    const user = await User.findById(decoded.id)
      .populate({
        path: 'role',
        populate: {
          path: 'permissions',
          select: 'resource action code',
        },
      })
      .select('+password');

    if (!user) {
      throw ApiError.unauthorized('User associated with this token no longer exists.');
    }

    if (!user.isActive) {
      throw ApiError.forbidden('User account is deactivated. Contact system administrator.');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return next(ApiError.unauthorized('User not authenticated'));
    }

    const userRole = req.user.role.name;

    // Super Admin always has global access
    if (userRole === 'SUPER_ADMIN') {
      return next();
    }

    if (!allowedRoles.includes(userRole)) {
      return next(
        ApiError.forbidden(
          `Access denied. Role '${userRole}' is not authorized to perform this operation.`
        )
      );
    }

    next();
  };
};

export const checkPermission = (requiredPermission) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return next(ApiError.unauthorized('User not authenticated'));
    }

    const userRole = req.user.role.name;

    // Super Admin bypasses all checks
    if (userRole === 'SUPER_ADMIN') {
      return next();
    }

    const permissions = req.user.role.permissions || [];
    const hasPermission = permissions.some(
      (perm) => perm.code === requiredPermission || perm.code === '*:*'
    );

    if (!hasPermission) {
      return next(
        ApiError.forbidden(
          `Permission denied. You require permission '${requiredPermission}' to access this resource.`
        )
      );
    }

    next();
  };
};

export default {
  authenticate,
  authorizeRoles,
  checkPermission,
  
};
