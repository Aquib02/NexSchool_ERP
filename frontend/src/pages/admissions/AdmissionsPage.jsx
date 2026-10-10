import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  UserPlus,
  FileCheck,
  Search,
  Filter,
  Plus,
  Calendar,
  Phone,
  Mail,
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  AlertCircle,
  X,
} from 'lucide-react';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';
import Modal from '../../components/common/Modal.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import admissionsService from '../../services/admissionsService.js';
import adminService from '../../services/adminService.js';

export const AdmissionsPage = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'applications');
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState([]);

  // Data states
  const [applications, setApplications] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [search, setSearch] = useState(searchParams.get('search') || '');

  useEffect(() => {
    const q = searchParams.get('search');
    if (q !== null && q !== search) {
      setSearch(q);
    }
  }, [searchParams]);
  const [statusFilter, setStatusFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');

  // Modals
  const [isEnquiryModalOpen, setIsEnquiryModalOpen] = useState(false);
  const [enquiryForm, setEnquiryForm] = useState({
    candidateName: '',
    parentName: '',
    phone: '',
    email: '',
    targetClassId: '',
    source: 'Walk-in',
    notes: '',
  });

  const [isMarksModalOpen, setIsMarksModalOpen] = useState(false);
  const [selectedAppForMarks, setSelectedAppForMarks] = useState(null);
  const [marksForm, setMarksForm] = useState({
    marksObtained: '',
    totalMarks: 100,
    remarks: '',
  });

  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [selectedAppForConvert, setSelectedAppForConvert] = useState(null);
  const [convertForm, setConvertForm] = useState({
    rollNumber: '',
  });

  const [banner, setBanner] = useState({ type: '', text: '' });
  const showBanner = (type, text) => {
    setBanner({ type, text });
    setTimeout(() => setBanner({ type: '', text: '' }), 4000);
  };

  const loadClasses = async () => {
    try {
      const res = await adminService.getClasses();
      if (res.data?.data) setClasses(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadApplications = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (classFilter) params.targetClassId = classFilter;

      const res = await admissionsService.getApplications(params);
      if (res.data?.data) setApplications(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadEnquiries = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (classFilter) params.targetClassId = classFilter;

      const res = await admissionsService.getEnquiries(params);
      if (res.data?.data) setEnquiries(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === 'applications') loadApplications();
      if (activeTab === 'enquiries') loadEnquiries();
    }, 250);
    return () => clearTimeout(timer);
  }, [activeTab, statusFilter, classFilter, search]);

  const handleCreateEnquiry = async (e) => {
    e.preventDefault();
    try {
      await admissionsService.createEnquiry(enquiryForm);
      showBanner('success', 'Admission enquiry recorded successfully.');
      setIsEnquiryModalOpen(false);
      setEnquiryForm({
        candidateName: '',
        parentName: '',
        phone: '',
        email: '',
        targetClassId: '',
        source: 'Walk-in',
        notes: '',
      });
      loadEnquiries();
    } catch (err) {
      showBanner('error', err.response?.data?.message || 'Failed to record enquiry.');
    }
  };

  const handleSaveMarks = async (e) => {
    e.preventDefault();
    try {
      await admissionsService.recordEntranceMarks(selectedAppForMarks._id, marksForm);
      showBanner('success', 'Entrance test marks saved successfully.');
      setIsMarksModalOpen(false);
      loadApplications();
    } catch (err) {
      showBanner('error', err.response?.data?.message || 'Failed to save marks.');
    }
  };

  const handleConvertStudent = async (e) => {
    e.preventDefault();
    try {
      const res = await admissionsService.convertToStudent(selectedAppForConvert._id, convertForm);
      showBanner(
        'success',
        `Successfully converted to Central Student (${res.data?.data?.student?.studentId}) and linked Parent profile!`
      );
      setIsConvertModalOpen(false);
      loadApplications();
    } catch (err) {
      showBanner('error', err.response?.data?.message || 'Conversion to student failed.');
    }
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'Converted to Student':
      case 'Approved':
      case 'Selected':
        return 'success';
      case 'Test Scheduled':
      case 'Under Review':
      case 'Contacted':
        return 'warning';
      case 'Rejected':
      case 'Closed - Not Interested':
        return 'danger';
      default:
        return 'secondary';
    }
  };

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

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Admissions & Enrollment Pipeline
            </h1>
            <Badge variant="primary">Phase 8</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Track inquiries, entrance evaluations, and seamlessly convert applicants to Central Student profiles.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            onClick={() => setIsEnquiryModalOpen(true)}
            icon={<Phone className="w-4 h-4" />}
          >
            + New Inquiry
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab('applications')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'applications'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>Admission Applications</span>
        </button>
        <button
          onClick={() => setActiveTab('enquiries')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'enquiries'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Phone className="w-4 h-4" />
          <span>Prospective Inquiries</span>
        </button>
      </div>

      {/* Filter Bar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) =>
                e.key === 'Enter' && (activeTab === 'applications' ? loadApplications() : loadEnquiries())
              }
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

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white"
            >
              <option value="">All Classes</option>
              {classes.map((cls) => (
                <option key={cls._id} value={cls._id}>
                  {cls.name}
                </option>
              ))}
            </select>

            <Button
              variant="secondary"
              onClick={activeTab === 'applications' ? loadApplications : loadEnquiries}
              icon={<Filter className="w-3.5 h-3.5" />}
            >
              Filter
            </Button>
          </div>
        </div>
      </Card>

      {/* Loading */}
      {loading && (
        <div className="py-12 flex justify-center">
          <LoadingSpinner size="lg" message="Loading admission records..." />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. APPLICATIONS TAB */}
      {/* ========================================================================= */}
      {!loading && activeTab === 'applications' && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Application #</th>
                  <th className="py-3.5 px-4">Candidate</th>
                  <th className="py-3.5 px-4">Target Class</th>
                  <th className="py-3.5 px-4">Parent Details</th>
                  <th className="py-3.5 px-4 text-center">Entrance Score</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applications.length > 0 ? (
                  applications.map((app) => (
                    <tr key={app._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                        {app.applicationNumber}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">
                          {app.candidate.firstName} {app.candidate.lastName}
                        </div>
                        <div className="text-xs text-slate-400">
                          {app.candidate.gender} • DOB: {new Date(app.candidate.dateOfBirth).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700">
                        {app.targetClassId?.name || 'Class'}
                      </td>
                      <td className="py-3 px-4 text-xs">
                        <div className="font-semibold text-slate-800">
                          {app.parentDetails.fatherName || app.parentDetails.motherName || 'Guardian'}
                        </div>
                        <div className="text-slate-500">{app.parentDetails.primaryPhone}</div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {app.entranceTest?.marksObtained !== undefined ? (
                          <span className="font-bold text-slate-900">
                            {app.entranceTest.marksObtained}/{app.entranceTest.totalMarks || 100}
                            <span
                              className={`ml-1 text-xs ${
                                app.entranceTest.isPassed ? 'text-emerald-600' : 'text-rose-500'
                              }`}
                            >
                              ({app.entranceTest.isPassed ? 'Pass' : 'Fail'})
                            </span>
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">Not Evaluated</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant={getStatusBadgeVariant(app.status)}>{app.status}</Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {app.status !== 'Converted to Student' && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                setSelectedAppForMarks(app);
                                setMarksForm({
                                  marksObtained: app.entranceTest?.marksObtained || '',
                                  totalMarks: app.entranceTest?.totalMarks || 100,
                                  remarks: app.entranceTest?.remarks || '',
                                });
                                setIsMarksModalOpen(true);
                              }}
                              icon={<Award className="w-3.5 h-3.5" />}
                            >
                              Marks
                            </Button>
                          )}

                          {app.status !== 'Converted to Student' ? (
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => {
                                setSelectedAppForConvert(app);
                                setIsConvertModalOpen(true);
                              }}
                              icon={<UserCheck className="w-3.5 h-3.5" />}
                            >
                              Convert to Student
                            </Button>
                          ) : (
                            <span className="text-xs text-emerald-700 font-semibold px-2 py-1 bg-emerald-50 rounded-lg">
                              Enrolled
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-400">
                      No admission applications found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* 2. ENQUIRIES TAB */}
      {/* ========================================================================= */}
      {!loading && activeTab === 'enquiries' && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Enquiry #</th>
                  <th className="py-3.5 px-4">Candidate & Parent</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Target Class</th>
                  <th className="py-3.5 px-4">Source</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center">Follow-up</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {enquiries.length > 0 ? (
                  enquiries.map((enq) => (
                    <tr key={enq._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                        {enq.enquiryNumber}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{enq.candidateName}</div>
                        <div className="text-xs text-slate-500">Parent: {enq.parentName}</div>
                      </td>
                      <td className="py-3 px-4 text-xs">
                        <div className="font-medium text-slate-800">{enq.phone}</div>
                        {enq.email && <div className="text-slate-400">{enq.email}</div>}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700">
                        {enq.targetClassId?.name || 'Class'}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="secondary">{enq.source}</Badge>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant={getStatusBadgeVariant(enq.status)}>{enq.status}</Badge>
                      </td>
                      <td className="py-3 px-4 text-center text-xs text-slate-500">
                        {enq.followUpDate ? new Date(enq.followUpDate).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-400">
                      No prospective inquiries recorded. Click "+ New Inquiry" to log one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* MODAL: NEW INQUIRY */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isEnquiryModalOpen}
        onClose={() => setIsEnquiryModalOpen(false)}
        title="Record Prospective Admission Inquiry"
      >
        <form onSubmit={handleCreateEnquiry} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Candidate Name *
              </label>
              <input
                type="text"
                required
                value={enquiryForm.candidateName}
                onChange={(e) => setEnquiryForm({ ...enquiryForm, candidateName: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Parent / Guardian *
              </label>
              <input
                type="text"
                required
                value={enquiryForm.parentName}
                onChange={(e) => setEnquiryForm({ ...enquiryForm, parentName: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Phone *</label>
              <input
                type="tel"
                required
                value={enquiryForm.phone}
                onChange={(e) => setEnquiryForm({ ...enquiryForm, phone: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
              <input
                type="email"
                value={enquiryForm.email}
                onChange={(e) => setEnquiryForm({ ...enquiryForm, email: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Target Grade / Class *
              </label>
              <select
                required
                value={enquiryForm.targetClassId}
                onChange={(e) => setEnquiryForm({ ...enquiryForm, targetClassId: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white"
              >
                <option value="">Select Class</option>
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Source</label>
              <select
                value={enquiryForm.source}
                onChange={(e) => setEnquiryForm({ ...enquiryForm, source: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white"
              >
                <option value="Walk-in">Walk-in</option>
                <option value="Online">Online Form</option>
                <option value="Referral">Referral</option>
                <option value="Phone Call">Phone Call</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Counselor Notes</label>
            <textarea
              rows="2"
              value={enquiryForm.notes}
              onChange={(e) => setEnquiryForm({ ...enquiryForm, notes: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200"
              placeholder="e.g. Interested in science curriculum and school bus transport."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setIsEnquiryModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save Inquiry
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: ENTRANCE TEST MARKS */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isMarksModalOpen}
        onClose={() => setIsMarksModalOpen(false)}
        title="Record Entrance Test Evaluation"
      >
        {selectedAppForMarks && (
          <form onSubmit={handleSaveMarks} className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-xl text-xs flex justify-between">
              <div>
                <span className="text-slate-400 block">Candidate</span>
                <span className="font-bold text-slate-800">
                  {selectedAppForMarks.candidate.firstName} {selectedAppForMarks.candidate.lastName}
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block">Application #</span>
                <span className="font-mono font-bold text-indigo-600">
                  {selectedAppForMarks.applicationNumber}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Marks Obtained *
                </label>
                <input
                  type="number"
                  min="0"
                  max={marksForm.totalMarks}
                  required
                  value={marksForm.marksObtained}
                  onChange={(e) => setMarksForm({ ...marksForm, marksObtained: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Total Marks
                </label>
                <input
                  type="number"
                  disabled
                  value={marksForm.totalMarks}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50 font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Evaluation Remarks
              </label>
              <input
                type="text"
                placeholder="e.g. Excellent proficiency in mathematics and reading."
                value={marksForm.remarks}
                onChange={(e) => setMarksForm({ ...marksForm, remarks: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setIsMarksModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                Save & Update Status
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: CONVERT TO STUDENT */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isConvertModalOpen}
        onClose={() => setIsConvertModalOpen(false)}
        title="One-Click Convert Application to Central Student"
      >
        {selectedAppForConvert && (
          <form onSubmit={handleConvertStudent} className="space-y-4">
            <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 text-xs text-indigo-900 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-indigo-800">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <span>Central Student Profile Architecture</span>
              </div>
              <p>
                Confirming enrollment will atomically create the central student profile (`STU-YYYY-XXXX`) and automatically link or generate the parent entity (`PAR-YYYY-XXXX`).
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-xs grid grid-cols-2 gap-2">
              <div>
                <span className="text-slate-400 block">Candidate Name:</span>
                <span className="font-bold text-slate-800">
                  {selectedAppForConvert.candidate.firstName} {selectedAppForConvert.candidate.lastName}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Target Grade:</span>
                <span className="font-bold text-slate-800">
                  {selectedAppForConvert.targetClassId?.name || 'Class'}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Assign Section Roll Number (Optional)
              </label>
              <input
                type="number"
                min="1"
                placeholder="Auto-assigned if empty"
                value={convertForm.rollNumber}
                onChange={(e) => setConvertForm({ ...convertForm, rollNumber: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setIsConvertModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" icon={<UserPlus className="w-4 h-4" />}>
                Enroll as Central Student
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default AdmissionsPage;
