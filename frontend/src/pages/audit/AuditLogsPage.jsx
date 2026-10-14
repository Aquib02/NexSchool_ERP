import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  ShieldCheck,
  ShieldAlert,
  Search,
  Filter,
  Download,
  Clock,
  User,
  Activity,
  AlertCircle,
  Eye,
  CheckCircle2,
  XCircle,
  X,
  Printer,
  RefreshCw,
  Copy,
  Check,
  Calendar,
  CalendarDays,
  Globe,
  Terminal,
  Layers,
  Info,
  ChevronRight,
  ArrowRight,
  Lock,
} from 'lucide-react';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';
import Modal from '../../components/common/Modal.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import auditService from '../../services/auditService.js';
import { printElement } from '../../utils/printUtils.js';

export const AuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [resourceFilter, setResourceFilter] = useState('All');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [datePreset, setDatePreset] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Selected Log for Inspection Modal
  const [selectedLog, setSelectedLog] = useState(null);
  const [copiedJson, setCopiedJson] = useState(false);

  // Print Preview Modal
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const [banner, setBanner] = useState({ type: '', text: '' });
  const showBanner = (type, text) => {
    setBanner({ type, text });
    setTimeout(() => setBanner({ type: '', text: '' }), 4000);
  };

  // Preset Date Range Handler
  const handleDatePreset = (preset) => {
    setDatePreset(preset);
    setPage(1);
    const today = new Date();
    const formatDate = (d) => d.toISOString().split('T')[0];

    if (preset === 'today') {
      const todayStr = formatDate(today);
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === '7days') {
      const past = new Date();
      past.setDate(today.getDate() - 7);
      setStartDate(formatDate(past));
      setEndDate(formatDate(today));
    } else if (preset === '30days') {
      const past = new Date();
      past.setDate(today.getDate() - 30);
      setStartDate(formatDate(past));
      setEndDate(formatDate(today));
    } else {
      setStartDate('');
      setEndDate('');
    }
  };

  const loadLogs = async () => {
    try {
      setLoading(true);
      const params = { page, limit: 30 };
      if (search.trim()) params.search = search.trim();
      if (resourceFilter !== 'All') params.resource = resourceFilter;
      if (roleFilter !== 'All') params.actorRole = roleFilter;
      if (statusFilter !== 'All') params.status = statusFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await auditService.getLogs(params);
      if (res.data?.data) {
        setLogs(res.data.data);
        setTotalPages(res.data.totalPages || 1);
        setTotalCount(res.data.total || 0);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
      showBanner('error', 'Failed to load system audit trail');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const res = await auditService.getStats();
      if (res.data?.data) setStats(res.data.data);
    } catch (err) {
      console.error('Failed to load audit statistics:', err);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [page, resourceFilter, roleFilter, statusFilter, startDate, endDate]);

  useEffect(() => {
    loadStats();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadLogs();
  };

  const handleResetFilters = () => {
    setSearch('');
    setResourceFilter('All');
    setRoleFilter('All');
    setStatusFilter('All');
    setStartDate('');
    setEndDate('');
    setDatePreset('all');
    setPage(1);
  };

  // Export CSV
  const handleExportCsv = async () => {
    try {
      const res = await auditService.exportLogs({
        resource: resourceFilter !== 'All' ? resourceFilter : undefined,
        status: statusFilter !== 'All' ? statusFilter : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });

      const exportData = res.data?.data || logs;
      if (!exportData || exportData.length === 0) {
        showBanner('error', 'No audit logs found to export');
        return;
      }

      const headers = [
        'Timestamp',
        'Responsible Actor Name',
        'Actor Role',
        'Actor Email',
        'Actor User ID',
        'Action Event',
        'Resource Module',
        'Target Resource ID',
        'Description / Summary',
        'Client IP Address',
        'Status',
        'Failure Reason',
      ];

      const rows = exportData.map((l) => [
        `"${new Date(l.createdAt).toLocaleString('en-GB')}"`,
        `"${(l.actorName || 'System').replace(/"/g, '""')}"`,
        `"${(l.actorRole || 'SYSTEM').replace(/"/g, '""')}"`,
        `"${(l.actorEmail || l.actorId?.email || '').replace(/"/g, '""')}"`,
        `"${(l.actorId?._id || l.actorId || '').replace(/"/g, '""')}"`,
        `"${(l.action || '').replace(/"/g, '""')}"`,
        `"${(l.resource || '').replace(/"/g, '""')}"`,
        `"${(l.resourceId || '').replace(/"/g, '""')}"`,
        `"${(l.description || '').replace(/"/g, '""')}"`,
        `"${(l.ipAddress || '').replace(/"/g, '""')}"`,
        `"${(l.status || '').replace(/"/g, '""')}"`,
        `"${(l.failureReason || '').replace(/"/g, '""')}"`,
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Security_Audit_Trail_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showBanner('success', `Exported ${exportData.length} audit records to CSV.`);
    } catch (err) {
      console.error('Export CSV error:', err);
      showBanner('error', 'Failed to export CSV audit logs');
    }
  };

  // Export JSON
  const handleExportJson = async () => {
    try {
      const res = await auditService.exportLogs({
        resource: resourceFilter !== 'All' ? resourceFilter : undefined,
        status: statusFilter !== 'All' ? statusFilter : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });

      const dataStr =
        'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(res.data?.data || logs, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `Audit_Trail_Export_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      showBanner('success', `Exported ${res.data?.count || logs.length} audit records to JSON.`);
    } catch (err) {
      console.error(err);
      showBanner('error', 'Failed to export JSON audit logs');
    }
  };

  // Print Compliance Audit Document
  const handlePrintAudit = () => {
    printElement('printable-audit-trail', 'System_Security_Audit_Trail', { orientation: 'landscape' });
  };

  const handleCopyJson = (data) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  // Role Badge Styling Helper
  const getRoleBadgeClass = (role) => {
    switch (role?.toUpperCase()) {
      case 'SUPER_ADMIN':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'PRINCIPAL':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'TEACHER':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ACCOUNTANT':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'STUDENT':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'PARENT':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const hasActiveFilters =
    search.trim() ||
    resourceFilter !== 'All' ||
    roleFilter !== 'All' ||
    statusFilter !== 'All' ||
    startDate ||
    endDate;

  return (
    <div className="space-y-6">
      {/* Banner */}
      {banner.text && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-sm font-medium ${
            banner.type === 'error'
              ? 'bg-rose-50 text-rose-700 border border-rose-200'
              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {banner.type === 'error' ? <AlertCircle className="w-5 h-5 text-rose-600" /> : <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
            <span>{banner.text}</span>
          </div>
          <button onClick={() => setBanner({ type: '', text: '' })} className="cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
            Immutable Security & Compliance Ledger
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            Admin System Activity Tracker & Audit Trail
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
            Continuously records all administrative operations, logins, student record changes, exam marks, fee collections, and homework activities with user identity, roles, and IP addresses.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            onClick={() => {
              loadLogs();
              loadStats();
              showBanner('success', 'Refreshed audit logs.');
            }}
          >
            Refresh
          </Button>

          <Button
            variant="secondary"
            size="sm"
            icon={Download}
            onClick={handleExportCsv}
          >
            Export CSV
          </Button>

          <Button
            variant="outline"
            size="sm"
            icon={FileText}
            onClick={handleExportJson}
          >
            Export JSON
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={Printer}
            onClick={handlePrintAudit}
          >
            Print Audit Report
          </Button>
        </div>
      </div>

      {/* Security Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-blue-50/80 border border-blue-200/90 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-blue-900 text-xs font-bold">
            <span>Total Logged Activities</span>
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-950 mt-1.5 tracking-tight">
            {stats?.totalLogs !== undefined ? stats.totalLogs : totalCount}
          </div>
          <div className="text-[10px] text-blue-700 font-medium mt-0.5">Immutable System Events</div>
        </div>

        <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-emerald-900 text-xs font-bold">
            <span>Successful Operations</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-1.5 tracking-tight">
            {stats?.successfulActions !== undefined ? stats.successfulActions : totalCount}
          </div>
          <div className="text-[10px] text-emerald-700 font-medium mt-0.5">Verified & Executed</div>
        </div>

        <div className="p-4 bg-rose-50/80 border border-rose-200 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-rose-900 text-xs font-bold">
            <span>Failed / Suspicious Events</span>
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-700 mt-1.5 tracking-tight">
            {stats?.failedActions || 0}
          </div>
          <div className="text-[10px] text-rose-700 font-medium mt-0.5">Rejected Or Unauthorized</div>
        </div>

        <div className="p-4 bg-purple-50/80 border border-purple-200 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-purple-900 text-xs font-bold">
            <span>Distinct Active Actors</span>
            <User className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-700 mt-1.5 tracking-tight">
            {stats?.distinctActorsCount || 1}
          </div>
          <div className="text-[10px] text-purple-700 font-medium mt-0.5">Accountable User Profiles</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <Card className="p-4 space-y-3 shadow-2xs border border-slate-200/80">
        <form onSubmit={handleSearchSubmit} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Search Input */}
            <div className="relative md:col-span-2">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by person name, email, action code, IP, or keywords..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {/* Resource / Module Dropdown */}
            <div>
              <select
                value={resourceFilter}
                onChange={(e) => {
                  setResourceFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50/70 focus:bg-white font-medium text-slate-800"
              >
                <option value="All">All Modules / Resources</option>
                <option value="Student">Student (Admissions & Profiles)</option>
                <option value="Academics">Academics</option>
                <option value="ExamMarks">Exam Marks Entry</option>
                <option value="ClassResults">Class Broadsheet & Results</option>
                <option value="Homework">Homework & Tasks</option>
                <option value="Attendance">Attendance</option>
                <option value="Timetable">Timetable & Schedule</option>
                <option value="ReportCard">Report Cards</option>
                <option value="Finance">Finance & Ledger</option>
                <option value="FeePayment">Fee Payments</option>
                <option value="FeeInvoice">Fee Invoices</option>
                <option value="Notice">Noticeboard</option>
                <option value="Auth">User Authentication / Logins</option>
                <option value="User">User Accounts & Roles</option>
                <option value="Staff">Faculty & Staff</option>
                <option value="Admission">Admission Applications</option>
              </select>
            </div>

            {/* Role Dropdown */}
            <div>
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50/70 focus:bg-white font-medium text-slate-800"
              >
                <option value="All">All User Roles</option>
                <option value="SUPER_ADMIN">SUPER_ADMIN (Owner)</option>
                <option value="ADMIN">ADMIN (School Administrator)</option>
                <option value="PRINCIPAL">PRINCIPAL</option>
                <option value="TEACHER">TEACHER (Faculty)</option>
                <option value="ACCOUNTANT">ACCOUNTANT (Finance)</option>
                <option value="STUDENT">STUDENT</option>
                <option value="PARENT">PARENT</option>
                <option value="GUEST">GUEST / UNAUTHENTICATED</option>
              </select>
            </div>
          </div>

          {/* Date Range & Status Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
            {/* Date Pickers & Quick Presets */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" /> Date:
              </span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDatePreset('custom');
                  setPage(1);
                }}
                className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg bg-white"
                title="Start Date"
              />
              <span className="text-slate-400 text-xs">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDatePreset('custom');
                  setPage(1);
                }}
                className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg bg-white"
                title="End Date"
              />

              {/* Quick Pills */}
              <div className="flex items-center gap-1 ml-1">
                <button
                  type="button"
                  onClick={() => handleDatePreset('today')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                    datePreset === 'today'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => handleDatePreset('7days')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                    datePreset === '7days'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  7 Days
                </button>
                <button
                  type="button"
                  onClick={() => handleDatePreset('30days')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                    datePreset === '30days'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  30 Days
                </button>
                {(startDate || endDate) && (
                  <button
                    type="button"
                    onClick={() => handleDatePreset('all')}
                    className="px-2 py-0.5 rounded text-[10px] font-medium text-rose-600 hover:bg-rose-50 cursor-pointer"
                  >
                    Clear Dates
                  </button>
                )}
              </div>
            </div>

            {/* Status & Search Submit */}
            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg bg-white font-medium text-slate-800"
              >
                <option value="All">All Statuses</option>
                <option value="SUCCESS">SUCCESS Only</option>
                <option value="FAILURE">FAILURE / REJECTED</option>
              </select>

              <Button variant="primary" size="sm" type="submit">
                Apply Filters
              </Button>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-2.5 py-1 text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </form>
      </Card>

      {/* Main Audit Log Table */}
      <Card className="p-0 overflow-hidden shadow-2xs border border-slate-200">
        <div className="p-3.5 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs text-slate-800">
              Activity Records ({totalCount} entries)
            </span>
            {hasActiveFilters && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 text-indigo-800">
                Filtered View
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-500">
            Click "Inspect Data" on any event to view actor ID and exact submitted payload
          </span>
        </div>

        {loading ? (
          <div className="py-16">
            <LoadingSpinner text="Querying immutable audit ledger..." />
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={ShieldCheck}
              title="No activities recorded matching criteria"
              description="System operations, logins, marks updates, homework modifications, and fee collections will automatically stream here."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-100/80 text-[11px] font-bold text-slate-700 uppercase border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 whitespace-nowrap">Timestamp</th>
                  <th className="py-2.5 px-3 min-w-[180px]">Responsible Person (Actor)</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">Action Event</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">Module</th>
                  <th className="py-2.5 px-3 min-w-[220px]">Activity Description</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">Origin (IP)</th>
                  <th className="py-2.5 px-3 text-center whitespace-nowrap">Status</th>
                  <th className="py-2.5 px-3 text-right whitespace-nowrap">Details & Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {logs.map((log) => {
                  const roleBadgeClass = getRoleBadgeClass(log.actorRole);
                  return (
                    <tr key={log._id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Timestamp */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">
                          {new Date(log.createdAt).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {new Date(log.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </div>
                      </td>

                      {/* Actor Information */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0">
                            {(log.actorName || 'S').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{log.actorName}</span>
                              <span
                                className={`text-[9px] uppercase font-mono px-1.5 py-0.2 rounded border font-bold ${roleBadgeClass}`}
                              >
                                {log.actorRole}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              {log.actorEmail || log.actorId?.email || (log.actorId ? `ID: ${String(log.actorId._id || log.actorId).slice(-6)}` : 'System')}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Action Code */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="font-mono text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200/60">
                          {log.action}
                        </span>
                      </td>

                      {/* Resource Module */}
                      <td className="py-2.5 px-3 whitespace-nowrap font-medium text-slate-700">
                        {log.resource}
                      </td>

                      {/* Description */}
                      <td className="py-2.5 px-3 text-[11px] text-slate-700 leading-snug">
                        {log.description || `${log.actorName} executed ${log.action}`}
                      </td>

                      {/* IP Address */}
                      <td className="py-2.5 px-3 whitespace-nowrap font-mono text-[11px] text-slate-600">
                        {log.ipAddress || 'Internal'}
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        {log.status === 'SUCCESS' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> SUCCESS
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200"
                            title={log.failureReason || 'Action failed'}
                          >
                            <XCircle className="w-3 h-3 text-rose-600" /> FAILED
                          </span>
                        )}
                      </td>

                      {/* Inspect Button */}
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedLog(log)}
                        >
                          <Eye className="w-3.5 h-3.5 mr-1 text-indigo-600" />
                          Inspect Data
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Strip */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between p-3.5 bg-slate-50/70 border-t border-slate-200 gap-2 text-xs text-slate-600">
            <span>
              Showing Page <strong>{page}</strong> of <strong>{totalPages}</strong> ({totalCount} total audit events)
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous Page
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next Page
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* MODAL: COMPREHENSIVE ACTIVITY & DATA MUTATION INSPECTOR */}
      {selectedLog && (
        <Modal
          isOpen={Boolean(selectedLog)}
          onClose={() => setSelectedLog(null)}
          title={`Audit Activity Inspector: ${selectedLog.action}`}
          subtitle={`Recorded on ${new Date(selectedLog.createdAt).toLocaleString('en-GB')}`}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-4 text-xs">
            {/* 1. Responsible Person Identity Card */}
            <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs uppercase tracking-wider text-indigo-950 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-indigo-600" />
                  Responsible Person (Performer Identity)
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase font-mono ${getRoleBadgeClass(
                    selectedLog.actorRole
                  )}`}
                >
                  {selectedLog.actorRole}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1 text-slate-700">
                <div>
                  <span className="text-[10px] text-slate-400 block">Name / Username</span>
                  <span className="font-bold text-slate-900 text-sm">{selectedLog.actorName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Email Address</span>
                  <span className="font-semibold text-slate-800">
                    {selectedLog.actorEmail || selectedLog.actorId?.email || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Account User ID</span>
                  <span className="font-mono text-[11px] text-slate-700">
                    {selectedLog.actorId?._id || selectedLog.actorId || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Client IP Address</span>
                  <span className="font-mono text-indigo-700 font-bold">{selectedLog.ipAddress || 'Internal'}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-[10px] text-slate-400 block">Device / User Agent</span>
                  <span className="text-[11px] text-slate-600 truncate block" title={selectedLog.userAgent}>
                    {selectedLog.userAgent || 'Standard Browser Client'}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Action Summary & Status Card */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Operation & Target</span>
                  <div className="font-bold text-sm text-slate-900 mt-0.5 flex items-center gap-2">
                    <span className="font-mono text-indigo-700">{selectedLog.action}</span>
                    <span className="text-slate-400">on</span>
                    <span className="text-slate-800">{selectedLog.resource}</span>
                    {selectedLog.resourceId && (
                      <span className="text-[11px] font-mono text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                        ID: {selectedLog.resourceId}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  {selectedLog.status === 'SUCCESS' ? (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> SUCCESS
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5 text-rose-600" /> FAILED
                    </span>
                  )}
                </div>
              </div>

              {selectedLog.description && (
                <div className="pt-1 text-slate-800 text-xs font-medium border-t border-slate-200/60 mt-1">
                  <strong>Summary:</strong> {selectedLog.description}
                </div>
              )}

              {selectedLog.failureReason && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                  <strong>Failure / Rejection Reason:</strong> {selectedLog.failureReason}
                </div>
              )}
            </div>

            {/* 3. Data Mutation Diff / Request Payload */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-xs text-slate-700 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-indigo-600" />
                  Data Payload & State Mutations
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyJson(selectedLog.diff || selectedLog.details)}
                  className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
                >
                  {copiedJson ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" /> Copy Payload JSON
                    </>
                  )}
                </button>
              </div>

              {selectedLog.diff ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <span className="text-[11px] font-bold text-rose-600 block mb-1">State Before Mutation:</span>
                    <pre className="p-3 bg-rose-50/50 border border-rose-200 rounded-xl overflow-x-auto text-[11px] font-mono text-rose-950 max-h-56">
                      {selectedLog.diff.before
                        ? JSON.stringify(selectedLog.diff.before, null, 2)
                        : '(New entity created / No prior state)'}
                    </pre>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-emerald-600 block mb-1">State After Mutation:</span>
                    <pre className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl overflow-x-auto text-[11px] font-mono text-emerald-950 max-h-56">
                      {selectedLog.diff.after
                        ? JSON.stringify(selectedLog.diff.after, null, 2)
                        : '(Entity deleted / Cleared state)'}
                    </pre>
                  </div>
                </div>
              ) : selectedLog.details ? (
                <div>
                  <pre className="p-3 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto text-[11px] font-mono text-emerald-400 max-h-56">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-slate-500 text-xs">
                  No state mutation diff attached to this event.
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <Button size="sm" variant="primary" onClick={() => setSelectedLog(null)}>
                Close Inspector
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* HIDDEN PRINTABLE CONTAINER FOR OFFICIAL SECURITY AUDIT REPORT */}
      <div id="printable-audit-trail" className="hidden space-y-4 text-xs text-slate-800">
        <div className="border-b-2 border-slate-900 pb-3 flex justify-between items-end">
          <div>
            <div className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">
              CENTRAL SECURITY & COMPLIANCE SYSTEM
            </div>
            <h2 className="text-xl font-black text-slate-900">
              System Administrative Activity Audit Trail
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Official activity ledger tracking user identities, timestamps, IP addresses, and state modifications.
            </p>
          </div>
          <div className="text-right text-[11px] text-slate-500">
            <p>Generated: {new Date().toLocaleDateString('en-GB')}</p>
            <p>Total Filtered Records: {logs.length}</p>
          </div>
        </div>

        <div className="border border-slate-300 rounded-lg overflow-x-auto">
          <table className="w-full text-left border-collapse text-[10px]">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold uppercase">
                <th className="p-2 whitespace-nowrap">Timestamp</th>
                <th className="p-2 whitespace-nowrap">Performer Name</th>
                <th className="p-2 whitespace-nowrap">Role</th>
                <th className="p-2 whitespace-nowrap">Action Code</th>
                <th className="p-2 whitespace-nowrap">Module</th>
                <th className="p-2">Description / Modification Summary</th>
                <th className="p-2 whitespace-nowrap">IP Address</th>
                <th className="p-2 text-center whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {logs.map((log) => (
                <tr key={log._id}>
                  <td className="p-2 whitespace-nowrap font-mono">
                    {new Date(log.createdAt).toLocaleString('en-GB')}
                  </td>
                  <td className="p-2 font-bold whitespace-nowrap">{log.actorName}</td>
                  <td className="p-2 font-mono whitespace-nowrap">{log.actorRole}</td>
                  <td className="p-2 font-mono font-bold whitespace-nowrap text-indigo-700">{log.action}</td>
                  <td className="p-2 whitespace-nowrap">{log.resource}</td>
                  <td className="p-2">{log.description || `${log.actorName} executed ${log.action}`}</td>
                  <td className="p-2 font-mono whitespace-nowrap">{log.ipAddress || 'Internal'}</td>
                  <td className="p-2 text-center font-bold whitespace-nowrap">
                    {log.status === 'SUCCESS' ? 'SUCCESS' : 'FAILED'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pt-6 border-t border-slate-300 grid grid-cols-3 gap-6 text-center text-xs">
          <div>
            <div className="border-b border-dashed border-slate-400 h-6 mb-1"></div>
            <p className="font-bold">System Administrator</p>
          </div>
          <div>
            <div className="border-b border-dashed border-slate-400 h-6 mb-1"></div>
            <p className="font-bold">Information Security Officer</p>
          </div>
          <div>
            <div className="border-b border-dashed border-slate-400 h-6 mb-1"></div>
            <p className="font-bold">Principal / Director Seal</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogsPage;
