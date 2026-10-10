import apiClient from './apiClient.js';

export const auditService = {
  getLogs: (params) => apiClient.get('/audit-logs', { params }),
  getStats: () => apiClient.get('/audit-logs/stats'),
  exportLogs: (params) => apiClient.get('/audit-logs/export', { params }),
};

export default auditService;
