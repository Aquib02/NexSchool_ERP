import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor: Attach JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle 401 & standardized responses
apiClient.interceptors.response.use(
  (response) => {
    const payload = response.data; // Extracts { success, statusCode, message, data }
    if (payload && typeof payload === 'object') {
      // Dual-compatibility bridge:
      // Supports both unpacked format (res.data) and Axios-style nested format (res.data.data / res.data.success)
      if (payload.data !== undefined && typeof payload.data === 'object' && payload.data !== null) {
        if (!('data' in payload.data)) {
          try {
            Object.defineProperty(payload.data, 'data', {
              get: () => payload.data,
              configurable: true,
              enumerable: false,
            });
          } catch (_) {}
        }
        if (!('success' in payload.data)) {
          try {
            Object.defineProperty(payload.data, 'success', {
              get: () => payload.success,
              configurable: true,
              enumerable: false,
            });
          } catch (_) {}
        }
      }
    }
    return payload;
  },
  (error) => {
    if (error.response) {
      // Token expired or invalid
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (!window.location.pathname.startsWith('/login')) {
          window.location.href = '/login?sessionExpired=true';
        }
      }
      return Promise.reject(error.response.data || { message: 'An error occurred' });
    }
    return Promise.reject({ message: 'Network error or server unreachable' });
  }
);

export default apiClient;
