import apiClient from './apiClient.js';

export const itService = {
  // IT Assets
  getAssets: (params) => apiClient.get('/it/assets', { params }),
  createAsset: (data) => apiClient.post('/it/assets', data),
  updateAsset: (id, data) => apiClient.put(`/it/assets/${id}`, data),

  // Helpdesk Tickets
  getTickets: (params) => apiClient.get('/it/tickets', { params }),
  createTicket: (data) => apiClient.post('/it/tickets', data),
  updateTicketStatus: (id, data) => apiClient.put(`/it/tickets/${id}/status`, data),
  addComment: (id, data) => apiClient.post(`/it/tickets/${id}/comments`, data),
};

export default itService;
