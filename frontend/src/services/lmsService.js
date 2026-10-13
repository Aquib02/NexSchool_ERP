import apiClient from './apiClient.js';

export const lmsService = {
  getSubmissions: (params) => apiClient.get('/lms/submissions', { params }),
  submitAssignment: (data) => apiClient.post('/lms/submissions', data),
  gradeSubmission: (id, data) => apiClient.put(`/lms/submissions/${id}/grade`, data),

  getQuizzes: (params) => apiClient.get('/lms/quizzes', { params }),
  getQuizById: (id) => apiClient.get(`/lms/quizzes/${id}`),
  createQuiz: (data) => apiClient.post('/lms/quizzes', data),
  attemptQuiz: (data) => apiClient.post('/lms/quizzes/attempt', data),
  getQuizLeaderboard: (quizId) => apiClient.get(`/lms/quizzes/${quizId}/leaderboard`),

  getMaterials: (params) => apiClient.get('/lms/materials', { params }),
  createMaterial: (data) => apiClient.post('/lms/materials', data),
  deleteMaterial: (id) => apiClient.delete(`/lms/materials/${id}`),
};

export default lmsService;
