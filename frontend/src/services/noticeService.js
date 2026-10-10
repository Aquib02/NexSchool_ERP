import apiClient from './apiClient.js';

export const noticeService = {
  getNotices: (params) => apiClient.get('/notices', { params }),
  getNoticeById: (id) => apiClient.get(`/notices/${id}`),
  createNotice: (data) => apiClient.post('/notices', data),
  updateNotice: (id, data) => apiClient.put(`/notices/${id}`, data),
  deleteNotice: (id) => apiClient.delete(`/notices/${id}`),
};

export default noticeService;
