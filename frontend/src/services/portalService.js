import apiClient from './apiClient.js';

export const portalService = {
  getStudentPortalData: (params) => apiClient.get('/portal/student', { params }),
  getStudentAttendanceHistory: (params) => apiClient.get('/portal/student/attendance', { params }),
  getParentPortalData: (params) => apiClient.get('/portal/parent', { params }),
};

export default portalService;
