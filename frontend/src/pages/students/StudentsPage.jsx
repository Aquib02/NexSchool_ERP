import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Users,
  Search,
  Plus,
  Download,
  Upload,
  Filter,
  Eye,
  Edit,
  ChevronLeft,
  ChevronRight,
  Phone,
  ArrowUpDown,
  GraduationCap,
  X,
  Calendar,
  FileSpreadsheet,
} from 'lucide-react';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';
import Modal from '../../components/common/Modal.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import studentService from '../../services/studentService.js';
import adminService from '../../services/adminService.js';

export const StudentsPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [students, setStudents] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('Active');
  const [selectedSession, setSelectedSession] = useState('');

  // Metadata dropdowns
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [sessions, setSessions] = useState([]);

  // Sync if URL search changes
  useEffect(() => {
    const q = searchParams.get('search');
    if (q !== null && q !== search) {
      setSearch(q);
    }
  }, [searchParams]);

  // Create Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formStep, setFormStep] = useState(1); // 1: Personal, 2: Academic, 3: Parent
  const [studentForm, setStudentForm] = useState({
    academicSessionId: '',
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
    fatherName: '',
    fatherPhone: '',
    fatherOccupation: '',
    motherName: '',
    motherPhone: '',
  });

  // Bulk CSV Import Modal
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importSessionId, setImportSessionId] = useState('');
  const [importClassId, setImportClassId] = useState('');
  const [importSectionId, setImportSectionId] = useState('');
  const [importCsvText, setImportCsvText] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importMessage, setImportMessage] = useState(null);

  // Load classes, sections & academic sessions for filters
  useEffect(() => {
    const fetchMetadata = async () => {
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
    fetchMetadata();
  }, []);

  // Load students
  const fetchStudents = async (page = 1) => {
    setLoading(true);
    try {
      const res = await studentService.getStudents({
        page,
        limit: pagination.limit,
        search,
        classId: selectedClass,
        sectionId: selectedSection,
        status: selectedStatus,
        academicSessionId: selectedSession || undefined,
      });
      if (res.success && res.data) {
        setStudents(res.data.students || []);
        setPagination(res.data.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
      }
    } catch (err) {
      console.error('Failed to load students', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStudents(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [search, selectedClass, selectedSection, selectedStatus, selectedSession]);

  const handleBulkImport = async (e) => {
    e.preventDefault();
    if (!importCsvText.trim()) return;
    setIsImporting(true);
    setImportMessage(null);

    try {
      const lines = importCsvText
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      if (lines.length < 2) {
        throw new Error('CSV must contain a header row and at least one student data row.');
      }

      const headers = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, '').toLowerCase());
      const dataRows = lines.slice(1);

      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < dataRows.length; i++) {
        const values = dataRows[i].split(',').map((v) => v.trim().replace(/^["']|["']$/g, ''));
        const row = {};
        headers.forEach((h, idx) => {
          row[h] = values[idx] || '';
        });

        const newStudent = {
          academicSessionId: importSessionId || undefined,
          classId: importClassId || undefined,
          sectionId: importSectionId || undefined,
          firstName: row.firstname || row.first_name || (row.name ? row.name.split(' ')[0] : `Student${i + 1}`),
          lastName: row.lastname || row.last_name || (row.name && row.name.split(' ').length > 1 ? row.name.split(' ').slice(1).join(' ') : 'Enrolled'),
          gender: row.gender ? (['female', 'other'].includes(row.gender.toLowerCase()) ? (row.gender.toLowerCase() === 'female' ? 'Female' : 'Other') : 'Male') : 'Male',
          dateOfBirth: row.dateofbirth || row.dob || '2010-01-01',
          rollNumber: Number(row.rollnumber || row.roll || i + 1),
          contact: {
            phone: row.phone || row.contact || '',
            email: row.email || '',
          },
          parentData: {
            fatherName: row.fathername || row.father || 'Parent / Guardian',
            fatherPhone: row.phone || row.contact || '9876543210',
            motherName: row.mothername || row.mother || '',
            primaryContactNumber: row.phone || row.contact || '9876543210',
          },
        };

        try {
          await studentService.createStudent(newStudent);
          successCount++;
        } catch (err) {
          console.error(`Failed to import student row ${i + 1}:`, err);
          errorCount++;
        }
      }

      setImportMessage({
        type: successCount > 0 ? 'success' : 'error',
        text: `Import complete: ${successCount} past students successfully registered.${errorCount > 0 ? ` (${errorCount} skipped/failed)` : ''}`,
      });
      fetchStudents(1);
      if (successCount > 0) {
        setTimeout(() => {
          setIsImportModalOpen(false);
          setImportCsvText('');
          setImportMessage(null);
        }, 2200);
      }
    } catch (err) {
      setImportMessage({ type: 'error', text: err.message || 'Failed to parse or process CSV file.' });
    } finally {
      setIsImporting(false);
    }
  };

  const handleExport = async () => {
    try {
      const res = await studentService.exportStudents({
        classId: selectedClass,
        sectionId: selectedSection,
        status: selectedStatus,
      });

      if (res.success && res.data) {
        const csvRows = [];
        const headers = ['Student ID', 'Admission No', 'Name', 'Class', 'Section', 'Roll No', 'Gender', 'Phone', 'Father Name', 'Status'];
        csvRows.push(headers.join(','));

        res.data.forEach((s) => {
          csvRows.push(
            [
              `"${s.studentId}"`,
              `"${s.admissionNumber}"`,
              `"${s.name}"`,
              `"${s.class}"`,
              `"${s.section}"`,
              s.rollNumber,
              `"${s.gender}"`,
              `"${s.phone}"`,
              `"${s.fatherName}"`,
              `"${s.status}"`,
            ].join(',')
          );
        });

        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `students_export_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
      }
    } catch (e) {
      alert('Failed to export students data.');
    }
  };

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        academicSessionId: studentForm.academicSessionId || undefined,
        firstName: studentForm.firstName,
        lastName: studentForm.lastName,
        dateOfBirth: studentForm.dateOfBirth,
        gender: studentForm.gender,
        bloodGroup: studentForm.bloodGroup,
        classId: studentForm.classId,
        sectionId: studentForm.sectionId,
        rollNumber: Number(studentForm.rollNumber),
        contact: { phone: studentForm.phone, email: studentForm.email },
        address: { street: studentForm.street, city: studentForm.city },
        parentData: {
          fatherName: studentForm.fatherName,
          fatherPhone: studentForm.fatherPhone,
          fatherOccupation: studentForm.fatherOccupation,
          motherName: studentForm.motherName,
          motherPhone: studentForm.motherPhone,
          primaryContactNumber: studentForm.fatherPhone || studentForm.motherPhone,
        },
      };

      await studentService.createStudent(payload);
      setIsAddModalOpen(false);
      setFormStep(1);
      setStudentForm({
        academicSessionId: '',
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
        fatherName: '',
        fatherPhone: '',
        fatherOccupation: '',
        motherName: '',
        motherPhone: '',
      });
      fetchStudents(1);
    } catch (err) {
      alert(err.message || 'Failed to enroll student');
    }
  };

  const statusBadgeMap = {
    Active: 'success',
    Inactive: 'neutral',
    Transferred: 'warning',
    Graduated: 'primary',
    Withdrawn: 'danger',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Student Directory</h1>
          <p className="text-xs text-slate-500 mt-1">
            Central repository of enrolled students, academic placements, and parent linkages.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" icon={Upload} onClick={() => setIsImportModalOpen(true)}>
            Bulk Import CSV
          </Button>
          <Button variant="outline" size="sm" icon={Download} onClick={handleExport}>
            Export CSV
          </Button>
          <Button variant="primary" size="sm" icon={Plus} onClick={() => setIsAddModalOpen(true)}>
            Enroll Student
          </Button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name, ID, admission number, or phone..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-9 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
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

        {/* Academic Session Filter */}
        <div className="w-full md:w-44">
          <select
            value={selectedSession}
            onChange={(e) => setSelectedSession(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">All Academic Years</option>
            {sessions.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name} {s.isCurrent ? '★ (Active)' : `(${s.status || 'Past'})`}
              </option>
            ))}
          </select>
        </div>

        {/* Class Filter */}
        <div className="w-full md:w-40">
          <select
            value={selectedClass}
            onChange={(e) => {
              setSelectedClass(e.target.value);
              setSelectedSection('');
            }}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">All Classes</option>
            {classes.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Section Filter */}
        <div className="w-full md:w-36">
          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            disabled={!selectedClass}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">All Sections</option>
            {sections
              .filter((s) => s.classId?._id === selectedClass || s.classId === selectedClass)
              .map((sec) => (
                <option key={sec._id} value={sec._id}>Section {sec.name}</option>
              ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="w-full md:w-32">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Transferred">Transferred</option>
            <option value="Graduated">Graduated</option>
            <option value="Withdrawn">Withdrawn</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      {loading ? (
        <LoadingSpinner text="Fetching students..." />
      ) : students.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No students found"
          description="No student records match your current filter and search criteria."
          actionText="Enroll New Student"
          onAction={() => setIsAddModalOpen(true)}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider">
                  <th className="p-3.5 font-semibold">Student ID</th>
                  <th className="p-3.5 font-semibold">Student Name</th>
                  <th className="p-3.5 font-semibold">Class / Section</th>
                  <th className="p-3.5 font-semibold">Academic Year</th>
                  <th className="p-3.5 font-semibold text-center">Roll No</th>
                  <th className="p-3.5 font-semibold">Guardian / Contact</th>
                  <th className="p-3.5 font-semibold">Status</th>
                  <th className="p-3.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {students.map((student) => (
                  <tr key={student._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5">
                      <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                        {student.studentId}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center shrink-0">
                          {student.firstName[0]}{student.lastName[0]}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 leading-tight">
                            {student.firstName} {student.lastName}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{student.gender} • Blood: {student.bloodGroup}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span className="font-medium text-slate-900">
                        {student.classId?.name || 'Class'}
                      </span>
                      <span className="text-slate-500 ml-1">
                        ({student.sectionId?.name || 'A'})
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className="inline-flex items-center gap-1 font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {student.academicSessionId?.name || '2025-2026'}
                      </span>
                    </td>
                    <td className="p-3.5 text-center font-bold text-slate-800">
                      {student.rollNumber}
                    </td>
                    <td className="p-3.5">
                      <p className="font-medium text-slate-800 leading-tight">
                        {student.parentId?.fatherName || student.parentId?.motherName || 'Parent'}
                      </p>
                      <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {student.contact?.phone || student.parentId?.primaryContactNumber || '—'}
                      </p>
                    </td>
                    <td className="p-3.5">
                      <Badge variant={statusBadgeMap[student.status] || 'neutral'}>
                        {student.status}
                      </Badge>
                    </td>
                    <td className="p-3.5 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Eye}
                        onClick={() => navigate(`/students/${student._id}`)}
                      >
                        360 View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Toolbar */}
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} students
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => fetchStudents(pagination.page - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="px-3 font-semibold text-slate-700">
                {pagination.page} / {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchStudents(pagination.page + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ENROLL STUDENT MULTI-STEP MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setFormStep(1);
        }}
        title="Enroll New Student"
        subtitle={`Step ${formStep} of 3: ${
          formStep === 1 ? 'Personal Information' : formStep === 2 ? 'Academic Placement' : 'Parent & Guardian Details'
        }`}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleCreateStudent} className="space-y-4 text-xs">
          {formStep === 1 && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={studentForm.firstName}
                    onChange={(e) => setStudentForm({ ...studentForm, firstName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={studentForm.lastName}
                    onChange={(e) => setStudentForm({ ...studentForm, lastName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Date of Birth *</label>
                  <input
                    type="date"
                    required
                    value={studentForm.dateOfBirth}
                    onChange={(e) => setStudentForm({ ...studentForm, dateOfBirth: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Gender *</label>
                  <select
                    value={studentForm.gender}
                    onChange={(e) => setStudentForm({ ...studentForm, gender: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Blood Group</label>
                  <select
                    value={studentForm.bloodGroup}
                    onChange={(e) => setStudentForm({ ...studentForm, bloodGroup: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Unknown">Unknown</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Student Phone</label>
                  <input
                    type="text"
                    value={studentForm.phone}
                    onChange={(e) => setStudentForm({ ...studentForm, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Student Email</label>
                  <input
                    type="email"
                    value={studentForm.email}
                    onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>
            </div>
          )}

          {formStep === 2 && (
            <div className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">Academic Session / Year</label>
                <select
                  value={studentForm.academicSessionId}
                  onChange={(e) => setStudentForm({ ...studentForm, academicSessionId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">Current Active Session (Default)</option>
                  {sessions.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} {s.isCurrent ? '★ (Current Active)' : `(${s.status || 'Past'})`}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">Select a past academic year (e.g. 2024-2025) to enroll historical records.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Assign Class *</label>
                  <select
                    required
                    value={studentForm.classId}
                    onChange={(e) => setStudentForm({ ...studentForm, classId: e.target.value, sectionId: '' })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="">Select Class...</option>
                    {classes.map((c) => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Assign Section *</label>
                  <select
                    required
                    disabled={!studentForm.classId}
                    value={studentForm.sectionId}
                    onChange={(e) => setStudentForm({ ...studentForm, sectionId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl disabled:opacity-50"
                  >
                    <option value="">Select Section...</option>
                    {sections
                      .filter((s) => s.classId?._id === studentForm.classId || s.classId === studentForm.classId)
                      .map((sec) => (
                        <option key={sec._id} value={sec._id}>Section {sec.name}</option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Roll Number in Section *</label>
                <input
                  type="number"
                  required
                  value={studentForm.rollNumber}
                  onChange={(e) => setStudentForm({ ...studentForm, rollNumber: e.target.value })}
                  placeholder="e.g. 1"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Residential Address</label>
                <input
                  type="text"
                  value={studentForm.street}
                  onChange={(e) => setStudentForm({ ...studentForm, street: e.target.value })}
                  placeholder="Street / Colony"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>
          )}

          {formStep === 3 && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Father Name *</label>
                  <input
                    type="text"
                    required
                    value={studentForm.fatherName}
                    onChange={(e) => setStudentForm({ ...studentForm, fatherName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Father Primary Phone *</label>
                  <input
                    type="text"
                    required
                    value={studentForm.fatherPhone}
                    onChange={(e) => setStudentForm({ ...studentForm, fatherPhone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Mother Name</label>
                  <input
                    type="text"
                    value={studentForm.motherName}
                    onChange={(e) => setStudentForm({ ...studentForm, motherName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Mother Phone</label>
                  <input
                    type="text"
                    value={studentForm.motherPhone}
                    onChange={(e) => setStudentForm({ ...studentForm, motherPhone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Father Occupation</label>
                <input
                  type="text"
                  value={studentForm.fatherOccupation}
                  onChange={(e) => setStudentForm({ ...studentForm, fatherOccupation: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>
          )}

          {/* Stepper Navigation */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            {formStep > 1 ? (
              <Button variant="secondary" size="sm" onClick={() => setFormStep(formStep - 1)}>
                Back
              </Button>
            ) : <div />}

            {formStep < 3 ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  if (formStep === 1 && (!studentForm.firstName || !studentForm.lastName || !studentForm.dateOfBirth)) {
                    alert('Please complete required fields (Name and DOB)');
                    return;
                  }
                  if (formStep === 2 && (!studentForm.classId || !studentForm.sectionId || !studentForm.rollNumber)) {
                    alert('Please assign class, section, and roll number');
                    return;
                  }
                  setFormStep(formStep + 1);
                }}
              >
                Next Step
              </Button>
            ) : (
              <Button type="submit" variant="primary" size="sm">
                Confirm & Enroll Student
              </Button>
            )}
          </div>
        </form>
      </Modal>

      {/* BULK CSV IMPORT MODAL */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => {
          setIsImportModalOpen(false);
          setImportMessage(null);
        }}
        title="Bulk Import Past Academic Year Students"
        subtitle="Quickly ingest historical or batch student records via CSV into any Academic Session."
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleBulkImport} className="space-y-4 text-xs">
          {importMessage && (
            <div
              className={`p-3 rounded-xl border text-xs font-medium ${
                importMessage.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {importMessage.text}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold mb-1">Target Academic Year *</label>
              <select
                required
                value={importSessionId}
                onChange={(e) => setImportSessionId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="">Select Academic Year...</option>
                {sessions.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} {s.isCurrent ? '★ (Active)' : `(${s.status || 'Past'})`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1">Assign Class *</label>
              <select
                required
                value={importClassId}
                onChange={(e) => {
                  setImportClassId(e.target.value);
                  setImportSectionId('');
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="">Select Class...</option>
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1">Assign Section *</label>
              <select
                required
                disabled={!importClassId}
                value={importSectionId}
                onChange={(e) => setImportSectionId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl disabled:opacity-50 focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="">Select Section...</option>
                {sections
                  .filter((s) => s.classId?._id === importClassId || s.classId === importClassId)
                  .map((sec) => (
                    <option key={sec._id} value={sec._id}>Section {sec.name}</option>
                  ))}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block font-semibold">
                CSV Data (Paste rows with header) *
              </label>
              <button
                type="button"
                onClick={() => {
                  setImportCsvText(
                    `firstName,lastName,gender,dateOfBirth,rollNumber,phone,fatherName,motherName\n` +
                    `Rahul,Verma,Male,2010-05-12,1,9876500001,Suresh Verma,Anita Verma\n` +
                    `Priya,Singh,Female,2010-08-22,2,9876500002,Manoj Singh,Kavita Singh\n` +
                    `Amit,Patel,Male,2010-03-10,3,9876500003,Dinesh Patel,Geeta Patel`
                  );
                }}
                className="text-indigo-600 hover:text-indigo-800 font-medium text-[11px] underline cursor-pointer"
              >
                Load Sample CSV Template
              </button>
            </div>
            <textarea
              rows={7}
              required
              value={importCsvText}
              onChange={(e) => setImportCsvText(e.target.value)}
              placeholder={`firstName,lastName,gender,dateOfBirth,rollNumber,phone,fatherName,motherName\nAarav,Sharma,Male,2010-01-15,1,9876543210,Rajesh Sharma,Sunita Sharma`}
              className="w-full font-mono text-[11px] p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Required headers: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">firstName, lastName, gender, dateOfBirth, rollNumber, phone, fatherName, motherName</code>
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsImportModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              icon={Upload}
              isLoading={isImporting}
              disabled={isImporting || !importCsvText.trim()}
            >
              {isImporting ? 'Importing Records...' : 'Start Import'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default StudentsPage;
