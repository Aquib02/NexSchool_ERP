import apiClient from './apiClient.js';

export const rbacService = {
  getRoles: () => apiClient.get('/rbac/roles'),
  getRoleById: (id) => apiClient.get(`/rbac/roles/${id}`),
  createRole: (data) => apiClient.post('/rbac/roles', data),
  updateRole: (id, data) => apiClient.put(`/rbac/roles/${id}`, data),
  getPermissions: () => apiClient.get('/rbac/permissions'),
  createPermission: (data) => apiClient.post('/rbac/permissions', data),
  getUsers: () => apiClient.get('/rbac/users'),
  createUser: (data) => apiClient.post('/rbac/users', data),
  updateUserRole: (id, data) => apiClient.put(`/rbac/users/${id}`, data),
};

export default rbacService;
