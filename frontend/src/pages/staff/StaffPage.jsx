import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Users,
  Briefcase,
  Calendar,
  DollarSign,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  FileText,
  CreditCard,
  ShieldCheck,
  AlertCircle,
  X,
  Edit2,
} from 'lucide-react';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';
import Modal from '../../components/common/Modal.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import staffService from '../../services/staffService.js';
import { useAuth } from '../../context/AuthContext.jsx';

export const StaffPage = () => {
  const { user, hasRole, hasPermission } = useAuth();
  const canEditStaff = hasRole(['SUPER_ADMIN', 'ADMINISTRATOR', 'PRINCIPAL']) || hasPermission('staff:update');

  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'directory');
  const [loading, setLoading] = useState(false);

  // Data states
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [payrolls, setPayrolls] = useState([]);

  // Search & Filter
  const [search, setSearch] = useState(searchParams.get('search') || '');

  useEffect(() => {
    const q = searchParams.get('search');
    if (q !== null && q !== search) {
      setSearch(q);
    }
  }, [searchParams]);
  const [deptFilter, setDeptFilter] = useState('');
  const [payrollMonth, setPayrollMonth] = useState(new Date().getMonth() + 1);
  const [payrollYear, setPayrollYear] = useState(new Date().getFullYear());

  // Modals
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [employeeForm, setEmployeeForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    gender: 'Male',
    age: '',
    dateOfBirth: '',
    departmentId: '',
    designationId: '',
    basicSalary: 3500,
    employmentType: 'Full-Time',
    customUsername: '',
    customPassword: '',
  });

  // Edit Staff Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState(null);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    gender: 'Male',
    age: '',
    dateOfBirth: '',
    departmentId: '',
    designationId: '',
    basicSalary: 3500,
    employmentType: 'Full-Time',
    status: 'Active',
    qualification: '',
    experienceYears: 0,
    address: {
      street: '',
      city: '',
      state: '',
      postalCode: '',
    },
    emergencyContact: {
      name: '',
      relationship: '',
      phone: '',
    },
  });

  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    employeeId: '',
    leaveType: 'Casual',
    startDate: '',
    endDate: '',
    reason: '',
  });

  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [deptForm, setDeptForm] = useState({ name: '', code: '', description: '' });

  const [isDesigModalOpen, setIsDesigModalOpen] = useState(false);
  const [desigForm, setDesigForm] = useState({
    title: '',
    code: '',
    departmentId: '',
    description: '',
    codeManual: false,
  });

  const [banner, setBanner] = useState({ type: '', text: '' });
  const showBanner = (type, text) => {
    setBanner({ type, text });
    setTimeout(() => setBanner({ type: '', text: '' }), 4000);
  };

  const loadDepartmentsAndDesignations = async () => {
    try {
      const [deptRes, desigRes] = await Promise.all([
        staffService.getDepartments(),
        staffService.getDesignations(),
      ]);
      if (deptRes.data?.data) setDepartments(deptRes.data.data);
      if (desigRes.data?.data) setDesignations(desigRes.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (deptFilter) params.departmentId = deptFilter;
      const res = await staffService.getEmployees(params);
      if (res.data?.data) setEmployees(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadLeaves = async () => {
    try {
      setLoading(true);
      const res = await staffService.getLeaves();
      if (res.data?.data) setLeaves(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadPayrolls = async () => {
    try {
      setLoading(true);
      const res = await staffService.getPayrolls({ month: payrollMonth, year: payrollYear });
      if (res.data?.data) setPayrolls(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartmentsAndDesignations();
  }, []);

  useEffect(() => {
    if (activeTab === 'directory') {
      const timer = setTimeout(() => {
        loadEmployees();
      }, 250);
      return () => clearTimeout(timer);
    }
    if (activeTab === 'leaves') loadLeaves();
    if (activeTab === 'payroll') loadPayrolls();
  }, [activeTab, deptFilter, search, payrollMonth, payrollYear]);

  // Handlers
  const handleOpenEdit = (emp) => {
    setEditingStaffId(emp._id);

    let calculatedAge = emp.age !== undefined && emp.age !== null ? emp.age : '';
    let formattedDob = '';
    if (emp.dateOfBirth) {
      formattedDob = new Date(emp.dateOfBirth).toISOString().split('T')[0];
      if (!calculatedAge) {
        const today = new Date();
        const birthDate = new Date(emp.dateOfBirth);
        let a = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          a--;
        }
        calculatedAge = a > 0 ? a : '';
      }
    }

    setEditForm({
      firstName: emp.firstName || '',
      lastName: emp.lastName || '',
      email: emp.email || '',
      phone: emp.phone || '',
      gender: emp.gender || 'Male',
      age: calculatedAge,
      dateOfBirth: formattedDob,
      departmentId: emp.departmentId?._id || emp.departmentId || '',
      designationId: emp.designationId?._id || emp.designationId || '',
      basicSalary: emp.salaryStructure?.basicSalary ?? emp.basicSalary ?? 3500,
      employmentType: emp.employmentType || 'Full-Time',
      status: emp.status || 'Active',
      qualification: emp.qualification || '',
      experienceYears: emp.experienceYears || 0,
      address: {
        street: emp.address?.street || '',
        city: emp.address?.city || '',
        state: emp.address?.state || '',
        postalCode: emp.address?.postalCode || '',
      },
      emergencyContact: {
        name: emp.emergencyContact?.name || '',
        relationship: emp.emergencyContact?.relationship || '',
        phone: emp.emergencyContact?.phone || '',
      },
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateEmployee = async (e) => {
    e.preventDefault();
    if (!editingStaffId) return;
    try {
      setLoading(true);
      const res = await staffService.updateEmployee(editingStaffId, editForm);
      showBanner('success', res.message || `Staff member ${editForm.firstName} ${editForm.lastName} updated successfully.`);
      setIsEditModalOpen(false);
      setEditingStaffId(null);
      await loadEmployees();
    } catch (err) {
      console.error(err);
      showBanner('error', err.response?.data?.message || err.message || 'Failed to update employee details.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    try {
      const res = await staffService.createEmployee(employeeForm);
      showBanner('success', res.message || 'Employee registered into HR directory successfully.');
      setIsEmployeeModalOpen(false);
      setEmployeeForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        gender: 'Male',
        age: '',
        dateOfBirth: '',
        departmentId: '',
        designationId: '',
        basicSalary: 3500,
        employmentType: 'Full-Time',
        customUsername: '',
        customPassword: '',
      });
      loadEmployees();
    } catch (err) {
      showBanner('error', err.response?.data?.message || 'Failed to create employee.');
    }
  };

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    try {
      await staffService.submitLeave(leaveForm);
      showBanner('success', 'Leave application submitted.');
      setIsLeaveModalOpen(false);
      loadLeaves();
    } catch (err) {
      showBanner('error', err.response?.data?.message || 'Failed to submit leave.');
    }
  };

  const handleReviewLeave = async (id, status) => {
    try {
      await staffService.reviewLeave(id, { status, reviewRemarks: `Leave ${status} by Administrator` });
      showBanner('success', `Leave marked as ${status}.`);
      loadLeaves();
    } catch (err) {
      showBanner('error', 'Failed to update leave.');
    }
  };

  const handleGeneratePayroll = async () => {
    try {
      const res = await staffService.generatePayroll({ month: payrollMonth, year: payrollYear });
      showBanner('success', res.data?.message || 'Payroll generated successfully.');
      loadPayrolls();
    } catch (err) {
      showBanner('error', err.response?.data?.message || 'Failed to generate payroll.');
    }
  };

  const handleMarkPayrollPaid = async (id) => {
    try {
      await staffService.updatePayrollStatus(id, {
        status: 'Paid',
        paymentMethod: 'Bank Transfer',
      });
      showBanner('success', 'Payroll marked as Paid.');
      loadPayrolls();
    } catch (err) {
      showBanner('error', 'Failed to update payroll status.');
    }
  };

  const handleCreateDept = async (e) => {
    e.preventDefault();
    try {
      await staffService.createDepartment(deptForm);
      showBanner('success', 'Department created successfully.');
      setIsDeptModalOpen(false);
      loadDepartmentsAndDesignations();
    } catch (err) {
      showBanner('error', err.response?.data?.message || 'Failed to create department.');
    }
  };

  const handleCreateDesig = async (e) => {
    e.preventDefault();
    try {
      const res = await staffService.createDesignation({
        title: desigForm.title.trim(),
        code: desigForm.code.trim().toUpperCase(),
        departmentId: desigForm.departmentId,
        description: desigForm.description?.trim(),
      });
      showBanner('success', `Designation "${desigForm.title}" created successfully.`);
      setIsDesigModalOpen(false);

      // Auto-select in employee registration form if open
      if (res.data?.data?._id) {
        const created = res.data.data;
        setEmployeeForm((prev) => ({
          ...prev,
          departmentId: desigForm.departmentId || prev.departmentId,
          designationId: created._id,
        }));
      }

      setDesigForm({ title: '', code: '', departmentId: '', description: '', codeManual: false });
      loadDepartmentsAndDesignations();
    } catch (err) {
      showBanner('error', err.response?.data?.message || 'Failed to create designation.');
    }
  };

  const filteredDesignations = employeeForm.departmentId
    ? designations.filter((d) => {
        const dDeptId = d.departmentId?._id || d.departmentId;
        return dDeptId?.toString() === employeeForm.departmentId?.toString();
      })
    : designations;

  const filteredEditDesignations = editForm.departmentId
    ? designations.filter((d) => {
        const dDeptId = d.departmentId?._id || d.departmentId;
        return dDeptId?.toString() === editForm.departmentId?.toString();
      })
    : designations;

  return (
    <div className="space-y-6">
      {banner.text && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-sm font-medium ${
            banner.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {banner.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600" />
            )}
            <span>{banner.text}</span>
          </div>
          <button onClick={() => setBanner({ type: '', text: '' })}>
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Staff, HR & Payroll Management
            </h1>
            <Badge variant="primary">Phase 8</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Institutional employee directory, department hierarchy, leave desk, and monthly payroll processing.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            onClick={() => setIsDeptModalOpen(true)}
            icon={<Building2 className="w-4 h-4" />}
          >
            + Department
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setDesigForm({
                title: '',
                code: '',
                departmentId: departments[0]?._id || '',
                description: '',
                codeManual: false,
              });
              setIsDesigModalOpen(true);
            }}
            icon={<Briefcase className="w-4 h-4" />}
          >
            + Designation
          </Button>
          <Button
            variant="primary"
            onClick={() => setIsEmployeeModalOpen(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            Hire Employee
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto">
        {[
          { id: 'directory', label: 'Employee Directory', icon: Users },
          { id: 'departments', label: 'Departments & Roles', icon: Building2 },
          { id: 'leaves', label: 'Staff Leaves', icon: Calendar },
          { id: 'payroll', label: 'Monthly Payroll', icon: DollarSign },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
                isActive
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {loading && (
        <div className="py-12 flex justify-center">
          <LoadingSpinner size="lg" message="Loading staff data..." />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. EMPLOYEE DIRECTORY */}
      {/* ========================================================================= */}
      {!loading && activeTab === 'directory' && (
        <div className="space-y-4">
          <Card className="p-4">
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search staff by name, ID, email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadEmployees()}
                  className="w-full pl-9 pr-9 py-2 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-md"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white"
                >
                  <option value="">All Departments</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name}
                    </option>
                  ))}
                </select>

                <Button variant="secondary" onClick={loadEmployees} icon={<Filter className="w-3.5 h-3.5" />}>
                  Filter
                </Button>
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Employee ID</th>
                    <th className="py-3.5 px-4">Name & Contact</th>
                    <th className="py-3.5 px-4">Department</th>
                    <th className="py-3.5 px-4">Designation</th>
                    <th className="py-3.5 px-4 text-right">Basic Salary</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    {canEditStaff && <th className="py-3.5 px-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {employees.length > 0 ? (
                    employees.map((emp) => {
                      const empAge = emp.age !== undefined && emp.age !== null ? emp.age : emp.calculatedAge;
                      return (
                        <tr key={emp._id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                            {emp.employeeId}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-800 flex items-center gap-2">
                              <span>{emp.firstName} {emp.lastName}</span>
                              {empAge !== undefined && empAge !== null && empAge !== '' && (
                                <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600">
                                  Age: {empAge}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400">
                              {emp.email} • {emp.phone} {emp.gender ? `• ${emp.gender}` : ''}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="secondary">{emp.departmentId?.name || 'Department'}</Badge>
                          </td>
                          <td className="py-3 px-4 text-slate-700 font-medium">
                            {emp.designationId?.title || 'Staff'}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-slate-900">
                            ${emp.salaryStructure?.basicSalary || emp.basicSalary}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Badge variant={emp.status === 'Active' ? 'success' : emp.status === 'On Leave' ? 'warning' : 'danger'}>
                              {emp.status}
                            </Badge>
                          </td>
                          {canEditStaff && (
                            <td className="py-3 px-4 text-right">
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleOpenEdit(emp)}
                                icon={<Edit2 className="w-3.5 h-3.5" />}
                                className="text-xs font-semibold text-slate-700 hover:text-indigo-600 hover:border-indigo-300"
                              >
                                Edit
                              </Button>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={canEditStaff ? "7" : "6"} className="py-12 text-center text-slate-400">
                        No employees found. Click "Hire Employee" to register staff.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. STAFF LEAVES */}
      {/* ========================================================================= */}
      {!loading && activeTab === 'leaves' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-800">Leave Applications Desk</h3>
            <Button
              variant="primary"
              onClick={() => setIsLeaveModalOpen(true)}
              icon={<Plus className="w-4 h-4" />}
            >
              Apply for Leave
            </Button>
          </div>

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Employee</th>
                    <th className="py-3.5 px-4">Leave Type</th>
                    <th className="py-3.5 px-4 text-center">Duration</th>
                    <th className="py-3.5 px-4">Reason</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leaves.length > 0 ? (
                    leaves.map((l) => (
                      <tr key={l._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800">
                            {l.employeeId?.firstName} {l.employeeId?.lastName}
                          </div>
                          <div className="text-xs text-slate-400">{l.employeeId?.employeeId}</div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="secondary">{l.leaveType}</Badge>
                        </td>
                        <td className="py-3 px-4 text-center text-xs text-slate-600">
                          {new Date(l.startDate).toLocaleDateString()} -{' '}
                          {new Date(l.endDate).toLocaleDateString()}
                          <span className="block font-bold text-slate-800">({l.totalDays} days)</span>
                        </td>
                        <td className="py-3 px-4 text-slate-700 text-xs">{l.reason}</td>
                        <td className="py-3 px-4 text-center">
                          <Badge
                            variant={
                              l.status === 'Approved'
                                ? 'success'
                                : l.status === 'Rejected'
                                ? 'danger'
                                : 'warning'
                            }
                          >
                            {l.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {l.status === 'Pending' && (
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => handleReviewLeave(l._id, 'Approved')}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleReviewLeave(l._id, 'Rejected')}
                              >
                                Reject
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-slate-400">
                        No leave requests submitted.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. MONTHLY PAYROLL */}
      {/* ========================================================================= */}
      {!loading && activeTab === 'payroll' && (
        <div className="space-y-4">
          <Card className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400">Month</label>
                <select
                  value={payrollMonth}
                  onChange={(e) => setPayrollMonth(Number(e.target.value))}
                  className="px-3 py-1.5 text-sm rounded-xl border border-slate-200 bg-white"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                    <option key={m} value={m}>
                      Month {m}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400">Year</label>
                <select
                  value={payrollYear}
                  onChange={(e) => setPayrollYear(Number(e.target.value))}
                  className="px-3 py-1.5 text-sm rounded-xl border border-slate-200 bg-white"
                >
                  {[2025, 2026, 2027].map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Button
              variant="primary"
              onClick={handleGeneratePayroll}
              icon={<DollarSign className="w-4 h-4" />}
            >
              Generate Monthly Payroll
            </Button>
          </Card>

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Payslip #</th>
                    <th className="py-3.5 px-4">Employee</th>
                    <th className="py-3.5 px-4 text-right">Basic</th>
                    <th className="py-3.5 px-4 text-right">Allowances</th>
                    <th className="py-3.5 px-4 text-right">Deductions</th>
                    <th className="py-3.5 px-4 text-right">Net Salary</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payrolls.length > 0 ? (
                    payrolls.map((p) => (
                      <tr key={p._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                          {p.payslipNumber}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800">
                            {p.employeeId?.firstName} {p.employeeId?.lastName}
                          </div>
                          <div className="text-xs text-slate-400">{p.employeeId?.employeeId}</div>
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-slate-700">
                          ${p.basicSalary}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-emerald-600">
                          +${p.totalAllowances}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-rose-600">
                          -${p.totalDeductions}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900 text-base">
                          ${p.netSalary}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant={p.status === 'Paid' ? 'success' : 'warning'}>
                            {p.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {p.status !== 'Paid' && (
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => handleMarkPayrollPaid(p._id)}
                              icon={<CreditCard className="w-3.5 h-3.5" />}
                            >
                              Pay
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="py-12 text-center text-slate-400">
                        No payroll records generated for Month {payrollMonth}/{payrollYear}. Click "Generate Monthly Payroll" to compute salaries.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. DEPARTMENTS & DESIGNATIONS */}
      {/* ========================================================================= */}
      {!loading && activeTab === 'departments' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                School Organizational Structure & Designations
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage institutional departments, faculty job titles, and administrative designations.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsDeptModalOpen(true)}
                icon={<Building2 className="w-3.5 h-3.5" />}
              >
                + New Department
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setDesigForm({
                    title: '',
                    code: '',
                    departmentId: departments[0]?._id || '',
                    description: '',
                    codeManual: false,
                  });
                  setIsDesigModalOpen(true);
                }}
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                + New Designation
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {departments.map((dept) => {
              const deptDesigs = designations.filter((d) => {
                const dDeptId = d.departmentId?._id || d.departmentId;
                return dDeptId?.toString() === dept._id?.toString();
              });

              return (
                <Card key={dept._id} className="p-5 flex flex-col justify-between border-slate-200 hover:border-indigo-300 transition-all bg-white shadow-xs">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {dept.code}
                      </span>
                      <span className="text-xs font-semibold text-slate-400">
                        {deptDesigs.length} {deptDesigs.length === 1 ? 'Designation' : 'Designations'}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900">{dept.name}</h3>
                    {dept.description && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{dept.description}</p>
                    )}

                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                        Assigned Designations
                      </div>
                      {deptDesigs.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {deptDesigs.map((des) => (
                            <span
                              key={des._id}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium"
                              title={des.description || des.title}
                            >
                              <Briefcase className="w-3 h-3 text-slate-400" />
                              <span>{des.title}</span>
                              <span className="text-[10px] font-mono text-slate-400">({des.code})</span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">No designations added to this department yet.</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setDesigForm({
                          title: '',
                          code: '',
                          departmentId: dept._id,
                          description: '',
                          codeManual: false,
                        });
                        setIsDesigModalOpen(true);
                      }}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Designation to {dept.code}
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: HIRE EMPLOYEE */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isEmployeeModalOpen}
        onClose={() => setIsEmployeeModalOpen(false)}
        title="Register New School Employee"
      >
        <form onSubmit={handleCreateEmployee} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">First Name *</label>
              <input
                type="text"
                required
                value={employeeForm.firstName}
                onChange={(e) => setEmployeeForm({ ...employeeForm, firstName: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Last Name *</label>
              <input
                type="text"
                required
                value={employeeForm.lastName}
                onChange={(e) => setEmployeeForm({ ...employeeForm, lastName: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Work Email *</label>
              <input
                type="email"
                required
                value={employeeForm.email}
                onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Mobile / Phone *</label>
              <input
                type="tel"
                required
                value={employeeForm.phone}
                onChange={(e) => setEmployeeForm({ ...employeeForm, phone: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Gender *</label>
              <select
                value={employeeForm.gender}
                onChange={(e) => setEmployeeForm({ ...employeeForm, gender: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Age (Years)</label>
              <input
                type="number"
                min="18"
                max="100"
                placeholder="e.g. 30"
                value={employeeForm.age || ''}
                onChange={(e) => {
                  const ageVal = e.target.value;
                  let newDob = employeeForm.dateOfBirth;
                  if (ageVal && !newDob) {
                    const approxYear = new Date().getFullYear() - Number(ageVal);
                    newDob = `${approxYear}-01-01`;
                  }
                  setEmployeeForm({ ...employeeForm, age: ageVal, dateOfBirth: newDob });
                }}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Date of Birth</label>
              <input
                type="date"
                value={employeeForm.dateOfBirth || ''}
                onChange={(e) => {
                  const dobVal = e.target.value;
                  let newAge = employeeForm.age;
                  if (dobVal) {
                    const today = new Date();
                    const birthDate = new Date(dobVal);
                    let a = today.getFullYear() - birthDate.getFullYear();
                    const m = today.getMonth() - birthDate.getMonth();
                    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                      a--;
                    }
                    if (a > 0) newAge = a;
                  }
                  setEmployeeForm({ ...employeeForm, dateOfBirth: dobVal, age: newAge });
                }}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-600">Department *</label>
                <button
                  type="button"
                  onClick={() => setIsDeptModalOpen(true)}
                  className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 cursor-pointer"
                  title="Create a new department"
                >
                  <Plus className="w-3 h-3" /> Add Dept
                </button>
              </div>
              <select
                required
                value={employeeForm.departmentId}
                onChange={(e) => {
                  const newDeptId = e.target.value;
                  const currentDesig = designations.find((d) => d._id === employeeForm.designationId);
                  const desigDeptId = currentDesig?.departmentId?._id || currentDesig?.departmentId;
                  setEmployeeForm({
                    ...employeeForm,
                    departmentId: newDeptId,
                    designationId: newDeptId && desigDeptId?.toString() !== newDeptId?.toString() ? '' : employeeForm.designationId,
                  });
                }}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white"
              >
                <option value="">Select Department</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-600">Designation *</label>
                <button
                  type="button"
                  onClick={() => {
                    setDesigForm({
                      title: '',
                      code: '',
                      departmentId: employeeForm.departmentId || (departments[0]?._id || ''),
                      description: '',
                      codeManual: false,
                    });
                    setIsDesigModalOpen(true);
                  }}
                  className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 cursor-pointer"
                  title="Define a new designation/job title"
                >
                  <Plus className="w-3 h-3" /> Add Designation
                </button>
              </div>
              <select
                required
                value={employeeForm.designationId}
                onChange={(e) => {
                  const selId = e.target.value;
                  const chosenDesig = designations.find((d) => d._id === selId);
                  const desigDeptId = chosenDesig?.departmentId?._id || chosenDesig?.departmentId;
                  setEmployeeForm({
                    ...employeeForm,
                    designationId: selId,
                    departmentId: (!employeeForm.departmentId && desigDeptId) ? desigDeptId : employeeForm.departmentId,
                  });
                }}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white"
              >
                <option value="">Select Designation</option>
                {filteredDesignations.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.title} {!employeeForm.departmentId && d.departmentId?.name ? `(${d.departmentId.name})` : ''}
                  </option>
                ))}
              </select>
              {filteredDesignations.length === 0 && employeeForm.departmentId && (
                <p className="text-[11px] text-amber-600 mt-1">
                  No designations in this department yet. Click "+ Add Designation" above.
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Basic Salary ($) *</label>
              <input
                type="number"
                min="0"
                required
                value={employeeForm.basicSalary}
                onChange={(e) => setEmployeeForm({ ...employeeForm, basicSalary: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Employment Type</label>
              <select
                value={employeeForm.employmentType}
                onChange={(e) => setEmployeeForm({ ...employeeForm, employmentType: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white"
              >
                <option value="Full-Time">Full-Time</option>
                <option value="Part-Time">Part-Time</option>
                <option value="Contract">Contract</option>
              </select>
            </div>
          </div>

          {/* CRM Login Account Provisioning */}
          <div className="bg-indigo-50/70 p-3.5 rounded-2xl border border-indigo-100 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-950">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>CRM Login Account Setup</span>
            </div>
            <p className="text-[11px] text-slate-500">
              A login user account is automatically created. Default password is <strong className="text-indigo-700 font-mono bg-white px-1.5 py-0.5 rounded border border-indigo-200">FirstName@12345</strong> (e.g. Rahul@12345).
            </p>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Custom User ID (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. rahul or rahul.maths"
                  value={employeeForm.customUsername || ''}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, customUsername: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Custom Password (Optional)</label>
                <input
                  type="text"
                  placeholder="Default: FirstName@12345"
                  value={employeeForm.customPassword || ''}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, customPassword: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setIsEmployeeModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Register Employee
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: EDIT EMPLOYEE */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Staff Member Details"
      >
        <form onSubmit={handleUpdateEmployee} className="space-y-4 max-h-[75vh] overflow-y-auto px-1">
          {/* Section: Personal Information */}
          <div className="border-b border-slate-100 pb-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
              Personal Information
            </h4>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">First Name *</label>
                <input
                  type="text"
                  required
                  value={editForm.firstName}
                  onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Last Name *</label>
                <input
                  type="text"
                  required
                  value={editForm.lastName}
                  onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Mobile No *</label>
                <input
                  type="tel"
                  required
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Age (Years)</label>
                <input
                  type="number"
                  min="18"
                  max="100"
                  placeholder="e.g. 32"
                  value={editForm.age}
                  onChange={(e) => {
                    const ageVal = e.target.value;
                    let newDob = editForm.dateOfBirth;
                    if (ageVal && !newDob) {
                      const approxYear = new Date().getFullYear() - Number(ageVal);
                      newDob = `${approxYear}-01-01`;
                    }
                    setEditForm({ ...editForm, age: ageVal, dateOfBirth: newDob });
                  }}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={editForm.dateOfBirth}
                  onChange={(e) => {
                    const dobVal = e.target.value;
                    let newAge = editForm.age;
                    if (dobVal) {
                      const today = new Date();
                      const birthDate = new Date(dobVal);
                      let a = today.getFullYear() - birthDate.getFullYear();
                      const m = today.getMonth() - birthDate.getMonth();
                      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                        a--;
                      }
                      if (a > 0) newAge = a;
                    }
                    setEditForm({ ...editForm, dateOfBirth: dobVal, age: newAge });
                  }}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Gender *</label>
                <select
                  value={editForm.gender}
                  onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:border-indigo-500"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Work Email *</label>
                <input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Section: Job & Department */}
          <div className="border-b border-slate-100 pb-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
              Employment & Designation
            </h4>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Department *</label>
                <select
                  required
                  value={editForm.departmentId}
                  onChange={(e) => {
                    const newDeptId = e.target.value;
                    const currentDesig = designations.find((d) => d._id === editForm.designationId);
                    const desigDeptId = currentDesig?.departmentId?._id || currentDesig?.departmentId;
                    setEditForm({
                      ...editForm,
                      departmentId: newDeptId,
                      designationId: newDeptId && desigDeptId?.toString() !== newDeptId?.toString() ? '' : editForm.designationId,
                    });
                  }}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white"
                >
                  <option value="">Select Department</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Designation *</label>
                <select
                  required
                  value={editForm.designationId}
                  onChange={(e) => {
                    const selId = e.target.value;
                    const chosenDesig = designations.find((d) => d._id === selId);
                    const desigDeptId = chosenDesig?.departmentId?._id || chosenDesig?.departmentId;
                    setEditForm({
                      ...editForm,
                      designationId: selId,
                      departmentId: (!editForm.departmentId && desigDeptId) ? desigDeptId : editForm.departmentId,
                    });
                  }}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white"
                >
                  <option value="">Select Designation</option>
                  {filteredEditDesignations.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.title} {!editForm.departmentId && d.departmentId?.name ? `(${d.departmentId.name})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Employment Type</label>
                <select
                  value={editForm.employmentType}
                  onChange={(e) => setEditForm({ ...editForm, employmentType: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white"
                >
                  <option value="Full-Time">Full-Time</option>
                  <option value="Part-Time">Part-Time</option>
                  <option value="Contract">Contract</option>
                  <option value="Probation">Probation</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white font-semibold"
                >
                  <option value="Active">Active</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Suspended">Suspended</option>
                  <option value="Terminated">Terminated</option>
                  <option value="Resigned">Resigned</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Basic Salary ($) *</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={editForm.basicSalary}
                  onChange={(e) => setEditForm({ ...editForm, basicSalary: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Qualification</label>
                <input
                  type="text"
                  placeholder="e.g. M.Sc. Mathematics, B.Ed."
                  value={editForm.qualification}
                  onChange={(e) => setEditForm({ ...editForm, qualification: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Experience (Years)</label>
                <input
                  type="number"
                  min="0"
                  value={editForm.experienceYears}
                  onChange={(e) => setEditForm({ ...editForm, experienceYears: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200"
                />
              </div>
            </div>
          </div>

          {/* Section: Address & Emergency Contact */}
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
              Address & Emergency Details
            </h4>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Street Address</label>
                <input
                  type="text"
                  placeholder="Street / Flat / House"
                  value={editForm.address.street}
                  onChange={(e) => setEditForm({ ...editForm, address: { ...editForm.address, street: e.target.value } })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">City</label>
                <input
                  type="text"
                  placeholder="City"
                  value={editForm.address.city}
                  onChange={(e) => setEditForm({ ...editForm, address: { ...editForm.address, city: e.target.value } })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">State</label>
                <input
                  type="text"
                  placeholder="State"
                  value={editForm.address.state}
                  onChange={(e) => setEditForm({ ...editForm, address: { ...editForm.address, state: e.target.value } })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Postal Code</label>
                <input
                  type="text"
                  placeholder="ZIP / PIN"
                  value={editForm.address.postalCode}
                  onChange={(e) => setEditForm({ ...editForm, address: { ...editForm.address, postalCode: e.target.value } })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Emergency Phone</label>
                <input
                  type="tel"
                  placeholder="Emergency phone"
                  value={editForm.emergencyContact.phone}
                  onChange={(e) => setEditForm({ ...editForm, emergencyContact: { ...editForm.emergencyContact, phone: e.target.value } })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: APPLY LEAVE */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        title="Submit Staff Leave Application"
      >
        <form onSubmit={handleApplyLeave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Select Employee *</label>
            <select
              required
              value={leaveForm.employeeId}
              onChange={(e) => setLeaveForm({ ...leaveForm, employeeId: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white"
            >
              <option value="">Select Employee</option>
              {employees.map((e) => (
                <option key={e._id} value={e._id}>
                  {e.firstName} {e.lastName} ({e.employeeId})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Start Date *</label>
              <input
                type="date"
                required
                value={leaveForm.startDate}
                onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">End Date *</label>
              <input
                type="date"
                required
                value={leaveForm.endDate}
                onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Leave Type</label>
            <select
              value={leaveForm.leaveType}
              onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white"
            >
              <option value="Casual">Casual Leave</option>
              <option value="Sick">Medical / Sick Leave</option>
              <option value="Earned">Earned Leave</option>
              <option value="Unpaid">Unpaid Leave</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Reason *</label>
            <input
              type="text"
              required
              placeholder="e.g. Attending family emergency"
              value={leaveForm.reason}
              onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setIsLeaveModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Submit Leave
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: CREATE DEPARTMENT */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isDeptModalOpen}
        onClose={() => setIsDeptModalOpen(false)}
        title="Create School Department"
      >
        <form onSubmit={handleCreateDept} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Department Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Physical Education & Athletics"
              value={deptForm.name}
              onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Department Code *</label>
            <input
              type="text"
              required
              placeholder="e.g. PEA"
              value={deptForm.code}
              onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value.toUpperCase() })}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 font-mono uppercase"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setIsDeptModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Create Department
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: CREATE DESIGNATION */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isDesigModalOpen}
        onClose={() => setIsDesigModalOpen(false)}
        title="Create School Designation / Job Title"
      >
        <form onSubmit={handleCreateDesig} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Select Department *
            </label>
            <select
              required
              value={desigForm.departmentId}
              onChange={(e) => setDesigForm({ ...desigForm, departmentId: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white"
            >
              <option value="">Select Department</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Designation Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Senior Physics Faculty, Chief Librarian, Sports Coach"
              value={desigForm.title}
              onChange={(e) => {
                const titleVal = e.target.value;
                setDesigForm({
                  ...desigForm,
                  title: titleVal,
                  code: desigForm.codeManual
                    ? desigForm.code
                    : titleVal.replace(/[^A-Za-z0-9]/g, '').slice(0, 4).toUpperCase(),
                });
              }}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Designation Code *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. PHYS, LIBR, TCHR"
              value={desigForm.code}
              onChange={(e) =>
                setDesigForm({ ...desigForm, code: e.target.value.toUpperCase(), codeManual: true })
              }
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 font-mono uppercase"
            />
            <p className="text-[11px] text-slate-400 mt-1">Short uppercase code used in payroll, IDs, and reports.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Role Description (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Responsibilities, scope, or qualifications for this position..."
              value={desigForm.description}
              onChange={(e) => setDesigForm({ ...desigForm, description: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setIsDesigModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" icon={<Plus className="w-4 h-4" />}>
              Save Designation
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default StaffPage;
