import apiClient from './apiClient.js';

export const liveTrackingService = {
  getFleetStatus: () => apiClient.get('/live-tracking/fleet'),
  updateTelemetry: (data) => apiClient.post('/live-tracking/telemetry', data),
  triggerSOS: (data) => apiClient.post('/live-tracking/sos', data),

  getBoardingChecklist: (params) => apiClient.get('/live-tracking/boarding', { params }),
  markBoarding: (data) => apiClient.post('/live-tracking/boarding', data),
};

export default liveTrackingService;
