import apiClient from './apiClient.js';

export const admissionsService = {
  // Enquiries
  getEnquiries: (params) => apiClient.get('/admissions/enquiries', { params }),
  createEnquiry: (data) => apiClient.post('/admissions/enquiries', data),
  updateEnquiryStatus: (id, data) => apiClient.put(`/admissions/enquiries/${id}/status`, data),

  // Applications
  getApplications: (params) => apiClient.get('/admissions/applications', { params }),
  getApplicationById: (id) => apiClient.get(`/admissions/applications/${id}`),
  createApplication: (data) => apiClient.post('/admissions/applications', data),
  updateApplicationStatus: (id, data) => apiClient.put(`/admissions/applications/${id}/status`, data),
  recordEntranceMarks: (id, data) => apiClient.post(`/admissions/applications/${id}/entrance-marks`, data),

  // Conversion to Central Student
  convertToStudent: (id, data) => apiClient.post(`/admissions/applications/${id}/convert`, data),
};

export default admissionsService;
