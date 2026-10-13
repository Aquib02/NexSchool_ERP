import apiClient from './apiClient.js';

export const academicsService = {
  // Timetable
  getTimetable: (params) => apiClient.get('/academics/timetable', { params }),
  saveTimetableDay: (data) => apiClient.post('/academics/timetable', data),
  getTeachers: () => apiClient.get('/academics/teachers'),
  extractTimetableFromPdf: (data) => apiClient.post('/academics/timetable/extract-pdf', data),

  // Attendance
  getClassAttendanceRegister: (params) => apiClient.get('/academics/attendance/register', { params }),
  saveClassAttendance: (data) => apiClient.post('/academics/attendance/save', data),

  // Homework
  getHomeworkList: (params) => apiClient.get('/academics/homework', { params }),
  createHomework: (data) => apiClient.post('/academics/homework', data),
  updateHomework: (id, data) => apiClient.put(`/academics/homework/${id}`, data),
  deleteHomework: (id) => apiClient.delete(`/academics/homework/${id}`),
  submitHomework: (id, data) => apiClient.post(`/academics/homework/${id}/submit`, data),
  gradeHomework: (id, studentId, data) =>
    apiClient.put(`/academics/homework/${id}/grade/${studentId}`, data),

  // Exams & Marks
  getExams: () => apiClient.get('/academics/exams'),
  createExam: (data) => apiClient.post('/academics/exams', data),
  getExamMarks: (params) => apiClient.get('/academics/marks', { params }),
  saveExamMarks: (data) => apiClient.post('/academics/marks/save', data),

  // Report Cards & Consolidated Class Results
  generateReportCard: (data) => apiClient.post('/academics/report-cards/generate', data),
  getReportCards: (params) => apiClient.get('/academics/report-cards', { params }),
  getConsolidatedClassResults: (params) => apiClient.get('/academics/consolidated-results', { params }),
  compileClassResults: (data) => apiClient.post('/academics/report-cards/compile-class', data),
  getStudentComprehensiveReport: (studentId, params) =>
    apiClient.get(`/academics/report-cards/student/${studentId}`, { params }),
  updateReportCardRemarks: (id, data) => apiClient.put(`/academics/report-cards/${id}/remarks`, data),
};

export default academicsService;
