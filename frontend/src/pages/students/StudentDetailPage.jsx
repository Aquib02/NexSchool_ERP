import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  User,
  GraduationCap,
  Calendar,
  Phone,
  Mail,
  MapPin,
  HeartPulse,
  CreditCard,
  BookOpen,
  Bus,
  FileText,
  ShieldAlert,
  Edit,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';
import Modal from '../../components/common/Modal.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import studentService from '../../services/studentService.js';

export const StudentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Status Change Modal
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('Active');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const fetchStudentData = async () => {
    setLoading(true);
    try {
      const res = await studentService.getStudentById(id);
      if (res.success && res.data) {
        setStudent(res.data.student);
        setDocuments(res.data.documents || []);
        setNewStatus(res.data.student.status);
      }
    } catch (err) {
      console.error('Failed to load student', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentData();
  }, [id]);

  const handleStatusChange = async () => {
    setIsUpdatingStatus(true);
    try {
      await studentService.updateStatus(id, newStatus);
      setIsStatusModalOpen(false);
      fetchStudentData();
    } catch (e) {
      alert('Failed to update student status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading Central Student Profile..." />;
  }

  if (!student) {
    return (
      <EmptyState
        title="Student not found"
        description="The requested student profile does not exist or has been deleted."
        actionText="Back to Student Directory"
        onAction={() => navigate('/students')}
      />
    );
  }

  const statusBadgeVariants = {
    Active: 'success',
    Inactive: 'neutral',
    Transferred: 'warning',
    Graduated: 'primary',
    Withdrawn: 'danger',
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex items-center justify-between">
        <Link
          to="/students"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Student Directory
        </Link>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsStatusModalOpen(true)}
        >
          Change Status
        </Button>
      </div>

      {/* Main Student Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center md:items-start gap-6">
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white font-bold text-3xl flex items-center justify-center shadow-lg shadow-indigo-600/30 shrink-0">
          {student.firstName[0]}{student.lastName[0]}
        </div>

        <div className="flex-1 text-center md:text-left space-y-2">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">
              {student.fullName || `${student.firstName} ${student.lastName}`}
            </h1>
            <Badge variant={statusBadgeVariants[student.status] || 'neutral'}>
              {student.status}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-xs text-slate-500 pt-1">
            <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
              ID: {student.studentId}
            </span>
            <span className="font-mono text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
              Adm No: {student.admissionNumber}
            </span>
            <span className="font-semibold text-slate-700">
              Class: {student.classId?.name} (Sec {student.sectionId?.name}) • Roll #{student.rollNumber}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-px">
        {[
          { id: 'overview', label: 'Personal Overview', icon: User },
          { id: 'parent', label: 'Parent & Family', icon: User },
          { id: 'academic', label: 'Academic Placement', icon: GraduationCap },
          { id: 'satellites', label: 'Cross-Department Satellites', icon: HeartPulse },
          { id: 'documents', label: 'Document Vault', icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT */}

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="Demographic Information">
            <dl className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <dt className="text-slate-400 font-medium">Date of Birth</dt>
                <dd className="text-slate-800 font-semibold mt-0.5">
                  {student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-slate-400 font-medium">Gender</dt>
                <dd className="text-slate-800 font-semibold mt-0.5">{student.gender}</dd>
              </div>
              <div>
                <dt className="text-slate-400 font-medium">Blood Group</dt>
                <dd className="text-slate-800 font-semibold mt-0.5">{student.bloodGroup || 'Unknown'}</dd>
              </div>
              <div>
                <dt className="text-slate-400 font-medium">Student Phone</dt>
                <dd className="text-slate-800 font-semibold mt-0.5">{student.contact?.phone || '—'}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-slate-400 font-medium">Student Email</dt>
                <dd className="text-slate-800 font-semibold mt-0.5">{student.contact?.email || '—'}</dd>
              </div>
            </dl>
          </Card>

          <Card title="Residential Address & Emergency">
            <dl className="space-y-3 text-xs">
              <div>
                <dt className="text-slate-400 font-medium">Address</dt>
                <dd className="text-slate-800 font-semibold mt-0.5">
                  {student.address?.street || 'Not provided'}, {student.address?.city || ''}
                </dd>
              </div>
              <div className="pt-2 border-t border-slate-100">
                <dt className="text-slate-400 font-medium">Emergency Contact</dt>
                <dd className="text-slate-800 font-semibold mt-0.5">
                  {student.emergencyContact?.name} ({student.emergencyContact?.relationship}) •{' '}
                  <span className="text-indigo-600">{student.emergencyContact?.phone}</span>
                </dd>
              </div>
            </dl>
          </Card>
        </div>
      )}

      {/* TAB 2: PARENT & FAMILY */}
      {activeTab === 'parent' && (
        <div className="space-y-4">
          <Card title="Guardian / Parent Profile">
            {student.parentId ? (
              <dl className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <dt className="text-slate-400 font-medium">Father's Name</dt>
                  <dd className="text-slate-800 font-bold mt-0.5">{student.parentId.fatherName || '—'}</dd>
                </div>
                <div>
                  <dt className="text-slate-400 font-medium">Father's Phone</dt>
                  <dd className="text-slate-800 font-bold mt-0.5 text-indigo-600">
                    {student.parentId.fatherPhone || '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-400 font-medium">Father's Occupation</dt>
                  <dd className="text-slate-800 font-medium mt-0.5">
                    {student.parentId.fatherOccupation || '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-400 font-medium">Mother's Name</dt>
                  <dd className="text-slate-800 font-bold mt-0.5">{student.parentId.motherName || '—'}</dd>
                </div>
                <div>
                  <dt className="text-slate-400 font-medium">Mother's Phone</dt>
                  <dd className="text-slate-800 font-medium mt-0.5">{student.parentId.motherPhone || '—'}</dd>
                </div>
                <div>
                  <dt className="text-slate-400 font-medium">Primary Emergency Phone</dt>
                  <dd className="text-slate-800 font-bold mt-0.5 text-emerald-600">
                    {student.parentId.primaryContactNumber || '—'}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="text-xs text-slate-500">No parent profile linked.</p>
            )}
          </Card>
        </div>
      )}

      {/* TAB 3: ACADEMIC */}
      {activeTab === 'academic' && (
        <Card title="Current Enrollment & Session Placement">
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <dt className="text-slate-400 font-medium">Class</dt>
              <dd className="text-base font-bold text-slate-800 mt-1">{student.classId?.name}</dd>
            </div>
            <div>
              <dt className="text-slate-400 font-medium">Section</dt>
              <dd className="text-base font-bold text-slate-800 mt-1">{student.sectionId?.name}</dd>
            </div>
            <div>
              <dt className="text-slate-400 font-medium">Assigned Roll Number</dt>
              <dd className="text-base font-bold text-indigo-600 mt-1">#{student.rollNumber}</dd>
            </div>
            <div>
              <dt className="text-slate-400 font-medium">Academic Session</dt>
              <dd className="text-base font-bold text-slate-800 mt-1">
                {student.academicSessionId?.name || 'Current'}
              </dd>
            </div>
          </dl>
        </Card>
      )}

      {/* TAB 4: SATELLITES (CORE PRINCIPLE: ONE STUDENT -> ONE CENTRAL PROFILE) */}
      {activeTab === 'satellites' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-sky-500">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-5 h-5 text-sky-500" />
              <h4 className="text-sm font-bold text-slate-800">Attendance</h4>
            </div>
            <p className="text-2xl font-bold text-slate-900">96.2%</p>
            <p className="text-[11px] text-slate-500 mt-1">Daily register synchronized</p>
          </Card>

          <Link to="/finance" className="block group">
            <Card className="border-l-4 border-l-emerald-500 group-hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-emerald-500" />
                  <h4 className="text-sm font-bold text-slate-800">Fee Ledger</h4>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
              </div>
              <p className="text-xl font-bold text-emerald-600">Accounts Portal</p>
              <p className="text-[11px] text-slate-500 mt-1">View invoices, receipts & balances &rarr;</p>
            </Card>
          </Link>

          <Card className="border-l-4 border-l-purple-500">
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className="w-5 h-5 text-purple-500" />
              <h4 className="text-sm font-bold text-slate-800">Library</h4>
            </div>
            <p className="text-2xl font-bold text-slate-900">1 Book</p>
            <p className="text-[11px] text-slate-500 mt-1">Active loan due in 4 days</p>
          </Card>

          <Card className="border-l-4 border-l-amber-500">
            <div className="flex items-center gap-3 mb-2">
              <Bus className="w-5 h-5 text-amber-500" />
              <h4 className="text-sm font-bold text-slate-800">Transport</h4>
            </div>
            <p className="text-sm font-bold text-slate-900">Route #12</p>
            <p className="text-[11px] text-slate-500 mt-1">Bus Stop: Sector 4 Corner</p>
          </Card>
        </div>
      )}

      {/* TAB 5: DOCUMENTS */}
      {activeTab === 'documents' && (
        <Card title="Student KYC & Certificates Vault">
          {documents.length === 0 ? (
            <EmptyState
              title="No documents uploaded"
              description="Birth certificate, transfer certificate, or health clearance documents have not been uploaded yet."
            />
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => (
                <div
                  key={doc._id}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-indigo-600" />
                    <div>
                      <p className="font-semibold text-slate-800">{doc.title}</p>
                      <p className="text-[10px] text-slate-400">{doc.documentType}</p>
                    </div>
                  </div>
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 hover:underline font-semibold"
                  >
                    View File
                  </a>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* CHANGE STATUS MODAL */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title="Update Student Status"
        subtitle={`Current Status: ${student.status}`}
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold mb-1">Select New Status</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Transferred">Transferred</option>
              <option value="Graduated">Graduated</option>
              <option value="Withdrawn">Withdrawn</option>
            </select>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsStatusModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" isLoading={isUpdatingStatus} onClick={handleStatusChange}>
              Update Status
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default StudentDetailPage;
