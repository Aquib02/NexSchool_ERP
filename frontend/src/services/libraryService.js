import apiClient from './apiClient.js';

export const libraryService = {
  // Books
  getBooks: (params) => apiClient.get('/library/books', { params }),
  getBookById: (id) => apiClient.get(`/library/books/${id}`),
  createBook: (data) => apiClient.post('/library/books', data),
  updateBook: (id, data) => apiClient.put(`/library/books/${id}`, data),
  deleteBook: (id) => apiClient.delete(`/library/books/${id}`),

  // Transactions
  issueBook: (data) => apiClient.post('/library/issue', data),
  returnBook: (id, data) => apiClient.post(`/library/return/${id}`, data),
  getTransactions: (params) => apiClient.get('/library/transactions', { params }),
};

export default libraryService;
