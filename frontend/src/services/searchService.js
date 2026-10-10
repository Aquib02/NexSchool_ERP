import apiClient from './apiClient.js';

export const searchService = {
  globalSearch: (q) => apiClient.get('/search', { params: { q } }),
};

export default searchService;
