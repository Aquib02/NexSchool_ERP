import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import * as XLSX from 'xlsx';
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
  CheckCircle2,
  AlertCircle,
  FileText,
  Check,
  Trash2,
  FileUp,
  Key,
  Copy,
  ExternalLink,
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

  // Bulk Student Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importTab, setImportTab] = useState('file'); // 'file' | 'paste'
  const [importFileName, setImportFileName] = useState('');
  const [importSessionId, setImportSessionId] = useState('');
  const [importClassId, setImportClassId] = useState('');
  const [importSectionId, setImportSectionId] = useState('');
  const [autoAssignRollNumber, setAutoAssignRollNumber] = useState(true);
  const [importCsvText, setImportCsvText] = useState('');
  const [parsedStudents, setParsedStudents] = useState([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const [importError, setImportError] = useState(null);
  const fileInputRef = useRef(null);

  // Single Enrollment Success Credentials Modal State
  const [enrollmentSuccessData, setEnrollmentSuccessData] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);

  const handleCopyText = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDownloadCredentialsCsv = (importedList = []) => {
    if (!importedList.length) return;
    const headers = [
      'Student Name',
      'Student ID',
      'Class',
      'Section',
      'Roll Number',
      'Student Login Username',
      'Student Default Password',
      'Father Name',
      'Father Login Username',
      'Father Default Password',
    ];
    const rows = [headers.join(',')];
    importedList.forEach((s) => {
      rows.push(
        [
          `"${s.name}"`,
          `"${s.studentId}"`,
          `"${s.class}"`,
          `"${s.section}"`,
          s.rollNumber,
          `"${s.studentUsername || ''}"`,
          `"${s.studentPassword || `${(s.name || 'Student').split(' ')[0]}@12345`}"`,
          `"${s.fatherName || ''}"`,
          `"${s.fatherUsername || ''}"`,
          `"${s.fatherPassword || `${(s.fatherName || 'Parent').split(' ')[0]}@12345`}"`,
        ].join(',')
      );
    });
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `student_and_father_credentials_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

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
        const loadedSessions = sessRes.data?.data || sessRes.data || [];
        setSessions(loadedSessions);

        // Pre-select active session for import
        const currentSess = loadedSessions.find((s) => s.isCurrent);
        if (currentSess) {
          setImportSessionId(currentSess._id);
        } else if (loadedSessions.length > 0) {
          setImportSessionId(loadedSessions[0]._id);
        }
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

  // Helper to normalize and map parsed row keys to student objects
  const normalizeStudentRows = (rows) => {
    return rows
      .map((rawRow, idx) => {
        const cleanObj = {};
        Object.keys(rawRow).forEach((k) => {
          const cleanKey = k.toLowerCase().replace(/[\s_\-]+/g, '');
          cleanObj[cleanKey] = rawRow[k];
        });

        let firstName = (
          cleanObj.firstname ||
          cleanObj.studentfirstname ||
          cleanObj.first ||
          cleanObj.givenname ||
          ''
        ).toString().trim();

        let lastName = (
          cleanObj.lastname ||
          cleanObj.studentlastname ||
          cleanObj.last ||
          cleanObj.surname ||
          cleanObj.familyname ||
          ''
        ).toString().trim();

        if (!firstName && (cleanObj.name || cleanObj.studentname || cleanObj.fullname)) {
          const fullName = String(cleanObj.name || cleanObj.studentname || cleanObj.fullname).trim();
          const parts = fullName.split(/\s+/);
          if (parts.length > 1) {
            firstName = parts[0];
            lastName = parts.slice(1).join(' ');
          } else {
            firstName = parts[0];
            lastName = '';
          }
        }

        const rawGender = String(cleanObj.gender || cleanObj.sex || 'Male').trim().toLowerCase();
        let gender = 'Male';
        if (['f', 'female', 'girl'].includes(rawGender)) gender = 'Female';
        else if (['o', 'other'].includes(rawGender)) gender = 'Other';

        let dob = cleanObj.dateofbirth || cleanObj.dob || cleanObj.birthdate || '';
        if (dob instanceof Date) {
          dob = dob.toISOString().split('T')[0];
        } else if (typeof dob === 'string' && dob.trim()) {
          dob = dob.trim();
        } else {
          dob = '2012-01-01';
        }

        const rawBlood = String(cleanObj.bloodgroup || cleanObj.blood || 'Unknown').trim().toUpperCase();
        const validBloods = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
        const bloodGroup = validBloods.includes(rawBlood) ? rawBlood : 'Unknown';

        const className = String(cleanObj.class || cleanObj.classname || cleanObj.grade || '').trim();
        const sectionName = String(cleanObj.section || cleanObj.sectionname || cleanObj.sec || '').trim().replace(/^section\s+/i, '');
        const rollNumber = cleanObj.rollnumber || cleanObj.rollno || cleanObj.roll || '';
        const phone = String(cleanObj.phone || cleanObj.contact || cleanObj.mobile || cleanObj.phonenumber || '').trim();
        const email = String(cleanObj.email || cleanObj.emailaddress || '').trim();
        const fatherName = String(cleanObj.fathername || cleanObj.father || cleanObj.parentname || cleanObj.guardianname || '').trim();
        const fatherPhone = String(cleanObj.fatherphone || cleanObj.parentphone || phone || '').trim();
        const motherName = String(cleanObj.mothername || cleanObj.mother || '').trim();
        const address = String(cleanObj.address || cleanObj.street || '').trim();

        const isValid = Boolean(firstName);

        return {
          id: idx + 1,
          firstName,
          lastName,
          name: `${firstName} ${lastName}`.trim(),
          gender,
          dateOfBirth: dob,
          bloodGroup,
          class: className,
          section: sectionName,
          rollNumber: rollNumber ? Number(rollNumber) : '',
          phone,
          email,
          fatherName,
          fatherPhone,
          motherName,
          address,
          isValid,
          error: !firstName ? 'Missing first name' : null,
        };
      })
      .filter((s) => s.firstName || s.lastName || s.phone || s.class);
  };

  const handleDownloadTemplate = (format = 'csv') => {
    const sampleData = [
      {
        'First Name': 'Aarav',
        'Last Name': 'Sharma',
        'Gender': 'Male',
        'Date of Birth': '2012-05-15',
        'Blood Group': 'O+',
        'Class': 'Class 9',
        'Section': 'A',
        'Roll Number': 1,
        'Phone': '9876500001',
        'Email': 'aarav.sharma@example.com',
        'Father Name': 'Rajesh Sharma',
        'Father Phone': '9876500001',
        'Mother Name': 'Sunita Sharma',
        'Address': '123 Park Avenue',
      },
      {
        'First Name': 'Priya',
        'Last Name': 'Verma',
        'Gender': 'Female',
        'Date of Birth': '2012-08-20',
        'Blood Group': 'B+',
        'Class': 'Class 9',
        'Section': 'A',
        'Roll Number': 2,
        'Phone': '9876500002',
        'Email': 'priya.verma@example.com',
        'Father Name': 'Suresh Verma',
        'Father Phone': '9876500002',
        'Mother Name': 'Anita Verma',
        'Address': '456 Civil Lines',
      },
      {
        'First Name': 'Amit',
        'Last Name': 'Patel',
        'Gender': 'Male',
        'Date of Birth': '2012-03-10',
        'Blood Group': 'A+',
        'Class': 'Class 9',
        'Section': 'A',
        'Roll Number': 3,
        'Phone': '9876500003',
        'Email': 'amit.patel@example.com',
        'Father Name': 'Dinesh Patel',
        'Father Phone': '9876500003',
        'Mother Name': 'Geeta Patel',
        'Address': '789 MG Road',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Students_Template');

    if (format === 'csv') {
      XLSX.writeFile(wb, 'student_import_template.csv', { bookType: 'csv' });
    } else {
      XLSX.writeFile(wb, 'student_import_template.xlsx', { bookType: 'xlsx' });
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFileName(file.name);
    setImportError(null);
    setImportResults(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (json.length === 0) {
          setImportError('The uploaded file contains no data rows.');
          setParsedStudents([]);
          return;
        }

        const normalized = normalizeStudentRows(json);
        if (normalized.length === 0) {
          setImportError('Could not find any student rows in this file.');
        }
        setParsedStudents(normalized);
      } catch (err) {
        console.error('File parsing error:', err);
        setImportError('Failed to parse spreadsheet file: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handlePasteData = (text) => {
    setImportCsvText(text);
    setImportError(null);
    setImportResults(null);
    if (!text.trim()) {
      setParsedStudents([]);
      return;
    }
    try {
      const workbook = XLSX.read(text, { type: 'string' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const json = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
      const normalized = normalizeStudentRows(json);
      setParsedStudents(normalized);
    } catch (_) {
      // Fallback CSV parsing
      const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
      if (lines.length < 2) {
        setImportError('Please enter at least a header row and one student data row.');
        return;
      }
      const headers = lines[0].split(/[,\t]/).map((h) => h.trim().replace(/^["']|["']$/g, ''));
      const rows = lines.slice(1).map((line) => {
        const vals = line.split(/[,\t]/).map((v) => v.trim().replace(/^["']|["']$/g, ''));
        const obj = {};
        headers.forEach((h, idx) => {
          obj[h] = vals[idx] || '';
        });
        return obj;
      });
      const normalized = normalizeStudentRows(rows);
      setParsedStudents(normalized);
    }
  };

  const handleClearImport = () => {
    setParsedStudents([]);
    setImportFileName('');
    setImportCsvText('');
    setImportError(null);
    setImportResults(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleBulkImport = async (e) => {
    if (e) e.preventDefault();
    if (parsedStudents.length === 0) {
      setImportError('Please upload a file or paste student records to import.');
      return;
    }

    const validStudents = parsedStudents.filter((s) => s.isValid);
    if (validStudents.length === 0) {
      setImportError('No valid student rows found. Each student row must contain at least a First Name.');
      return;
    }

    setIsImporting(true);
    setImportError(null);
    setImportResults(null);

    try {
      const payload = {
        students: validStudents,
        academicSessionId: importSessionId || undefined,
        defaultClassId: importClassId || undefined,
        defaultSectionId: importSectionId || undefined,
        autoAssignRollNumber,
      };

      const res = await studentService.bulkImportStudents(payload);
      if (res.success && res.data) {
        setImportResults(res.data);
        fetchStudents(1);
      } else {
        setImportError(res.message || 'Import failed. Please try again.');
      }
    } catch (err) {
      console.error('Import failure:', err);
      setImportError(err.message || 'Failed to process bulk student import.');
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

      const res = await studentService.createStudent(payload);
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
      if (res.data) {
        setEnrollmentSuccessData(res.data);
      }
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
          <Button
            variant="outline"
            size="sm"
            icon={FileSpreadsheet}
            onClick={() => {
              setIsImportModalOpen(true);
              handleClearImport();
            }}
          >
            Import Students
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

      {/* BULK IMPORT STUDENTS MODAL */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => {
          setIsImportModalOpen(false);
          handleClearImport();
        }}
        title="Import Students"
        subtitle="Upload a CSV or Excel spreadsheet (.xlsx, .xls) to enroll multiple new students at once."
        maxWidth="max-w-4xl"
      >
        <div className="space-y-4 text-xs">
          {/* Template Download Banner */}
          <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl mt-0.5">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-800 text-xs">Download Spreadsheet Template</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Pre-configured with student and parent column headers and sample rows. Open in Excel, fill, and upload.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="xs"
                icon={FileSpreadsheet}
                onClick={() => handleDownloadTemplate('xlsx')}
                className="bg-white hover:bg-slate-50"
              >
                Template (.xlsx)
              </Button>
              <Button
                type="button"
                variant="outline"
                size="xs"
                icon={Download}
                onClick={() => handleDownloadTemplate('csv')}
                className="bg-white hover:bg-slate-50"
              >
                Template (.csv)
              </Button>
            </div>
          </div>

          {/* Academic Placement Defaults */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-3.5 space-y-3">
            <div className="text-xs font-semibold text-slate-700 flex items-center justify-between">
              <span>Placement & Session Defaults</span>
              <span className="text-[11px] font-normal text-slate-400">Class & Section can also be specified per row</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Target Academic Session *</label>
                <select
                  value={importSessionId}
                  onChange={(e) => setImportSessionId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  {sessions.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} {s.isCurrent ? '★ (Active)' : `(${s.status || 'Past'})`}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">Default Class (Optional)</label>
                <select
                  value={importClassId}
                  onChange={(e) => {
                    setImportClassId(e.target.value);
                    setImportSectionId('');
                  }}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">Choose Class (if not in file)...</option>
                  {classes.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">Default Section (Optional)</label>
                <select
                  disabled={!importClassId}
                  value={importSectionId}
                  onChange={(e) => setImportSectionId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">Choose Section (if not in file)...</option>
                  {sections
                    .filter((s) => s.classId?._id === importClassId || s.classId === importClassId)
                    .map((sec) => (
                      <option key={sec._id} value={sec._id}>Section {sec.name}</option>
                    ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="auto-assign-roll"
                checked={autoAssignRollNumber}
                onChange={(e) => setAutoAssignRollNumber(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500/20 border-slate-300 cursor-pointer"
              />
              <label htmlFor="auto-assign-roll" className="text-xs text-slate-600 cursor-pointer select-none">
                Automatically assign next available roll number if blank or taken
              </label>
            </div>
          </div>

          {/* Import Results Card */}
          {importResults && (
            <div className="p-4 rounded-2xl border space-y-4 bg-emerald-50/70 border-emerald-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 text-emerald-800 font-semibold text-xs">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>
                    Import Complete! Enrolled {importResults.importedCount} student{importResults.importedCount !== 1 ? 's' : ''} & auto-generated student and father login credentials.
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {importResults.imported?.length > 0 && (
                    <Button
                      type="button"
                      variant="primary"
                      size="xs"
                      icon={Download}
                      onClick={() => handleDownloadCredentialsCsv(importResults.imported)}
                    >
                      Export Credentials (.csv)
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="secondary"
                    size="xs"
                    onClick={() => {
                      setIsImportModalOpen(false);
                      handleClearImport();
                    }}
                  >
                    Close & View Directory
                  </Button>
                </div>
              </div>

              {/* Generated Credentials Preview Table */}
              {importResults.imported?.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-indigo-600" /> Auto-Generated System Login Credentials
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Default passwords: First Name with first letter capital + @12345 (e.g. <code className="font-mono text-indigo-600 font-bold">Ravi@12345</code>)
                    </span>
                  </div>

                  <div className="border border-emerald-200/80 rounded-xl overflow-hidden max-h-60 overflow-y-auto bg-white">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead className="bg-emerald-100/60 border-b border-emerald-200 text-slate-700 sticky top-0">
                        <tr>
                          <th className="py-2 px-2.5 font-semibold">Student Name</th>
                          <th className="py-2 px-2.5 font-semibold">Class / Roll</th>
                          <th className="py-2 px-2.5 font-semibold text-indigo-700">Student Login</th>
                          <th className="py-2 px-2.5 font-semibold">Father Name</th>
                          <th className="py-2 px-2.5 font-semibold text-emerald-800">Father Login</th>
                          <th className="py-2 px-2.5 font-semibold text-right">Copy</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {importResults.imported.map((s, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/60">
                            <td className="py-2 px-2.5 font-medium text-slate-800">{s.name}</td>
                            <td className="py-2 px-2.5 text-slate-600">
                              {s.class} ({s.section}) • Roll #{s.rollNumber}
                            </td>
                            <td className="py-2 px-2.5 font-mono text-xs">
                              <span className="font-bold text-indigo-600">{s.studentUsername || (s.name || 'stu').split(' ')[0].toLowerCase()}</span>
                              <span className="text-[10px] text-slate-400 ml-1.5 font-normal">({s.studentPassword || `${(s.name || 'Student').split(' ')[0]}@12345`})</span>
                            </td>
                            <td className="py-2 px-2.5 text-slate-700 font-medium">{s.fatherName || 'Parent'}</td>
                            <td className="py-2 px-2.5 font-mono text-xs">
                              <span className="font-bold text-emerald-700">{s.fatherUsername || (s.fatherName || 'parent').split(' ')[0].toLowerCase()}</span>
                              <span className="text-[10px] text-slate-400 ml-1.5 font-normal">({s.fatherPassword || `${(s.fatherName || 'Parent').split(' ')[0]}@12345`})</span>
                              {s.isExistingParentAccount && (
                                <span className="ml-1 text-[10px] text-slate-400 font-normal">(Existing)</span>
                              )}
                            </td>
                            <td className="py-2 px-2.5 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  const stuPass = s.studentPassword || `${(s.name || 'Student').split(' ')[0]}@12345`;
                                  const parPass = s.fatherPassword || `${(s.fatherName || 'Parent').split(' ')[0]}@12345`;
                                  const text = `Student: ${s.name} | Login: ${s.studentUsername} (Pass: ${stuPass})\nFather: ${s.fatherName} | Login: ${s.fatherUsername} (Pass: ${parPass})`;
                                  handleCopyText(text, `row_${idx}`);
                                }}
                                className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
                                title="Copy Credentials"
                              >
                                {copiedKey === `row_${idx}` ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {importResults.failedCount > 0 && (
                <div className="mt-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
                  <p className="font-semibold mb-1">
                    {importResults.failedCount} row{importResults.failedCount !== 1 ? 's' : ''} could not be imported:
                  </p>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                    {importResults.errors.map((err, idx) => (
                      <li key={idx}>
                        <strong>Row {err.row} ({err.name}):</strong> {err.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Input Method Tabs */}
          {!importResults && (
            <>
              <div className="flex items-center border-b border-slate-200 gap-6 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setImportTab('file')}
                  className={`pb-2.5 transition-colors relative flex items-center gap-2 cursor-pointer ${
                    importTab === 'file'
                      ? 'text-indigo-600 border-b-2 border-indigo-600'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <FileUp className="w-4 h-4" />
                  Upload Spreadsheet (.csv / .xlsx)
                </button>
                <button
                  type="button"
                  onClick={() => setImportTab('paste')}
                  className={`pb-2.5 transition-colors relative flex items-center gap-2 cursor-pointer ${
                    importTab === 'paste'
                      ? 'text-indigo-600 border-b-2 border-indigo-600'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Paste CSV / Text Data
                </button>
              </div>

              {/* Tab 1: File Upload */}
              {importTab === 'file' && (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv, .xlsx, .xls, text/csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="import-student-file-input"
                  />

                  {importFileName ? (
                    <div className="p-4 bg-indigo-50/50 border border-indigo-200 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-xl">
                          <FileSpreadsheet className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 text-xs">{importFileName}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {parsedStudents.length} student record{parsedStudents.length !== 1 ? 's' : ''} detected
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        icon={Trash2}
                        onClick={handleClearImport}
                        className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                      >
                        Remove File
                      </Button>
                    </div>
                  ) : (
                    <label
                      htmlFor="import-student-file-input"
                      className="border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50/50 hover:bg-indigo-50/20 transition-all rounded-2xl p-7 flex flex-col items-center justify-center text-center cursor-pointer group"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 group-hover:bg-indigo-100 text-indigo-600 flex items-center justify-center mb-3 transition-colors">
                        <FileUp className="w-6 h-6" />
                      </div>
                      <p className="text-xs font-semibold text-slate-700">
                        Click to browse or drag and drop your spreadsheet here
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Compatible with Microsoft Excel (.xlsx, .xls) and Comma-Separated Values (.csv)
                      </p>
                    </label>
                  )}
                </div>
              )}

              {/* Tab 2: Paste CSV */}
              {importTab === 'paste' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-600">
                      Paste CSV rows (first row must be column headers)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const sampleText =
                          `First Name,Last Name,Gender,Date of Birth,Class,Section,Roll Number,Phone,Father Name\n` +
                          `Rohan,Sharma,Male,2012-05-15,Class 9,A,11,9876500011,Rajesh Sharma\n` +
                          `Priya,Verma,Female,2012-08-20,Class 9,A,12,9876500012,Suresh Verma\n` +
                          `Amit,Patel,Male,2012-03-10,Class 9,A,13,9876500013,Dinesh Patel`;
                        handlePasteData(sampleText);
                      }}
                      className="text-indigo-600 hover:text-indigo-800 font-medium text-[11px] underline cursor-pointer"
                    >
                      Load Sample Paste Data
                    </button>
                  </div>
                  <textarea
                    rows={5}
                    value={importCsvText}
                    onChange={(e) => handlePasteData(e.target.value)}
                    placeholder="First Name,Last Name,Gender,Date of Birth,Class,Section,Roll Number,Phone,Father Name&#10;Rahul,Kumar,Male,2012-04-10,Class 9,A,14,9876543210,Santosh Kumar"
                    className="w-full font-mono text-[11px] p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              )}

              {/* Error Message */}
              {importError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{importError}</span>
                </div>
              )}

              {/* Parsed Data Preview */}
              {parsedStudents.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="font-semibold text-slate-700 flex items-center gap-2">
                      <span>Data Preview</span>
                      <Badge variant="primary" size="xs">
                        {parsedStudents.length} student{parsedStudents.length !== 1 ? 's' : ''} detected
                      </Badge>
                    </div>
                    <button
                      type="button"
                      onClick={handleClearImport}
                      className="text-slate-400 hover:text-slate-600 text-[11px] cursor-pointer"
                    >
                      Clear Data
                    </button>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 sticky top-0">
                        <tr>
                          <th className="py-2 px-2.5 font-semibold">#</th>
                          <th className="py-2 px-2.5 font-semibold">Name</th>
                          <th className="py-2 px-2.5 font-semibold">Gender</th>
                          <th className="py-2 px-2.5 font-semibold">DOB</th>
                          <th className="py-2 px-2.5 font-semibold">Class / Sec</th>
                          <th className="py-2 px-2.5 font-semibold">Roll</th>
                          <th className="py-2 px-2.5 font-semibold">Phone</th>
                          <th className="py-2 px-2.5 font-semibold">Parent</th>
                          <th className="py-2 px-2.5 font-semibold text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {parsedStudents.map((s, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/60">
                            <td className="py-2 px-2.5 text-slate-400 font-mono">{idx + 1}</td>
                            <td className="py-2 px-2.5 font-medium text-slate-800">
                              {s.name || <span className="text-rose-500 italic">Missing</span>}
                            </td>
                            <td className="py-2 px-2.5 text-slate-600">{s.gender}</td>
                            <td className="py-2 px-2.5 text-slate-600 font-mono text-[10px]">{s.dateOfBirth}</td>
                            <td className="py-2 px-2.5 text-slate-600">
                              {s.class || (importClassId ? classes.find((c) => c._id === importClassId)?.name : '-')}{' '}
                              {s.section ? `(${s.section})` : (importSectionId ? `(${sections.find((sec) => sec._id === importSectionId)?.name})` : '')}
                            </td>
                            <td className="py-2 px-2.5 text-slate-600 font-mono">
                              {s.rollNumber || <span className="text-slate-400 italic">Auto</span>}
                            </td>
                            <td className="py-2 px-2.5 text-slate-600">{s.phone || '-'}</td>
                            <td className="py-2 px-2.5 text-slate-600">{s.fatherName || '-'}</td>
                            <td className="py-2 px-2.5 text-right">
                              {s.isValid ? (
                                <Badge variant="success" size="xs">Ready</Badge>
                              ) : (
                                <Badge variant="danger" size="xs">{s.error || 'Invalid'}</Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Modal Footer */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <div>
              {parsedStudents.length > 0 && !importResults && (
                <span className="text-[11px] text-slate-500">
                  {parsedStudents.filter((s) => s.isValid).length} student{parsedStudents.filter((s) => s.isValid).length !== 1 ? 's' : ''} ready to enroll
                </span>
              )}
            </div>
            <div className="flex items-center gap-2.5">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  setIsImportModalOpen(false);
                  handleClearImport();
                }}
              >
                {importResults ? 'Close' : 'Cancel'}
              </Button>

              {!importResults && (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  icon={Upload}
                  isLoading={isImporting}
                  disabled={isImporting || parsedStudents.length === 0}
                  onClick={handleBulkImport}
                >
                  {isImporting
                    ? 'Enrolling Students...'
                    : `Import ${parsedStudents.length > 0 ? `${parsedStudents.filter((s) => s.isValid).length} ` : ''}Student${parsedStudents.filter((s) => s.isValid).length !== 1 ? 's' : ''}`}
                </Button>
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* SINGLE STUDENT ENROLLMENT SUCCESS & CREDENTIALS MODAL */}
      <Modal
        isOpen={!!enrollmentSuccessData}
        onClose={() => setEnrollmentSuccessData(null)}
        title="Student Enrolled & Credentials Generated"
        subtitle="System login accounts have been automatically created for both the student and their father/guardian."
        maxWidth="max-w-xl"
      >
        {enrollmentSuccessData && (
          <div className="space-y-4 text-xs">
            {/* Success Banner */}
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-emerald-900 text-xs">
                  {enrollmentSuccessData.student?.fullName || `${enrollmentSuccessData.student?.firstName} ${enrollmentSuccessData.student?.lastName}`} enrolled successfully!
                </p>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  ID: <span className="font-mono font-bold">{enrollmentSuccessData.student?.studentId}</span> • Class: {enrollmentSuccessData.student?.classId?.name || ''} ({enrollmentSuccessData.student?.sectionId?.name || ''}) • Roll #{enrollmentSuccessData.student?.rollNumber}
                </p>
              </div>
            </div>

            {/* Credentials Grid */}
            <div className="space-y-3">
              {/* Student Credentials */}
              <div className="p-3.5 bg-indigo-50/60 border border-indigo-200/80 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-900 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-indigo-600" /> Student Portal Login Credentials
                  </span>
                  <Badge variant="primary" size="xs">STUDENT PORTAL</Badge>
                </div>
                <div className="bg-white p-3 rounded-xl border border-indigo-100 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-[11px] text-slate-400">Login Username</p>
                    <p className="font-mono font-bold text-indigo-600 text-xs">
                      {enrollmentSuccessData.credentials?.studentCredentials?.username || enrollmentSuccessData.student?.studentId?.toLowerCase()}
                    </p>
                  </div>
                  <div className="space-y-0.5 text-right">
                    <p className="text-[11px] text-slate-400">Default Password</p>
                    <p className="font-mono font-bold text-slate-700 text-xs">
                      {enrollmentSuccessData.credentials?.studentCredentials?.password ||
                        `${(enrollmentSuccessData.student?.firstName || 'Student')}@12345`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Father Credentials */}
              <div className="p-3.5 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-emerald-600" /> Father / Guardian Login Credentials
                  </span>
                  <Badge variant="success" size="xs">PARENT PORTAL</Badge>
                </div>
                <div className="bg-white p-3 rounded-xl border border-emerald-100 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-[11px] text-slate-400">
                      {enrollmentSuccessData.student?.parentId?.fatherName ? `${enrollmentSuccessData.student.parentId.fatherName} (Username)` : 'Father Username'}
                    </p>
                    <p className="font-mono font-bold text-emerald-700 text-xs">
                      {enrollmentSuccessData.credentials?.parentCredentials?.username || 'parent'}
                      {enrollmentSuccessData.credentials?.parentCredentials?.isNew === false && (
                        <span className="ml-1 text-[10px] text-slate-400 font-normal">(Existing Account)</span>
                      )}
                    </p>
                  </div>
                  <div className="space-y-0.5 text-right">
                    <p className="text-[11px] text-slate-400">Default Password</p>
                    <p className="font-mono font-bold text-slate-700 text-xs">
                      {enrollmentSuccessData.credentials?.parentCredentials?.password ||
                        (enrollmentSuccessData.student?.parentId?.fatherName
                          ? `${enrollmentSuccessData.student.parentId.fatherName.trim().split(' ')[0]}@12345`
                          : 'Parent@12345')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <Button
                type="button"
                variant="outline"
                size="xs"
                icon={copiedKey === 'enroll_single' ? Check : Copy}
                onClick={() => {
                  const s = enrollmentSuccessData.student;
                  const c = enrollmentSuccessData.credentials;
                  const sPass =
                    c?.studentCredentials?.password || `${(s?.firstName || 'Student')}@12345`;
                  const pPass =
                    c?.parentCredentials?.password ||
                    (s?.parentId?.fatherName
                      ? `${s.parentId.fatherName.trim().split(' ')[0]}@12345`
                      : 'Parent@12345');
                  const text = `NexSchool ERP Login Credentials\n\nStudent: ${s?.fullName || `${s?.firstName} ${s?.lastName}`}\nUsername: ${c?.studentCredentials?.username || s?.studentId?.toLowerCase()}\nPassword: ${sPass}\nPortal: ${window.location.origin}/login\n\nFather: ${s?.parentId?.fatherName || 'Parent'}\nUsername: ${c?.parentCredentials?.username}\nPassword: ${pPass}\nPortal: ${window.location.origin}/login`;
                  handleCopyText(text, 'enroll_single');
                }}
              >
                {copiedKey === 'enroll_single' ? 'Credentials Copied!' : 'Copy Credentials for WhatsApp/SMS'}
              </Button>

              <div className="flex items-center gap-2 justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  size="xs"
                  onClick={() => setEnrollmentSuccessData(null)}
                >
                  Close
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="xs"
                  icon={ExternalLink}
                  onClick={() => {
                    const sid = enrollmentSuccessData.student?._id;
                    setEnrollmentSuccessData(null);
                    if (sid) navigate(`/students/${sid}`);
                  }}
                >
                  View Full Profile
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default StudentsPage;
