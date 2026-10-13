import apiClient from './apiClient.js';

export const communicationService = {
  getLogs: (params) => apiClient.get('/communication/logs', { params }),
  sendBroadcast: (data) => apiClient.post('/communication/broadcast', data),
  triggerAlert: (data) => apiClient.post('/communication/trigger-alert', data),

  getPTMSlots: (params) => apiClient.get('/communication/ptm', { params }),
  createPTMSlot: (data) => apiClient.post('/communication/ptm', data),
  bookPTMSlot: (id, data) => apiClient.post(`/communication/ptm/${id}/book`, data),

  getChatMessages: (params) => apiClient.get('/communication/chat', { params }),
  sendChatMessage: (data) => apiClient.post('/communication/chat', data),
};

export default communicationService;
