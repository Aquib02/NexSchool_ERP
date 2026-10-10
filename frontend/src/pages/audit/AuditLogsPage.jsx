import React, { useState, useEffect } from 'react';
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
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';
import Modal from '../../components/common/Modal.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import auditService from '../../services/auditService.js';

export const AuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [resourceFilter, setResourceFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Selected Log for Diff Inspection
  const [selectedLog, setSelectedLog] = useState(null);

  const [banner, setBanner] = useState({ type: '', text: '' });
  const showBanner = (type, text) => {
    setBanner({ type, text });
    setTimeout(() => setBanner({ type: '', text: '' }), 4000);
  };

  const loadLogs = async () => {
    try {
      setLoading(true);
      const params = { page, limit: 30 };
      if (search) params.search = search;
      if (resourceFilter !== 'All') params.resource = resourceFilter;
      if (statusFilter !== 'All') params.status = statusFilter;

      const res = await auditService.getLogs(params);
      if (res.data?.data) {
        setLogs(res.data.data);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch (err) {
      console.error(err);
      showBanner('error', 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const res = await auditService.getStats();
      if (res.data?.data) setStats(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [page, resourceFilter, statusFilter]);

  useEffect(() => {
    loadStats();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadLogs();
  };

  const handleExport = async () => {
    try {
      const res = await auditService.exportLogs({
        resource: resourceFilter !== 'All' ? resourceFilter : undefined,
        status: statusFilter !== 'All' ? statusFilter : undefined,
      });

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(res.data?.data, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `audit_trail_export_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      showBanner('success', `Exported ${res.data?.count || 0} audit logs`);
    } catch (err) {
      console.error(err);
      showBanner('error', 'Failed to export audit logs');
    }
  };

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
          <span>{banner.text}</span>
          <button onClick={() => setBanner({ type: '', text: '' })}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="w-7 h-7 text-indigo-600" />
            Central System Audit Trail
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Strictly immutable security ledger capturing actor credentials, state mutation diffs, and compliance events.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-1.5" />
            Export Compliance Logs
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Total Audit Events</p>
            <h3 className="text-2xl font-bold text-slate-900">{stats?.totalLogs || logs.length}</h3>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Successful Actions</p>
            <h3 className="text-2xl font-bold text-slate-900">
              {stats?.successfulActions !== undefined ? stats.successfulActions : logs.length}
            </h3>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Failed Operations</p>
            <h3 className="text-2xl font-bold text-slate-900">{stats?.failedActions || 0}</h3>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <User className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Distinct Actors</p>
            <h3 className="text-2xl font-bold text-slate-900">{stats?.distinctActorsCount || 1}</h3>
          </div>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <Card className="p-5">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-center justify-between gap-3 mb-5">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by action, actor, IP, or resource..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <select
              value={resourceFilter}
              onChange={(e) => {
                setResourceFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white"
            >
              <option value="All">All Resources</option>
              {[
                'Student',
                'StudentFee',
                'Payment',
                'Receipt',
                'Notice',
                'AdmissionApplication',
                'MedicalRecord',
                'GatePass',
                'Visitor',
                'Asset',
                'ITTicket',
                'User',
              ].map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white"
            >
              <option value="All">All Statuses</option>
              <option value="SUCCESS">SUCCESS</option>
              <option value="FAILURE">FAILURE</option>
            </select>

            <Button variant="secondary" size="sm" type="submit">
              Search
            </Button>
          </div>
        </form>

        {/* Audit Log Table */}
        {loading ? (
          <LoadingSpinner />
        ) : logs.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="No audit entries matching filter"
            description="System activity and state mutations will be automatically cataloged here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Actor</th>
                  <th className="px-4 py-3">Action Event</th>
                  <th className="px-4 py-3">Resource Target</th>
                  <th className="px-4 py-3">IP Address</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">State Diff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{log.actorName}</p>
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                        {log.actorRole}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs font-bold text-indigo-600">
                      {log.action}
                    </td>
                    <td className="px-4 py-3 text-xs font-medium text-slate-800">
                      {log.resource}
                      {log.resourceId && (
                        <span className="block text-[10px] text-slate-400 font-mono">
                          ID: {log.resourceId.substring(0, 10)}...
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{log.ipAddress || 'Internal'}</td>
                    <td className="px-4 py-3">
                      <Badge variant={log.status === 'SUCCESS' ? 'success' : 'danger'}>
                        {log.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {log.diff ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedLog(log)}
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" /> View Diff
                        </Button>
                      ) : (
                        <span className="text-xs text-slate-400">No Diff</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-4 text-xs text-slate-500">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* MODAL: STATE DIFF INSPECTOR */}
      {selectedLog && (
        <Modal
          isOpen={Boolean(selectedLog)}
          onClose={() => setSelectedLog(null)}
          title={`Audit Diff: ${selectedLog.action} on ${selectedLog.resource}`}
        >
          <div className="space-y-4 text-xs font-mono">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 font-sans space-y-1">
              <div>
                <strong>Actor:</strong> {selectedLog.actorName} ({selectedLog.actorRole})
              </div>
              <div>
                <strong>Timestamp:</strong> {new Date(selectedLog.createdAt).toLocaleString()}
              </div>
              <div>
                <strong>Client IP:</strong> {selectedLog.ipAddress}
              </div>
              <div>
                <strong>User Agent:</strong> {selectedLog.userAgent}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Before State */}
              <div>
                <span className="font-bold text-rose-600 block mb-1 font-sans">Before Mutation:</span>
                <pre className="p-3 bg-rose-50/50 border border-rose-200 rounded-xl overflow-x-auto text-[11px] text-rose-950 max-h-60">
                  {selectedLog.diff?.before
                    ? JSON.stringify(selectedLog.diff.before, null, 2)
                    : '(New entity created / No prior state)'}
                </pre>
              </div>

              {/* After State */}
              <div>
                <span className="font-bold text-emerald-600 block mb-1 font-sans">After Mutation:</span>
                <pre className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl overflow-x-auto text-[11px] text-emerald-950 max-h-60">
                  {selectedLog.diff?.after
                    ? JSON.stringify(selectedLog.diff.after, null, 2)
                    : '(Entity deleted)'}
                </pre>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <Button size="sm" variant="primary" onClick={() => setSelectedLog(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AuditLogsPage;
