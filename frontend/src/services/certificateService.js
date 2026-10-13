import apiClient from './apiClient.js';

export const certificateService = {
  getCertificates: (params) => apiClient.get('/certificates', { params }),
  generateCertificate: (data) => apiClient.post('/certificates/generate', data),
  verifyCertificate: (code) => apiClient.get(`/certificates/verify/${code}`),
  getIdCards: (params) => apiClient.get('/certificates/id-cards', { params }),
  getHallTickets: (params) => apiClient.get('/certificates/hall-tickets', { params }),
};

export default certificateService;
