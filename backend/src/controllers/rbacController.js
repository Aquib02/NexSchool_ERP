import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import Role from '../models/Role.js';
import Permission from '../models/Permission.js';
import User from '../models/User.js';

export const getRoles = asyncHandler(async (req, res) => {
  const roles = await Role.find().populate('permissions').sort({ hierarchyLevel: 1 });
  return ApiResponse.ok(res, roles, 'Roles retrieved successfully');
});

export const getRoleById = asyncHandler(async (req, res) => {
  const role = await Role.findById(req.params.id).populate('permissions');
  if (!role) {
    throw ApiError.notFound('Role not found');
  }
  return ApiResponse.ok(res, role, 'Role retrieved successfully');
});

export const createRole = asyncHandler(async (req, res) => {
  const { name, displayName, description, permissions, hierarchyLevel } = req.body;

  const existing = await Role.findOne({ name: name.toUpperCase() });
  if (existing) {
    throw ApiError.conflict(`Role '${name}' already exists.`);
  }

  const role = await Role.create({
    name: name.toUpperCase(),
    displayName,
    description,
    permissions: permissions || [],
    hierarchyLevel: hierarchyLevel || 10,
  });

  return ApiResponse.created(res, role, 'Role created successfully');
});

export const updateRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const role = await Role.findById(id);

  if (!role) {
    throw ApiError.notFound('Role not found');
  }

  if (role.isSystem && req.body.name && req.body.name !== role.name) {
    throw ApiError.badRequest('Cannot rename a protected system role');
  }

  const updatedRole = await Role.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  }).populate('permissions');

  return ApiResponse.ok(res, updatedRole, 'Role updated successfully');
});

export const getPermissions = asyncHandler(async (req, res) => {
  const permissions = await Permission.find().sort({ resource: 1, action: 1 });
  return ApiResponse.ok(res, permissions, 'Permissions retrieved successfully');
});

export const createPermission = asyncHandler(async (req, res) => {
  const { resource, action, description, category } = req.body;
  const code = `${resource.toLowerCase()}:${action.toLowerCase()}`;

  const existing = await Permission.findOne({ code });
  if (existing) {
    throw ApiError.conflict(`Permission '${code}' already exists.`);
  }

  const permission = await Permission.create({
    resource,
    action,
    code,
    description,
    category: category || resource.toUpperCase(),
  });

  return ApiResponse.created(res, permission, 'Permission created successfully');
});

// ==================== USER ACCOUNTS & ASSIGNMENT ====================

export const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find()
    .populate('role', 'name displayName hierarchyLevel isSystem')
    .select('-passwordResetToken -passwordResetExpires')
    .sort({ createdAt: -1 });
  return ApiResponse.ok(res, users, 'Users retrieved successfully');
});

export const createUser = asyncHandler(async (req, res) => {
  const { username, email, password, roleId, isActive = true } = req.body;

  if (!username || !password || !roleId) {
    throw ApiError.badRequest('Username, password, and role are required');
  }

  const existingUser = await User.findOne({
    $or: [{ username: username.toLowerCase() }, ...(email ? [{ email: email.toLowerCase() }] : [])],
  });
  if (existingUser) {
    throw ApiError.conflict('User with this username or email already exists.');
  }

  const user = new User({
    username: username.toLowerCase(),
    email: email ? email.toLowerCase() : undefined,
    password,
    role: roleId,
    isActive,
  });
  await user.save();

  const populated = await User.findById(user._id).populate('role', 'name displayName hierarchyLevel');
  return ApiResponse.created(res, populated, 'User account created successfully');
});

export const updateUserRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { roleId, isActive } = req.body;

  const update = {};
  if (roleId) update.role = roleId;
  if (typeof isActive === 'boolean') update.isActive = isActive;

  const user = await User.findByIdAndUpdate(id, update, { new: true })
    .populate('role', 'name displayName hierarchyLevel');

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  return ApiResponse.ok(res, user, 'User updated successfully');
});
