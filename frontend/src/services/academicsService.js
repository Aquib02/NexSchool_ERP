import apiClient from './apiClient.js';

export const academicsService = {
  // Timetable
  getTimetable: (params) => apiClient.get('/academics/timetable', { params }),
  saveTimetableDay: (data) => apiClient.post('/academics/timetable', data),

  // Attendance
  getClassAttendanceRegister: (params) => apiClient.get('/academics/attendance/register', { params }),
  saveClassAttendance: (data) => apiClient.post('/academics/attendance/save', data),

  // Homework
  getHomeworkList: (params) => apiClient.get('/academics/homework', { params }),
  createHomework: (data) => apiClient.post('/academics/homework', data),
  submitHomework: (id, data) => apiClient.post(`/academics/homework/${id}/submit`, data),
  gradeHomework: (id, studentId, data) =>
    apiClient.put(`/academics/homework/${id}/grade/${studentId}`, data),

  // Exams & Marks
  getExams: () => apiClient.get('/academics/exams'),
  createExam: (data) => apiClient.post('/academics/exams', data),
  getExamMarks: (params) => apiClient.get('/academics/marks', { params }),
  saveExamMarks: (data) => apiClient.post('/academics/marks/save', data),

  // Report Cards
  generateReportCard: (data) => apiClient.post('/academics/report-cards/generate', data),
  getReportCards: (params) => apiClient.get('/academics/report-cards', { params }),
};

export default academicsService;
