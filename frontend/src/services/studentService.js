import apiClient from './apiClient.js';

export const studentService = {
  getStudents: (params) => apiClient.get('/students', { params }),
  getStudentById: (id) => apiClient.get(`/students/${id}`),
  createStudent: (data) => apiClient.post('/students', data),
  updateStudent: (id, data) => apiClient.put(`/students/${id}`, data),
  updateStatus: (id, status) => apiClient.patch(`/students/${id}/status`, { status }),
  exportStudents: (params) => apiClient.get('/students/export', { params }),
};

export default studentService;
