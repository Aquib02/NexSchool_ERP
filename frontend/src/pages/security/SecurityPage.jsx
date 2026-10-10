import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ShieldCheck,
  UserCheck,
  LogOut,
  AlertTriangle,
  Search,
  Filter,
  Plus,
  Clock,
  Car,
  FileBadge,
  Phone,
  CheckCircle2,
  ShieldAlert,
  X,
} from 'lucide-react';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';
import Modal from '../../components/common/Modal.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import securityService from '../../services/securityService.js';
import studentService from '../../services/studentService.js';
import staffService from '../../services/staffService.js';

export const SecurityPage = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'visitors');
  const [loading, setLoading] = useState(false);

  // Data states
  const [visitors, setVisitors] = useState([]);
  const [gatePasses, setGatePasses] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [students, setStudents] = useState([]);
  const [employees, setEmployees] = useState([]);

  // Modals
  const [isVisitorModalOpen, setIsVisitorModalOpen] = useState(false);
  const [isGatePassModalOpen, setIsGatePassModalOpen] = useState(false);
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);

  // Filters & Search
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [visitorStatusFilter, setVisitorStatusFilter] = useState('All');
  const [incidentSeverityFilter, setIncidentSeverityFilter] = useState('All');

  // Forms
  const [visitorForm, setVisitorForm] = useState({
    visitorName: '',
    phone: '',
    idProofType: 'National ID / Aadhaar',
    idProofNumber: '',
    purpose: '',
    visitingType: 'General Administration',
    vehicleNumber: '',
    gateNumber: 'Gate 1',
  });

  const [gatePassForm, setGatePassForm] = useState({
    passType: 'Student Early Exit',
    studentId: '',
    reason: '',
    accompaniedByName: '',
    accompaniedByPhone: '',
    accompaniedByIdVerified: true,
    gateNumber: 'Main Gate',
  });

  const [incidentForm, setIncidentForm] = useState({
    title: '',
    incidentType: 'Other',
    severity: 'Medium',
    location: '',
    description: '',
    partiesInvolved: '',
    actionTaken: '',
  });

  const [banner, setBanner] = useState({ type: '', text: '' });
  const showBanner = (type, text) => {
    setBanner({ type, text });
    setTimeout(() => setBanner({ type: '', text: '' }), 4000);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [vRes, gRes, iRes, sRes, eRes] = await Promise.all([
        securityService.getVisitors(),
        securityService.getGatePasses(),
        securityService.getIncidents(),
        studentService.getStudents({ limit: 100 }),
        staffService.getEmployees({ limit: 100 }),
      ]);
      if (vRes.data?.data) setVisitors(vRes.data.data);
      if (gRes.data?.data) setGatePasses(gRes.data.data);
      if (iRes.data?.data) setIncidents(iRes.data.data);
      if (sRes.data?.data?.students) setStudents(sRes.data.data.students);
      if (eRes.data?.data?.employees) setEmployees(eRes.data.data.employees);
    } catch (err) {
      console.error(err);
      showBanner('error', 'Failed to load security data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateVisitor = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await securityService.createVisitor(visitorForm);
      showBanner('success', 'Visitor pass generated successfully');
      setIsVisitorModalOpen(false);
      setVisitorForm({
        visitorName: '',
        phone: '',
        idProofType: 'National ID / Aadhaar',
        idProofNumber: '',
        purpose: '',
        visitingType: 'General Administration',
        vehicleNumber: '',
        gateNumber: 'Gate 1',
      });
      loadData();
    } catch (err) {
      console.error(err);
      showBanner('error', err.response?.data?.message || 'Error issuing visitor pass');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckoutVisitor = async (id) => {
    try {
      await securityService.checkoutVisitor(id);
      showBanner('success', 'Visitor marked as checked out');
      loadData();
    } catch (err) {
      console.error(err);
      showBanner('error', 'Failed to check out visitor');
    }
  };

  const handleCreateGatePass = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await securityService.createGatePass(gatePassForm);
      showBanner('success', 'Student early gate pass authorized');
      setIsGatePassModalOpen(false);
      setGatePassForm({
        passType: 'Student Early Exit',
        studentId: '',
        reason: '',
        accompaniedByName: '',
        accompaniedByPhone: '',
        accompaniedByIdVerified: true,
        gateNumber: 'Main Gate',
      });
      loadData();
    } catch (err) {
      console.error(err);
      showBanner('error', err.response?.data?.message || 'Error generating gate pass');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateIncident = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await securityService.createIncident(incidentForm);
      showBanner('success', 'Security incident logged');
      setIsIncidentModalOpen(false);
      setIncidentForm({
        title: '',
        incidentType: 'Other',
        severity: 'Medium',
        location: '',
        description: '',
        partiesInvolved: '',
        actionTaken: '',
      });
      loadData();
    } catch (err) {
      console.error(err);
      showBanner('error', err.response?.data?.message || 'Error logging incident');
    } finally {
      setLoading(false);
    }
  };

  // Metrics
  const insideCampusCount = visitors.filter((v) => v.status === 'Inside Campus').length;
  const earlyExitCount = gatePasses.filter(
    (g) => g.status === 'Authorized' || g.status === 'Departed'
  ).length;
  const criticalIncidentsCount = incidents.filter(
    (i) => i.severity === 'Critical' || i.severity === 'High'
  ).length;

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
            Security & Gate Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Visitor passes, student early exits, verified parent escorts, and security incident tracking.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setIsGatePassModalOpen(true)}>
            <FileBadge className="w-4 h-4 mr-1.5" />
            Student Gate Pass
          </Button>
          <Button variant="primary" onClick={() => setIsVisitorModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" />
            Issue Visitor Pass
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Inside Campus</p>
            <h3 className="text-2xl font-bold text-slate-900">{insideCampusCount}</h3>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <LogOut className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Early Departures</p>
            <h3 className="text-2xl font-bold text-slate-900">{earlyExitCount}</h3>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">High/Critical Alerts</p>
            <h3 className="text-2xl font-bold text-slate-900">{criticalIncidentsCount}</h3>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <FileBadge className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Total Passes Issued</p>
            <h3 className="text-2xl font-bold text-slate-900">{visitors.length + gatePasses.length}</h3>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('visitors')}
          className={`px-4 py-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'visitors'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          Live Visitors ({visitors.length})
        </button>
        <button
          onClick={() => setActiveTab('gatepasses')}
          className={`px-4 py-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'gatepasses'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <LogOut className="w-4 h-4" />
          Student Gate Passes ({gatePasses.length})
        </button>
        <button
          onClick={() => setActiveTab('incidents')}
          className={`px-4 py-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'incidents'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          Safety Incidents ({incidents.length})
        </button>
      </div>

      {/* TAB 1: CAMPUS VISITORS */}
      {activeTab === 'visitors' && (
        <Card className="p-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-5">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search visitor name or phone..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <select
              value={visitorStatusFilter}
              onChange={(e) => setVisitorStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white"
            >
              <option value="All">All Statuses</option>
              <option value="Inside Campus">Inside Campus</option>
              <option value="Exited">Exited</option>
            </select>
          </div>

          {loading ? (
            <LoadingSpinner />
          ) : visitors.length === 0 ? (
            <EmptyState
              icon={UserCheck}
              title="No visitors recorded"
              description="Click 'Issue Visitor Pass' to log gate entry."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Pass #</th>
                    <th className="px-4 py-3">Visitor Info</th>
                    <th className="px-4 py-3">Purpose & Target</th>
                    <th className="px-4 py-3">Vehicle & Gate</th>
                    <th className="px-4 py-3">Entry / Exit Time</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visitors
                    .filter((v) => visitorStatusFilter === 'All' || v.status === visitorStatusFilter)
                    .filter((v) => {
                      if (!search.trim()) return true;
                      const q = search.toLowerCase();
                      return (
                        v.passNumber?.toLowerCase().includes(q) ||
                        v.visitorName?.toLowerCase().includes(q) ||
                        v.phone?.toLowerCase().includes(q) ||
                        v.purpose?.toLowerCase().includes(q) ||
                        v.vehicleNumber?.toLowerCase().includes(q) ||
                        v.hostEmployeeId?.firstName?.toLowerCase().includes(q) ||
                        v.hostEmployeeId?.lastName?.toLowerCase().includes(q)
                      );
                    })
                    .map((v) => (
                      <tr key={v._id} className="hover:bg-slate-50/60">
                        <td className="px-4 py-3 font-mono text-xs font-bold text-indigo-600">
                          {v.passNumber}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-900">{v.visitorName}</p>
                          <p className="text-xs text-slate-400 flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {v.phone}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-800">{v.purpose}</p>
                          <span className="text-[11px] text-slate-400">{v.visitingType}</span>
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {v.vehicleNumber ? (
                            <span className="flex items-center gap-1 font-mono font-medium text-slate-700">
                              <Car className="w-3.5 h-3.5" /> {v.vehicleNumber}
                            </span>
                          ) : (
                            <span className="text-slate-400">Pedestrian</span>
                          )}
                          <span className="block text-[11px] text-slate-400">{v.gateNumber}</span>
                        </td>
                        <td className="px-4 py-3 text-xs">
                          <div>
                            In: {new Date(v.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          {v.exitTime && (
                            <div className="text-slate-400">
                              Out: {new Date(v.exitTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={v.status === 'Inside Campus' ? 'warning' : 'success'}>
                            {v.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {v.status === 'Inside Campus' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCheckoutVisitor(v._id)}
                            >
                              Check Out
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* TAB 2: STUDENT GATE PASSES */}
      {activeTab === 'gatepasses' && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-slate-900">Student Early Exit Authorizations</h3>
            <Button variant="primary" size="sm" onClick={() => setIsGatePassModalOpen(true)}>
              <Plus className="w-4 h-4 mr-1" /> New Gate Pass
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Pass #</th>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3">Accompanied By (Escort)</th>
                  <th className="px-4 py-3">Departure Time</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {gatePasses.map((gp) => (
                  <tr key={gp._id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-mono text-xs font-bold text-indigo-600">
                      {gp.passNumber}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">
                        {gp.studentId ? `${gp.studentId.firstName} ${gp.studentId.lastName}` : 'Staff Member'}
                      </p>
                      <span className="text-xs text-slate-400">{gp.studentId?.admissionNumber}</span>
                    </td>
                    <td className="px-4 py-3 text-xs max-w-xs">{gp.reason}</td>
                    <td className="px-4 py-3 text-xs">
                      <p className="font-medium text-slate-800">{gp.accompaniedByName || 'Self departure'}</p>
                      {gp.accompaniedByPhone && (
                        <p className="text-slate-400">{gp.accompaniedByPhone}</p>
                      )}
                      {gp.accompaniedByIdVerified && (
                        <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> ID Verified
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {new Date(gp.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      <span className="block text-slate-400">{gp.gateNumber}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={gp.status === 'Authorized' ? 'warning' : 'success'}>
                        {gp.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 3: SECURITY INCIDENTS */}
      {activeTab === 'incidents' && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-slate-900">Incident & Safety Event Log</h3>
            <Button variant="danger" size="sm" onClick={() => setIsIncidentModalOpen(true)}>
              <ShieldAlert className="w-4 h-4 mr-1" /> Report Incident
            </Button>
          </div>

          <div className="space-y-3">
            {incidents.map((inc) => (
              <div
                key={inc._id}
                className="p-4 rounded-2xl border border-slate-200/80 bg-white hover:border-slate-300 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold text-indigo-600">
                      {inc.incidentNumber}
                    </span>
                    <h4 className="font-bold text-slate-900 text-base">{inc.title}</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        inc.severity === 'Critical'
                          ? 'danger'
                          : inc.severity === 'High'
                          ? 'warning'
                          : 'default'
                      }
                    >
                      {inc.severity} Severity
                    </Badge>
                    <Badge variant={inc.status === 'Resolved' ? 'success' : 'primary'}>
                      {inc.status}
                    </Badge>
                  </div>
                </div>

                <p className="text-sm text-slate-600 mt-2">{inc.description}</p>

                <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500 border-t border-slate-100 pt-2.5">
                  <span>Location: {inc.location}</span>
                  <span>Type: {inc.incidentType}</span>
                  {inc.actionTaken && (
                    <span className="text-slate-800 font-medium">Action Taken: {inc.actionTaken}</span>
                  )}
                  <span>Date: {new Date(inc.incidentDate).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* MODAL: ISSUE VISITOR PASS */}
      <Modal
        isOpen={isVisitorModalOpen}
        onClose={() => setIsVisitorModalOpen(false)}
        title="Issue Campus Visitor Pass"
      >
        <form onSubmit={handleCreateVisitor} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Visitor Name *</label>
              <input
                type="text"
                required
                value={visitorForm.visitorName}
                onChange={(e) => setVisitorForm({ ...visitorForm, visitorName: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Phone Number *</label>
              <input
                type="text"
                required
                value={visitorForm.phone}
                onChange={(e) => setVisitorForm({ ...visitorForm, phone: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">ID Proof Type</label>
              <select
                value={visitorForm.idProofType}
                onChange={(e) => setVisitorForm({ ...visitorForm, idProofType: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
              >
                {['National ID / Aadhaar', 'Driver License', 'Passport', 'Voter ID', 'Employee Badge', 'Other'].map(
                  (t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  )
                )}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">ID Number</label>
              <input
                type="text"
                placeholder="ID credential number"
                value={visitorForm.idProofNumber}
                onChange={(e) => setVisitorForm({ ...visitorForm, idProofNumber: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Purpose of Visit *</label>
            <input
              type="text"
              required
              placeholder="e.g. Parent-Teacher Meeting, Maintenance, Admission Enquiry"
              value={visitorForm.purpose}
              onChange={(e) => setVisitorForm({ ...visitorForm, purpose: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Vehicle Number</label>
              <input
                type="text"
                placeholder="License plate or blank"
                value={visitorForm.vehicleNumber}
                onChange={(e) => setVisitorForm({ ...visitorForm, vehicleNumber: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Entry Gate</label>
              <input
                type="text"
                value={visitorForm.gateNumber}
                onChange={(e) => setVisitorForm({ ...visitorForm, gateNumber: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsVisitorModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={loading}>
              Issue Gate Pass
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: STUDENT GATE PASS */}
      <Modal
        isOpen={isGatePassModalOpen}
        onClose={() => setIsGatePassModalOpen(false)}
        title="Student Early Departure Gate Pass"
      >
        <form onSubmit={handleCreateGatePass} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Select Student *</label>
            <select
              required
              value={gatePassForm.studentId}
              onChange={(e) => setGatePassForm({ ...gatePassForm, studentId: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
            >
              <option value="">Select Student</option>
              {students.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.firstName} {s.lastName} ({s.admissionNumber})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Reason for Departure *</label>
            <input
              type="text"
              required
              placeholder="e.g. Medical appointment, Family emergency"
              value={gatePassForm.reason}
              onChange={(e) => setGatePassForm({ ...gatePassForm, reason: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Accompanied By (Escort Name)
              </label>
              <input
                type="text"
                placeholder="Parent or Guardian Name"
                value={gatePassForm.accompaniedByName}
                onChange={(e) => setGatePassForm({ ...gatePassForm, accompaniedByName: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Escort Phone</label>
              <input
                type="text"
                value={gatePassForm.accompaniedByPhone}
                onChange={(e) => setGatePassForm({ ...gatePassForm, accompaniedByPhone: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={gatePassForm.accompaniedByIdVerified}
              onChange={(e) => setGatePassForm({ ...gatePassForm, accompaniedByIdVerified: e.target.checked })}
            />
            Guardian Identity Verified with Central Student Profile
          </label>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsGatePassModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={loading}>
              Authorize Departure
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: REPORT INCIDENT */}
      <Modal
        isOpen={isIncidentModalOpen}
        onClose={() => setIsIncidentModalOpen(false)}
        title="Report Campus Safety Incident"
      >
        <form onSubmit={handleCreateIncident} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Incident Title *</label>
            <input
              type="text"
              required
              placeholder="Brief summary of event"
              value={incidentForm.title}
              onChange={(e) => setIncidentForm({ ...incidentForm, title: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Incident Type</label>
              <select
                value={incidentForm.incidentType}
                onChange={(e) => setIncidentForm({ ...incidentForm, incidentType: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
              >
                {[
                  'Trespassing / Unauthorized Entry',
                  'Theft / Property Loss',
                  'Vandalism',
                  'Student Disciplinary / Altercation',
                  'Medical Emergency',
                  'Fire / Safety Hazard',
                  'Vehicle Incident',
                  'Other',
                ].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Severity</label>
              <select
                value={incidentForm.severity}
                onChange={(e) => setIncidentForm({ ...incidentForm, severity: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Campus Location *</label>
            <input
              type="text"
              required
              placeholder="e.g. Sports Ground West Perimeter, Lab Block B"
              value={incidentForm.location}
              onChange={(e) => setIncidentForm({ ...incidentForm, location: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Detailed Description *</label>
            <textarea
              required
              rows={3}
              value={incidentForm.description}
              onChange={(e) => setIncidentForm({ ...incidentForm, description: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Action Taken</label>
            <input
              type="text"
              placeholder="Immediate response / guard intervention"
              value={incidentForm.actionTaken}
              onChange={(e) => setIncidentForm({ ...incidentForm, actionTaken: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsIncidentModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" disabled={loading}>
              Submit Incident Report
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SecurityPage;
