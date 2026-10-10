import apiClient from './apiClient.js';

export const staffService = {
  // Departments & Designations
  getDepartments: () => apiClient.get('/staff/departments'),
  createDepartment: (data) => apiClient.post('/staff/departments', data),
  getDesignations: (params) => apiClient.get('/staff/designations', { params }),
  createDesignation: (data) => apiClient.post('/staff/designations', data),

  // Employees
  getEmployees: (params) => apiClient.get('/staff/employees', { params }),
  getEmployeeById: (id) => apiClient.get(`/staff/employees/${id}`),
  createEmployee: (data) => apiClient.post('/staff/employees', data),
  updateEmployee: (id, data) => apiClient.put(`/staff/employees/${id}`, data),

  // Leaves
  getLeaves: (params) => apiClient.get('/staff/leaves', { params }),
  submitLeave: (data) => apiClient.post('/staff/leaves', data),
  reviewLeave: (id, data) => apiClient.put(`/staff/leaves/${id}/review`, data),

  // Payroll
  getPayrolls: (params) => apiClient.get('/staff/payroll', { params }),
  generatePayroll: (data) => apiClient.post('/staff/payroll/generate', data),
  updatePayrollStatus: (id, data) => apiClient.put(`/staff/payroll/${id}/status`, data),
};

export default staffService;
