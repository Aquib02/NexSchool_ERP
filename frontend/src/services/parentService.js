import apiClient from './apiClient.js';

export const parentService = {
  getParents: (params) => apiClient.get('/parents', { params }),
  getParentById: (id) => apiClient.get(`/parents/${id}`),
  createParent: (data) => apiClient.post('/parents', data),
  updateParent: (id, data) => apiClient.put(`/parents/${id}`, data),
  linkStudent: (parentId, studentId) => apiClient.post('/parents/link', { parentId, studentId }),
};

export default parentService;
