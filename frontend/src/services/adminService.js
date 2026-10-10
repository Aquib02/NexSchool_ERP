import apiClient from './apiClient.js';

export const adminService = {
  // Academic Sessions
  getSessions: () => apiClient.get('/admin/sessions'),
  createSession: (data) => apiClient.post('/admin/sessions', data),
  updateSession: (id, data) => apiClient.put(`/admin/sessions/${id}`, data),

  // Classes
  getClasses: () => apiClient.get('/admin/classes'),
  createClass: (data) => apiClient.post('/admin/classes', data),
  updateClass: (id, data) => apiClient.put(`/admin/classes/${id}`, data),

  // Sections
  getSections: (classId) => apiClient.get('/admin/sections', { params: { classId } }),
  createSection: (data) => apiClient.post('/admin/sections', data),
  updateSection: (id, data) => apiClient.put(`/admin/sections/${id}`, data),

  // Subjects
  getSubjects: (classId) => apiClient.get('/admin/subjects', { params: { classId } }),
  createSubject: (data) => apiClient.post('/admin/subjects', data),
  updateSubject: (id, data) => apiClient.put(`/admin/subjects/${id}`, data),

  // Departments & Designations
  getDepartments: () => apiClient.get('/admin/departments'),
  createDepartment: (data) => apiClient.post('/admin/departments', data),
  getDesignations: (departmentId) => apiClient.get('/admin/designations', { params: { departmentId } }),
  createDesignation: (data) => apiClient.post('/admin/designations', data),

  // Notices
  getNotices: () => apiClient.get('/admin/notices'),
  createNotice: (data) => apiClient.post('/admin/notices', data),
  deleteNotice: (id) => apiClient.delete(`/admin/notices/${id}`),

  // Stats
  getStats: () => apiClient.get('/admin/stats'),
};

export default adminService;
