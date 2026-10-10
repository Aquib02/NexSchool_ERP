import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Laptop,
  LifeBuoy,
  Search,
  Filter,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Send,
  UserCheck,
  ShieldCheck,
  HardDrive,
  Cpu,
  X,
} from 'lucide-react';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';
import Modal from '../../components/common/Modal.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import itService from '../../services/itService.js';
import staffService from '../../services/staffService.js';

export const ITPage = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'tickets');
  const [loading, setLoading] = useState(false);

  // Data states
  const [tickets, setTickets] = useState([]);
  const [assets, setAssets] = useState([]);
  const [employees, setEmployees] = useState([]);

  // Filters & Search
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Modals
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [commentText, setCommentText] = useState('');

  // Forms
  const [ticketForm, setTicketForm] = useState({
    title: '',
    description: '',
    category: 'Hardware',
    priority: 'Medium',
    assetId: '',
  });

  const [assetForm, setAssetForm] = useState({
    name: '',
    category: 'Laptop',
    serialNumber: '',
    specifications: '',
    purchasePrice: 0,
    warrantyExpiry: '',
    location: 'Computer Lab 1',
    assignedTo: '',
    status: 'In Stock',
  });

  const [resolutionForm, setResolutionForm] = useState({
    status: 'Resolved',
    resolutionNotes: '',
  });

  const [banner, setBanner] = useState({ type: '', text: '' });
  const showBanner = (type, text) => {
    setBanner({ type, text });
    setTimeout(() => setBanner({ type: '', text: '' }), 4000);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [tRes, aRes, eRes] = await Promise.all([
        itService.getTickets(),
        itService.getAssets(),
        staffService.getEmployees({ limit: 100 }),
      ]);
      if (tRes.data?.data) setTickets(tRes.data.data);
      if (aRes.data?.data) setAssets(aRes.data.data);
      if (eRes.data?.data?.employees) setEmployees(eRes.data.data.employees);
    } catch (err) {
      console.error(err);
      showBanner('error', 'Failed to load IT helpdesk data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await itService.createTicket({
        ...ticketForm,
        assetId: ticketForm.assetId || undefined,
      });
      showBanner('success', 'Support ticket raised successfully');
      setIsTicketModalOpen(false);
      setTicketForm({
        title: '',
        description: '',
        category: 'Hardware',
        priority: 'Medium',
        assetId: '',
      });
      loadData();
    } catch (err) {
      console.error(err);
      showBanner('error', err.response?.data?.message || 'Failed to raise ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAsset = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await itService.createAsset({
        ...assetForm,
        assignedTo: assetForm.assignedTo || undefined,
      });
      showBanner('success', 'IT Asset registered successfully');
      setIsAssetModalOpen(false);
      setAssetForm({
        name: '',
        category: 'Laptop',
        serialNumber: '',
        specifications: '',
        purchasePrice: 0,
        warrantyExpiry: '',
        location: 'Computer Lab 1',
        assignedTo: '',
        status: 'In Stock',
      });
      loadData();
    } catch (err) {
      console.error(err);
      showBanner('error', err.response?.data?.message || 'Failed to register asset');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !selectedTicket) return;
    try {
      const res = await itService.addComment(selectedTicket._id, { message: commentText });
      setSelectedTicket(res.data.data);
      setCommentText('');
      showBanner('success', 'Comment added');
      loadData();
    } catch (err) {
      console.error(err);
      showBanner('error', 'Failed to post comment');
    }
  };

  const handleResolveTicket = async (e) => {
    e.preventDefault();
    if (!selectedTicket) return;
    try {
      const res = await itService.updateTicketStatus(selectedTicket._id, resolutionForm);
      setSelectedTicket(res.data.data);
      showBanner('success', `Ticket marked as ${resolutionForm.status}`);
      loadData();
    } catch (err) {
      console.error(err);
      showBanner('error', 'Failed to update ticket status');
    }
  };

  // Metrics
  const openTicketsCount = tickets.filter((t) => t.status === 'Open').length;
  const urgentTicketsCount = tickets.filter(
    (t) => t.priority === 'Urgent' && !['Resolved', 'Closed'].includes(t.status)
  ).length;
  const assetsInUseCount = assets.filter((a) => a.status === 'In Use').length;

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
            <Laptop className="w-7 h-7 text-indigo-600" />
            IT Assets & Helpdesk
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track hardware devices, smart classrooms, warranties, and support ticket workflows.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setIsAssetModalOpen(true)}>
            <HardDrive className="w-4 h-4 mr-1.5" />
            Add IT Asset
          </Button>
          <Button variant="primary" onClick={() => setIsTicketModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" />
            New Ticket
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <LifeBuoy className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Total Tickets</p>
            <h3 className="text-2xl font-bold text-slate-900">{tickets.length}</h3>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Open / Pending</p>
            <h3 className="text-2xl font-bold text-slate-900">{openTicketsCount}</h3>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Urgent Tickets</p>
            <h3 className="text-2xl font-bold text-slate-900">{urgentTicketsCount}</h3>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Assets In Use</p>
            <h3 className="text-2xl font-bold text-slate-900">
              {assetsInUseCount} / {assets.length}
            </h3>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('tickets')}
          className={`px-4 py-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'tickets'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <LifeBuoy className="w-4 h-4" />
          Support Tickets ({tickets.length})
        </button>
        <button
          onClick={() => setActiveTab('assets')}
          className={`px-4 py-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'assets'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <HardDrive className="w-4 h-4" />
          Hardware & Asset Catalog ({assets.length})
        </button>
      </div>

      {/* TAB 1: SUPPORT TICKETS */}
      {activeTab === 'tickets' && (
        <Card className="p-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-5">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search ticket title or ID..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white"
              >
                <option value="All">All Priorities</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white"
              >
                <option value="All">All Statuses</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
          </div>

          {loading ? (
            <LoadingSpinner />
          ) : tickets.length === 0 ? (
            <EmptyState
              icon={LifeBuoy}
              title="No support tickets found"
              description="Click 'New Ticket' to log a technical difficulty or hardware malfunction."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Ticket #</th>
                    <th className="px-4 py-3">Issue Title</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Priority</th>
                    <th className="px-4 py-3">Raised By</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tickets
                    .filter((t) => priorityFilter === 'All' || t.priority === priorityFilter)
                    .filter((t) => statusFilter === 'All' || t.status === statusFilter)
                    .filter((t) => {
                      if (!search.trim()) return true;
                      const q = search.toLowerCase();
                      return (
                        t.ticketNumber?.toLowerCase().includes(q) ||
                        t.title?.toLowerCase().includes(q) ||
                        t.description?.toLowerCase().includes(q) ||
                        t.category?.toLowerCase().includes(q) ||
                        t.assetId?.assetTag?.toLowerCase().includes(q) ||
                        t.assignedTo?.firstName?.toLowerCase().includes(q) ||
                        t.assignedTo?.lastName?.toLowerCase().includes(q)
                      );
                    })
                    .map((t) => (
                      <tr key={t._id} className="hover:bg-slate-50/60">
                        <td className="px-4 py-3 font-mono text-xs font-semibold text-indigo-600">
                          {t.ticketNumber}
                        </td>
                        <td className="px-4 py-3 max-w-sm">
                          <p className="font-semibold text-slate-900">{t.title}</p>
                          <p className="text-xs text-slate-400 truncate">{t.description}</p>
                          {t.assetId && (
                            <span className="text-[11px] text-slate-500 font-mono">
                              Tag: {t.assetId.assetTag}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs">{t.category}</td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              t.priority === 'Urgent'
                                ? 'danger'
                                : t.priority === 'High'
                                ? 'warning'
                                : 'default'
                            }
                          >
                            {t.priority}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {t.raisedBy ? `${t.raisedBy.firstName || t.raisedBy.username}` : 'System'}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              t.status === 'Resolved' || t.status === 'Closed'
                                ? 'success'
                                : t.status === 'In Progress'
                                ? 'primary'
                                : 'warning'
                            }
                          >
                            {t.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedTicket(t)}
                          >
                            View & Resolve
                          </Button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* TAB 2: HARDWARE ASSET CATALOG */}
      {activeTab === 'assets' && (
        <Card className="p-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-5">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search asset name or tag..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white"
            >
              <option value="All">All Categories</option>
              {[
                'Desktop',
                'Laptop',
                'Printer',
                'Projector',
                'Interactive Whiteboard',
                'Server',
                'Router/Switch',
                'Audio/Visual',
              ].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Tag & Name</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Assigned To</th>
                  <th className="px-4 py-3">Warranty Expiry</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assets
                  .filter((a) => categoryFilter === 'All' || a.category === categoryFilter)
                  .filter((a) => {
                    if (!search.trim()) return true;
                    const q = search.toLowerCase();
                    return (
                      a.assetName?.toLowerCase().includes(q) ||
                      a.name?.toLowerCase().includes(q) ||
                      a.assetTag?.toLowerCase().includes(q) ||
                      a.serialNumber?.toLowerCase().includes(q) ||
                      a.location?.toLowerCase().includes(q) ||
                      a.category?.toLowerCase().includes(q)
                    );
                  })
                  .map((asset) => (
                    <tr key={asset._id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-bold text-indigo-600 block">
                          {asset.assetTag}
                        </span>
                        <span className="font-semibold text-slate-900">{asset.name}</span>
                        {asset.serialNumber && (
                          <span className="block text-[11px] text-slate-400 font-mono">
                            S/N: {asset.serialNumber}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">{asset.category}</td>
                      <td className="px-4 py-3 text-slate-700">{asset.location}</td>
                      <td className="px-4 py-3 text-xs">
                        {asset.assignedTo
                          ? `${asset.assignedTo.firstName} ${asset.assignedTo.lastName}`
                          : 'Unassigned (Pool)'}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {asset.warrantyExpiry
                          ? new Date(asset.warrantyExpiry).toLocaleDateString()
                          : 'N/A'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            asset.status === 'In Use'
                              ? 'success'
                              : asset.status === 'In Stock'
                              ? 'primary'
                              : asset.status === 'Under Repair'
                              ? 'warning'
                              : 'danger'
                          }
                        >
                          {asset.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* MODAL: RAISE TICKET */}
      <Modal
        isOpen={isTicketModalOpen}
        onClose={() => setIsTicketModalOpen(false)}
        title="Raise Technical Support Ticket"
      >
        <form onSubmit={handleCreateTicket} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Issue Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Projector bulb blinking in Room 204"
              value={ticketForm.title}
              onChange={(e) => setTicketForm({ ...ticketForm, title: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Category</label>
              <select
                value={ticketForm.category}
                onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
              >
                {['Hardware', 'Software', 'Network', 'Account/Access', 'Smart Classroom', 'Printer', 'Other'].map(
                  (c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  )
                )}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Priority</label>
              <select
                value={ticketForm.priority}
                onChange={(e) => setTicketForm({ ...ticketForm, priority: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Related Device / Asset</label>
            <select
              value={ticketForm.assetId}
              onChange={(e) => setTicketForm({ ...ticketForm, assetId: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
            >
              <option value="">None / General Inquiry</option>
              {assets.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.name} ({a.assetTag}) - {a.location}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Problem Description *</label>
            <textarea
              required
              rows={3}
              placeholder="Provide exact details of error messages or failure symptoms"
              value={ticketForm.description}
              onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsTicketModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={loading}>
              Submit Ticket
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: REGISTER IT ASSET */}
      <Modal
        isOpen={isAssetModalOpen}
        onClose={() => setIsAssetModalOpen(false)}
        title="Register Hardware Device or Asset"
      >
        <form onSubmit={handleCreateAsset} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Asset Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Dell OptiPlex 7090 or Epson EB-X49"
              value={assetForm.name}
              onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Category *</label>
              <select
                value={assetForm.category}
                onChange={(e) => setAssetForm({ ...assetForm, category: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
              >
                {[
                  'Desktop',
                  'Laptop',
                  'Printer',
                  'Projector',
                  'Interactive Whiteboard',
                  'Server',
                  'Router/Switch',
                  'Audio/Visual',
                  'Other',
                ].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Serial Number</label>
              <input
                type="text"
                placeholder="Hardware S/N"
                value={assetForm.serialNumber}
                onChange={(e) => setAssetForm({ ...assetForm, serialNumber: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Campus Location *</label>
              <input
                type="text"
                required
                placeholder="e.g. Computer Lab 2, Library Counter"
                value={assetForm.location}
                onChange={(e) => setAssetForm({ ...assetForm, location: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Warranty Expiry</label>
              <input
                type="date"
                value={assetForm.warrantyExpiry}
                onChange={(e) => setAssetForm({ ...assetForm, warrantyExpiry: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Assign to Staff Member</label>
            <select
              value={assetForm.assignedTo}
              onChange={(e) => setAssetForm({ ...assetForm, assignedTo: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
            >
              <option value="">Unassigned (Pooled Device)</option>
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.firstName} {emp.lastName} ({emp.employeeId})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsAssetModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={loading}>
              Register Asset
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: TICKET RESOLUTION & COMMENTS */}
      {selectedTicket && (
        <Modal
          isOpen={Boolean(selectedTicket)}
          onClose={() => setSelectedTicket(null)}
          title={`Ticket ${selectedTicket.ticketNumber}: ${selectedTicket.title}`}
        >
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Priority: {selectedTicket.priority}</span>
                <span>Category: {selectedTicket.category}</span>
              </div>
              <p className="text-sm text-slate-800 font-medium">{selectedTicket.description}</p>
            </div>

            {/* Status change form */}
            <form onSubmit={handleResolveTicket} className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-900 uppercase">Update Ticket State</span>
                <select
                  value={resolutionForm.status}
                  onChange={(e) => setResolutionForm({ ...resolutionForm, status: e.target.value })}
                  className="px-2 py-1 text-xs border border-indigo-200 rounded-lg bg-white"
                >
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
              <input
                type="text"
                placeholder="Resolution notes / action taken"
                value={resolutionForm.resolutionNotes}
                onChange={(e) => setResolutionForm({ ...resolutionForm, resolutionNotes: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-indigo-200 rounded-lg bg-white"
              />
              <div className="flex justify-end">
                <Button size="sm" variant="primary" type="submit">
                  Save Status
                </Button>
              </div>
            </form>

            {/* Comments trail */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase text-slate-500 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" /> Comments Thread ({selectedTicket.comments?.length || 0})
              </h4>
              <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                {selectedTicket.comments?.map((c, idx) => (
                  <div key={idx} className="p-2.5 bg-slate-100 rounded-xl text-xs">
                    <div className="flex justify-between font-semibold text-slate-800 text-[11px] mb-0.5">
                      <span>{c.senderId?.username || 'Staff'}</span>
                      <span className="text-slate-400 font-normal">
                        {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-700">{c.message}</p>
                  </div>
                ))}
              </div>

              {/* Add comment */}
              <form onSubmit={handleAddComment} className="flex gap-2 pt-2">
                <input
                  type="text"
                  placeholder="Type a response or update note..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-xl"
                />
                <Button size="sm" variant="secondary" type="submit">
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </form>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ITPage;
