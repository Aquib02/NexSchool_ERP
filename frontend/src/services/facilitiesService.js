import apiClient from './apiClient.js';

export const facilitiesService = {
  // Housekeeping Areas
  getAreas: (params) => apiClient.get('/facilities/areas', { params }),
  createArea: (data) => apiClient.post('/facilities/areas', data),
  updateArea: (id, data) => apiClient.put(`/facilities/areas/${id}`, data),

  // Housekeeping Tasks
  getTasks: (params) => apiClient.get('/facilities/tasks', { params }),
  createTask: (data) => apiClient.post('/facilities/tasks', data),
  updateTask: (id, data) => apiClient.put(`/facilities/tasks/${id}`, data),

  // Cleaning Supplies
  getSupplies: (params) => apiClient.get('/facilities/supplies', { params }),
  createSupply: (data) => apiClient.post('/facilities/supplies', data),
  updateSupply: (id, data) => apiClient.put(`/facilities/supplies/${id}`, data),
};

export default facilitiesService;
