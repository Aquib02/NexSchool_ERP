import apiClient from './apiClient.js';

export const transportService = {
  // Vehicles
  getVehicles: (params) => apiClient.get('/transport/vehicles', { params }),
  createVehicle: (data) => apiClient.post('/transport/vehicles', data),
  updateVehicle: (id, data) => apiClient.put(`/transport/vehicles/${id}`, data),

  // Routes
  getRoutes: (params) => apiClient.get('/transport/routes', { params }),
  createRoute: (data) => apiClient.post('/transport/routes', data),
  updateRoute: (id, data) => apiClient.put(`/transport/routes/${id}`, data),

  // Allocations
  getAllocations: (params) => apiClient.get('/transport/allocations', { params }),
  allocateTransport: (data) => apiClient.post('/transport/allocations', data),
  updateAllocationStatus: (id, data) => apiClient.put(`/transport/allocations/${id}/status`, data),
};

export default transportService;
