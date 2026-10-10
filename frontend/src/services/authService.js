import apiClient from './apiClient.js';

export const authService = {
  login: async (credentials) => {
    return apiClient.post('/auth/login', credentials);
  },

  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  getMe: async () => {
    return apiClient.get('/auth/me');
  },

  updateProfile: async (data) => {
    return apiClient.put('/auth/profile', data);
  },

  changePassword: async (passwordData) => {
    return apiClient.put('/auth/change-password', passwordData);
  },

  sendOtp: async (identifier) => {
    return apiClient.post('/auth/send-otp', {
      identifier,
      email: identifier,
    });
  },

  verifyOtp: async ({ identifier, otp, newPassword }) => {
    return apiClient.post('/auth/verify-otp', {
      identifier,
      otp,
      newPassword,
    });
  },

  forgotPassword: async (identifier) => {
    return apiClient.post('/auth/forgot-password', {
      email: identifier,
      identifier,
    });
  },

  resetPassword: async (token, passwords) => {
    return apiClient.post(`/auth/reset-password/${token}`, passwords);
  },
};

export default authService;
