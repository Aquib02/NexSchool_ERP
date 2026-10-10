import apiClient from './apiClient.js';

export const medicalService = {
  // Student Medical Records
  getRecords: (params) => apiClient.get('/medical/records', { params }),
  getStudentMedicalProfile: (studentId) => apiClient.get(`/medical/records/student/${studentId}`),
  upsertRecord: (data) => apiClient.post('/medical/records', data),

  // Clinic Visits
  getVisits: (params) => apiClient.get('/medical/visits', { params }),
  createVisit: (data) => apiClient.post('/medical/visits', data),
  updateVisitStatus: (id, data) => apiClient.put(`/medical/visits/${id}/status`, data),

  // Dispensary & Medicine Stock
  getInventory: (params) => apiClient.get('/medical/inventory', { params }),
  createMedicine: (data) => apiClient.post('/medical/inventory', data),
  updateMedicine: (id, data) => apiClient.put(`/medical/inventory/${id}`, data),
};

export default medicalService;
