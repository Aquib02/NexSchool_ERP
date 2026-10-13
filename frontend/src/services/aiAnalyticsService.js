import apiClient from './apiClient.js';

export const aiAnalyticsService = {
  getAtRiskAnalytics: (params) => apiClient.get('/ai-analytics/at-risk', { params }),
  generateLessonPlan: (data) => apiClient.post('/ai-analytics/lesson-planner', data),
  generateQuizQuestions: (data) => apiClient.post('/ai-analytics/quiz-generator', data),
  generateReportRemarks: (data) => apiClient.post('/ai-analytics/report-remarks', data),
  chatAdmissions: (data) => apiClient.post('/ai-analytics/admissions-chat', data),
};

export default aiAnalyticsService;
