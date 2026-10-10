import apiClient from './apiClient.js';

export const canteenService = {
  // Menu Items
  getItems: (params) => apiClient.get('/canteen/items', { params }),
  createItem: (data) => apiClient.post('/canteen/items', data),
  updateItem: (id, data) => apiClient.put(`/canteen/items/${id}`, data),

  // POS Transactions
  getTransactions: (params) => apiClient.get('/canteen/transactions', { params }),
  createTransaction: (data) => apiClient.post('/canteen/transactions', data),
};

export default canteenService;
