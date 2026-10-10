import apiClient from './apiClient.js';

export const financeService = {
  // Fee Structures
  getFeeStructures: (params) => apiClient.get('/finance/structures', { params }),
  createFeeStructure: (data) => apiClient.post('/finance/structures', data),
  updateFeeStructure: (id, data) => apiClient.put(`/finance/structures/${id}`, data),

  // Invoicing & Billing
  generateInvoices: (data) => apiClient.post('/finance/invoices/generate', data),
  getStudentFees: (params) => apiClient.get('/finance/invoices', { params }),
  getStudentFeeById: (id) => apiClient.get(`/finance/invoices/${id}`),
  applyDiscountOrWaiver: (id, data) => apiClient.post(`/finance/invoices/${id}/discount`, data),

  // Payments & Receipts
  collectPayment: (data) => apiClient.post('/finance/payments/collect', data),
  getPayments: (params) => apiClient.get('/finance/payments', { params }),
  getReceipts: (params) => apiClient.get('/finance/receipts', { params }),
  getReceiptById: (id) => apiClient.get(`/finance/receipts/${id}`),

  // Defaulters & Overview
  getDefaulters: () => apiClient.get('/finance/defaulters'),
  getFinancialOverview: () => apiClient.get('/finance/overview'),

  // Expenses
  getExpenses: (params) => apiClient.get('/finance/expenses', { params }),
  createExpense: (data) => apiClient.post('/finance/expenses', data),
  updateExpenseStatus: (id, data) => apiClient.put(`/finance/expenses/${id}/status`, data),
};

export default financeService;
