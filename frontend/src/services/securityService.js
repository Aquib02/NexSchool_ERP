import apiClient from './apiClient.js';

export const securityService = {
  // Visitor Passes
  getVisitors: (params) => apiClient.get('/security/visitors', { params }),
  createVisitor: (data) => apiClient.post('/security/visitors', data),
  checkoutVisitor: (id) => apiClient.put(`/security/visitors/${id}/checkout`),

  // Gate Passes
  getGatePasses: (params) => apiClient.get('/security/gate-passes', { params }),
  createGatePass: (data) => apiClient.post('/security/gate-passes', data),
  updateGatePassStatus: (id, data) => apiClient.put(`/security/gate-passes/${id}/status`, data),

  // Security Incidents
  getIncidents: (params) => apiClient.get('/security/incidents', { params }),
  createIncident: (data) => apiClient.post('/security/incidents', data),
  updateIncidentStatus: (id, data) => apiClient.put(`/security/incidents/${id}/status`, data),
};

export default securityService;
