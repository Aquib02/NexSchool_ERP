import apiClient from './apiClient.js';

export const notificationService = {
  getNotifications: () => apiClient.get('/notifications'),
  markAsRead: (id) => apiClient.put(`/notifications/${id}/read`),
  markAllAsRead: () => apiClient.put('/notifications/all/read'),
  broadcast: (data) => apiClient.post('/notifications/broadcast', data),
};

export default notificationService;
