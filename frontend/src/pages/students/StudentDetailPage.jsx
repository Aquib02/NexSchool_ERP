import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  User,
  GraduationCap,
  Calendar,
  HeartPulse,
  CreditCard,
  BookOpen,
  Bus,
  FileText,
  Edit,
  CheckCircle,
  AlertCircle,
  Key,
  Copy,
  Check,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';
import Modal from '../../components/common/Modal.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import studentService from '../../services/studentService.js';
import parentService from '../../services/parentService.js';
import adminService from '../../services/adminService.js';

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

  // Edit Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editTab, setEditTab] = useState('personal');
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState(null);
  const [editSuccess, setEditSuccess] = useState(false);

  // Metadata for Edit dropdowns
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [sessions, setSessions] = useState([]);

  // Edit form state
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'Male',
    bloodGroup: 'Unknown',
    phone: '',
    email: '',
    street: '',
    city: '',
    classId: '',
    sectionId: '',
    rollNumber: '',
    academicSessionId: '',
    fatherName: '',
    fatherPhone: '',
    fatherEmail: '',
    fatherOccupation: '',
    motherName: '',
    motherPhone: '',
    emergencyName: '',
    emergencyRelationship: '',
    emergencyPhone: '',
  });

  const [credentials, setCredentials] = useState(null);
  const [copiedField, setCopiedField] = useState(null);

  const handleCopy = (text, fieldKey) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const fetchStudentData = async () => {
    setLoading(true);
    try {
      const res = await studentService.getStudentById(id);
      if (res.success && res.data) {
        setStudent(res.data.student);
        setDocuments(res.data.documents || []);
        setNewStatus(res.data.student.status);
        setCredentials(res.data.credentials || null);
        populateEditForm(res.data.student);
      }
    } catch (err) {
      console.error('Failed to load student', err);
    } finally {
      setLoading(false);
    }
  };

  const populateEditForm = (s) => {
    setEditForm({
      firstName: s.firstName || '',
      lastName: s.lastName || '',
      dateOfBirth: s.dateOfBirth ? s.dateOfBirth.split('T')[0] : '',
      gender: s.gender || 'Male',
      bloodGroup: s.bloodGroup || 'Unknown',
      phone: s.contact?.phone || '',
      email: s.contact?.email || '',
      street: s.address?.street || '',
      city: s.address?.city || '',
      classId: s.classId?._id || s.classId || '',
      sectionId: s.sectionId?._id || s.sectionId || '',
      rollNumber: s.rollNumber || '',
      academicSessionId: s.academicSessionId?._id || s.academicSessionId || '',
      fatherName: s.parentId?.fatherName || '',
      fatherPhone: s.parentId?.fatherPhone || '',
      fatherEmail: s.parentId?.fatherEmail || '',
      fatherOccupation: s.parentId?.fatherOccupation || '',
      motherName: s.parentId?.motherName || '',
      motherPhone: s.parentId?.motherPhone || '',
      emergencyName: s.emergencyContact?.name || '',
      emergencyRelationship: s.emergencyContact?.relationship || '',
      emergencyPhone: s.emergencyContact?.phone || '',
    });
  };

  const loadMetadata = async () => {
    try {
      const [clsRes, secRes, sessRes] = await Promise.all([
        adminService.getClasses(),
        adminService.getSections(),
        adminService.getSessions(),
      ]);
      setClasses(clsRes.data || []);
      setSections(secRes.data || []);
      setSessions(sessRes.data?.data || sessRes.data || []);
    } catch (e) {
      console.error('Failed to load metadata', e);
    }
  };

  useEffect(() => {
    fetchStudentData();
    loadMetadata();
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

  const handleEditSave = async () => {
    setIsSaving(true);
    setEditError(null);
    setEditSuccess(false);
    try {
      const studentPayload = {
        firstName: editForm.firstName.trim(),
        lastName: editForm.lastName.trim(),
        dateOfBirth: editForm.dateOfBirth,
        gender: editForm.gender,
        bloodGroup: editForm.bloodGroup,
        classId: editForm.classId || undefined,
        sectionId: editForm.sectionId || undefined,
        rollNumber: editForm.rollNumber ? Number(editForm.rollNumber) : undefined,
        academicSessionId: editForm.academicSessionId || undefined,
        contact: { phone: editForm.phone.trim(), email: editForm.email.trim() },
        address: { street: editForm.street.trim(), city: editForm.city.trim() },
        emergencyContact: {
          name: editForm.emergencyName.trim() || editForm.fatherName.trim() || 'Parent',
          relationship: editForm.emergencyRelationship.trim() || 'Father',
          phone: editForm.emergencyPhone.trim() || editForm.fatherPhone.trim() || '0000000000',
        },
      };
      await studentService.updateStudent(id, studentPayload);

      if (student?.parentId?._id) {
        await parentService.updateParent(student.parentId._id, {
          fatherName: editForm.fatherName.trim(),
          fatherPhone: editForm.fatherPhone.trim(),
          fatherEmail: editForm.fatherEmail.trim(),
          fatherOccupation: editForm.fatherOccupation.trim(),
          motherName: editForm.motherName.trim(),
          motherPhone: editForm.motherPhone.trim(),
          primaryContactNumber: editForm.fatherPhone.trim() || editForm.motherPhone.trim(),
        });
      }

      setEditSuccess(true);
      setTimeout(() => {
        setIsEditModalOpen(false);
        setEditSuccess(false);
        fetchStudentData();
      }, 1200);
    } catch (err) {
      console.error('Save failed:', err);
      setEditError(err.message || 'Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditChange = (field, value) =>
    setEditForm((prev) => ({ ...prev, [field]: value }));

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

  const inp = 'w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500';
  const lbl = 'block text-[11px] font-semibold text-slate-500 mb-1 uppercase tracking-wide';

  const editTabs = [
    { id: 'personal', label: 'Personal Info' },
    { id: 'contact', label: 'Contact & Address' },
    { id: 'academic', label: 'Academic Placement' },
    { id: 'parent', label: 'Parent / Guardian' },
  ];

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <Link
          to="/students"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Student Directory
        </Link>
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            icon={Edit}
            onClick={() => {
              populateEditForm(student);
              setEditTab('personal');
              setEditError(null);
              setEditSuccess(false);
              setIsEditModalOpen(true);
            }}
          >
            Edit Student
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsStatusModalOpen(true)}>
            Change Status
          </Button>
        </div>
      </div>

      {/* Student Hero Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center md:items-start gap-6">
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white font-bold text-3xl flex items-center justify-center shadow-lg shadow-indigo-600/30 shrink-0">
          {student.firstName[0]}{student.lastName[0]}
        </div>
        <div className="flex-1 text-center md:text-left space-y-2">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">
              {student.fullName || `${student.firstName} ${student.lastName}`}
            </h1>
            <Badge variant={statusBadgeVariants[student.status] || 'neutral'}>{student.status}</Badge>
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

      {/* View Tabs */}
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

      {/* Tab: Overview */}
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
                  {student.address?.street || 'Not provided'}
                  {student.address?.city ? `, ${student.address.city}` : ''}
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

          {/* System Login Credentials Card */}
          <div className="col-span-1 md:col-span-2">
            <Card
              title="System Portal Login Credentials"
              subtitle="Auto-generated login accounts for student portal and father/guardian portal"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Student Credentials Box */}
                <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                        <Key className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800">Student Portal Login</h4>
                        <span className="text-[10px] text-slate-500">Access: Timetable, Homework, Exams</span>
                      </div>
                    </div>
                    <Badge variant="primary" size="xs">STUDENT</Badge>
                  </div>

                  <div className="space-y-2 bg-white/80 p-3 rounded-xl border border-indigo-100/80">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Login Username:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-indigo-600">
                          {credentials?.studentCredentials?.username || student.studentId?.toLowerCase()}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(
                              credentials?.studentCredentials?.username || student.studentId?.toLowerCase(),
                              'student_user'
                            )
                          }
                          className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
                          title="Copy Username"
                        >
                          {copiedField === 'student_user' ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                      <span className="text-slate-500 font-medium">Default Password:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-semibold text-slate-700">
                          {credentials?.studentCredentials?.password || `${(student.firstName || 'Student')}@12345`}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(credentials?.studentCredentials?.password || `${(student.firstName || 'Student')}@12345`, 'student_pass')}
                          className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
                          title="Copy Password"
                        >
                          {copiedField === 'student_pass' ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-500">Portal: /portal/student</span>
                    <Link
                      to="/portal/student"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:underline"
                    >
                      Open Student Portal <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>

                {/* Father / Parent Credentials Box */}
                <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                        <Key className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800">
                          {student.parentId?.fatherName ? `${student.parentId.fatherName}'s Login` : "Father's Portal Login"}
                        </h4>
                        <span className="text-[10px] text-slate-500">Access: Fees, Attendance, Child Records</span>
                      </div>
                    </div>
                    <Badge variant="success" size="xs">PARENT</Badge>
                  </div>

                  <div className="space-y-2 bg-white/80 p-3 rounded-xl border border-emerald-100/80">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Login Username:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-emerald-700">
                          {credentials?.parentCredentials?.username || (student.parentId?.fatherName || 'parent').split(' ')[0].toLowerCase()}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(
                              credentials?.parentCredentials?.username || (student.parentId?.fatherName || 'parent').split(' ')[0].toLowerCase(),
                              'parent_user'
                            )
                          }
                          className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
                          title="Copy Username"
                        >
                          {copiedField === 'parent_user' ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                      <span className="text-slate-500 font-medium">Default Password:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-semibold text-slate-700">
                          {credentials?.parentCredentials?.password || `${(student.parentId?.fatherName || 'Parent').split(' ')[0]}@12345`}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(credentials?.parentCredentials?.password || `${(student.parentId?.fatherName || 'Parent').split(' ')[0]}@12345`, 'parent_pass')}
                          className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
                          title="Copy Password"
                        >
                          {copiedField === 'parent_pass' ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-500">Portal: /portal/parent</span>
                    <Link
                      to="/portal/parent"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:underline"
                    >
                      Open Parent Portal <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Copy all credentials bar */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Credentials can be shared directly with students and parents for sign-in.
                </span>
                <Button
                  variant="outline"
                  size="xs"
                  icon={copiedField === 'all' ? Check : Copy}
                  onClick={() => {
                    const stuUser = credentials?.studentCredentials?.username || (student.firstName || 'student').toLowerCase();
                    const stuPass = credentials?.studentCredentials?.password || `${(student.firstName || 'Student')}@12345`;
                    const parUser = credentials?.parentCredentials?.username || (student.parentId?.fatherName || 'parent').split(' ')[0].toLowerCase();
                    const parPass = credentials?.parentCredentials?.password || `${(student.parentId?.fatherName || 'Parent').split(' ')[0]}@12345`;
                    const text = `NexSchool ERP Login Credentials\n\nStudent: ${student.fullName || `${student.firstName} ${student.lastName}`}\nUsername: ${stuUser}\nPassword: ${stuPass}\nPortal: ${window.location.origin}/login\n\nFather: ${student.parentId?.fatherName || 'Parent'}\nUsername: ${parUser}\nPassword: ${parPass}\nPortal: ${window.location.origin}/login`;
                    handleCopy(text, 'all');
                  }}
                >
                  {copiedField === 'all' ? 'Credentials Copied!' : 'Copy All Credentials for WhatsApp/SMS'}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Tab: Parent */}
      {activeTab === 'parent' && (
        <Card title="Guardian / Parent Profile">
          {student.parentId ? (
            <dl className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              <div>
                <dt className="text-slate-400 font-medium">Father's Name</dt>
                <dd className="text-slate-800 font-bold mt-0.5">{student.parentId.fatherName || '—'}</dd>
              </div>
              <div>
                <dt className="text-slate-400 font-medium">Father's Phone</dt>
                <dd className="text-indigo-600 font-bold mt-0.5">{student.parentId.fatherPhone || '—'}</dd>
              </div>
              <div>
                <dt className="text-slate-400 font-medium">Father's Occupation</dt>
                <dd className="text-slate-800 font-medium mt-0.5">{student.parentId.fatherOccupation || '—'}</dd>
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
                <dd className="text-emerald-600 font-bold mt-0.5">{student.parentId.primaryContactNumber || '—'}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-xs text-slate-500">No parent profile linked.</p>
          )}
        </Card>
      )}

      {/* Tab: Academic */}
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
              <dt className="text-slate-400 font-medium">Roll Number</dt>
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

      {/* Tab: Satellites */}
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

      {/* Tab: Documents */}
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
                  <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline font-semibold">
                    View File
                  </a>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ═══════════════ EDIT STUDENT MODAL ═══════════════ */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => { setIsEditModalOpen(false); setEditError(null); setEditSuccess(false); }}
        title="Edit Student Profile"
        subtitle={`${student.firstName} ${student.lastName} · ${student.studentId}`}
        maxWidth="max-w-3xl"
      >
        <div className="space-y-4 text-xs">
          {/* Edit section tabs */}
          <div className="flex items-center border-b border-slate-200 gap-1 overflow-x-auto pb-px">
            {editTabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setEditTab(t.id)}
                className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                  editTab === t.id
                    ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Personal Info */}
          {editTab === 'personal' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={lbl}>First Name *</label>
                <input type="text" value={editForm.firstName} onChange={(e) => handleEditChange('firstName', e.target.value)} className={inp} placeholder="First Name" />
              </div>
              <div>
                <label className={lbl}>Last Name *</label>
                <input type="text" value={editForm.lastName} onChange={(e) => handleEditChange('lastName', e.target.value)} className={inp} placeholder="Last Name" />
              </div>
              <div>
                <label className={lbl}>Date of Birth</label>
                <input type="date" value={editForm.dateOfBirth} onChange={(e) => handleEditChange('dateOfBirth', e.target.value)} className={inp} />
              </div>
              <div>
                <label className={lbl}>Gender</label>
                <select value={editForm.gender} onChange={(e) => handleEditChange('gender', e.target.value)} className={inp}>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className={lbl}>Blood Group</label>
                <select value={editForm.bloodGroup} onChange={(e) => handleEditChange('bloodGroup', e.target.value)} className={inp}>
                  {['Unknown', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                    <option key={bg}>{bg}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Contact & Address */}
          {editTab === 'contact' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Student Phone</label>
                  <input type="tel" value={editForm.phone} onChange={(e) => handleEditChange('phone', e.target.value)} className={inp} placeholder="e.g. 9876543210" />
                </div>
                <div>
                  <label className={lbl}>Student Email</label>
                  <input type="email" value={editForm.email} onChange={(e) => handleEditChange('email', e.target.value)} className={inp} placeholder="student@example.com" />
                </div>
                <div>
                  <label className={lbl}>Street / Area</label>
                  <input type="text" value={editForm.street} onChange={(e) => handleEditChange('street', e.target.value)} className={inp} placeholder="Street / Area" />
                </div>
                <div>
                  <label className={lbl}>City</label>
                  <input type="text" value={editForm.city} onChange={(e) => handleEditChange('city', e.target.value)} className={inp} placeholder="City" />
                </div>
              </div>
              <div className="border-t border-slate-100 pt-4">
                <p className="font-semibold text-slate-700 mb-3">Emergency Contact</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className={lbl}>Contact Name</label>
                    <input type="text" value={editForm.emergencyName} onChange={(e) => handleEditChange('emergencyName', e.target.value)} className={inp} placeholder="Full Name" />
                  </div>
                  <div>
                    <label className={lbl}>Relationship</label>
                    <input type="text" value={editForm.emergencyRelationship} onChange={(e) => handleEditChange('emergencyRelationship', e.target.value)} className={inp} placeholder="e.g. Father" />
                  </div>
                  <div>
                    <label className={lbl}>Phone</label>
                    <input type="tel" value={editForm.emergencyPhone} onChange={(e) => handleEditChange('emergencyPhone', e.target.value)} className={inp} placeholder="e.g. 9876543210" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Academic Placement */}
          {editTab === 'academic' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Academic Session</label>
                <select value={editForm.academicSessionId} onChange={(e) => handleEditChange('academicSessionId', e.target.value)} className={inp}>
                  <option value="">Select Session...</option>
                  {sessions.map((s) => (
                    <option key={s._id} value={s._id}>{s.name} {s.isCurrent ? '★ (Active)' : ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={lbl}>Roll Number</label>
                <input type="number" value={editForm.rollNumber} onChange={(e) => handleEditChange('rollNumber', e.target.value)} className={inp} placeholder="e.g. 5" min={1} />
              </div>
              <div>
                <label className={lbl}>Class</label>
                <select value={editForm.classId} onChange={(e) => { handleEditChange('classId', e.target.value); handleEditChange('sectionId', ''); }} className={inp}>
                  <option value="">Select Class...</option>
                  {classes.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={lbl}>Section</label>
                <select value={editForm.sectionId} onChange={(e) => handleEditChange('sectionId', e.target.value)} disabled={!editForm.classId} className={`${inp} disabled:opacity-50`}>
                  <option value="">Select Section...</option>
                  {sections
                    .filter((s) => s.classId?._id === editForm.classId || s.classId === editForm.classId)
                    .map((sec) => (
                      <option key={sec._id} value={sec._id}>Section {sec.name}</option>
                    ))}
                </select>
              </div>
              <div className="col-span-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[11px]">
                ⚠️ Changing Class / Section / Roll Number will re-assign the student academically. Ensure roll number is unique in the target section.
              </div>
            </div>
          )}

          {/* Parent / Guardian */}
          {editTab === 'parent' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Father's Full Name</label>
                <input type="text" value={editForm.fatherName} onChange={(e) => handleEditChange('fatherName', e.target.value)} className={inp} placeholder="Father's Name" />
              </div>
              <div>
                <label className={lbl}>Father's Phone</label>
                <input type="tel" value={editForm.fatherPhone} onChange={(e) => handleEditChange('fatherPhone', e.target.value)} className={inp} placeholder="Father's Mobile" />
              </div>
              <div>
                <label className={lbl}>Father's Email</label>
                <input type="email" value={editForm.fatherEmail} onChange={(e) => handleEditChange('fatherEmail', e.target.value)} className={inp} placeholder="father@example.com" />
              </div>
              <div>
                <label className={lbl}>Father's Occupation</label>
                <input type="text" value={editForm.fatherOccupation} onChange={(e) => handleEditChange('fatherOccupation', e.target.value)} className={inp} placeholder="e.g. Business" />
              </div>
              <div>
                <label className={lbl}>Mother's Full Name</label>
                <input type="text" value={editForm.motherName} onChange={(e) => handleEditChange('motherName', e.target.value)} className={inp} placeholder="Mother's Name" />
              </div>
              <div>
                <label className={lbl}>Mother's Phone</label>
                <input type="tel" value={editForm.motherPhone} onChange={(e) => handleEditChange('motherPhone', e.target.value)} className={inp} placeholder="Mother's Mobile" />
              </div>
            </div>
          )}

          {/* Error / Success feedback */}
          {editError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{editError}</span>
            </div>
          )}
          {editSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Changes saved successfully! Refreshing profile…</span>
            </div>
          )}

          {/* Footer */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {editTabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setEditTab(t.id)}
                  title={t.label}
                  className={`w-2 h-2 rounded-full transition-colors cursor-pointer ${editTab === t.id ? 'bg-indigo-600' : 'bg-slate-200 hover:bg-slate-300'}`}
                />
              ))}
            </div>
            <div className="flex items-center gap-2.5">
              <Button type="button" variant="secondary" size="sm" onClick={() => { setIsEditModalOpen(false); setEditError(null); }}>
                Cancel
              </Button>
              <Button type="button" variant="primary" size="sm" icon={Edit} isLoading={isSaving} disabled={isSaving || editSuccess} onClick={handleEditSave}>
                {isSaving ? 'Saving…' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* ═══════════════ STATUS MODAL ═══════════════ */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title="Update Student Status"
        subtitle={`Current Status: ${student.status}`}
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold mb-1">Select New Status</label>
            <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Transferred">Transferred</option>
              <option value="Graduated">Graduated</option>
              <option value="Withdrawn">Withdrawn</option>
            </select>
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsStatusModalOpen(false)}>Cancel</Button>
            <Button variant="primary" isLoading={isUpdatingStatus} onClick={handleStatusChange}>Update Status</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default StudentDetailPage;
