import React, { useState, useEffect, useMemo } from 'react';
import {
  CalendarCheck,
  Clock,
  BookOpen,
  Award,
  Plus,
  Save,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileCheck,
  ChevronRight,
  TrendingUp,
  Download,
  FileText,
  Calendar,
  Upload,
  Sparkles,
  LayoutGrid,
  CalendarDays,
  RefreshCw,
  ChevronLeft,
  Edit3,
  Trash2,
  Copy,
  PlusCircle,
  CalendarPlus,
  Check,
  Eye,
  Printer,
} from 'lucide-react';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';
import Modal from '../../components/common/Modal.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import academicsService from '../../services/academicsService.js';
import adminService from '../../services/adminService.js';
import { useAuth } from '../../context/AuthContext.jsx';

export const AcademicsPage = () => {
  const { user } = useAuth();
  const isStudent = user?.role?.name === 'STUDENT';
  const [activeTab, setActiveTab] = useState(isStudent ? 'timetable' : 'attendance');
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filter selections
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');

  // 1. ATTENDANCE STATE
  const [attendanceDate, setAttendanceDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [attendanceRoster, setAttendanceRoster] = useState([]);
  const [isSavingAttendance, setIsSavingAttendance] = useState(false);

  // 2. TIMETABLE STATE
  const [selectedDay, setSelectedDay] = useState(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const cur = days[new Date().getDay()];
    return cur === 'Sunday' ? 'Monday' : cur;
  });
  const [timetableDate, setTimetableDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [timetableViewMode, setTimetableViewMode] = useState('daily'); // 'daily' | 'matrix'
  const [timetableData, setTimetableData] = useState([]);
  const [weeklyMatrixData, setWeeklyMatrixData] = useState([]);

  // PDF Extraction state
  const [isExtractModalOpen, setIsExtractModalOpen] = useState(false);
  const [extractingPdf, setExtractingPdf] = useState(false);
  const [extractSuccessMsg, setExtractSuccessMsg] = useState('');
  const [selectedPdfFile, setSelectedPdfFile] = useState(null);
  const [saveExtractedToDb, setSaveExtractedToDb] = useState(false);

  // Timetable Designer & Bulk Day Replicator State
  const [isDesignerModalOpen, setIsDesignerModalOpen] = useState(false);
  const [designerPeriods, setDesignerPeriods] = useState([]);
  const [designerTargetDays, setDesignerTargetDays] = useState(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
  const [teachersList, setTeachersList] = useState([]);
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);
  const [designerError, setDesignerError] = useState('');

  // 3. HOMEWORK STATE
  const [homeworkList, setHomeworkList] = useState([]);
  const [isHwModalOpen, setIsHwModalOpen] = useState(false);
  const [editingHwId, setEditingHwId] = useState(null);
  const [isSubmittingHw, setIsSubmittingHw] = useState(false);
  const [hwActionMsg, setHwActionMsg] = useState('');
  const [hwForm, setHwForm] = useState({
    title: '',
    description: '',
    subjectId: '',
    dueDate: '',
    maxMarks: 50,
    attachmentTitle: '',
    attachmentUrl: '',
  });

  // 4. EXAMS & MARKS STATE
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedExamSubjectId, setSelectedExamSubjectId] = useState('');
  const [marksheet, setMarksheet] = useState([]);
  const [isSavingMarks, setIsSavingMarks] = useState(false);
  const [isMarksheetPreviewOpen, setIsMarksheetPreviewOpen] = useState(false);

  // 5. CONSOLIDATED CLASS RESULTS & REPORT CARDS STATE
  const [examSubMode, setExamSubMode] = useState('subject'); // 'subject' | 'consolidated'
  const [consolidatedData, setConsolidatedData] = useState({ subjects: [], students: [], classStats: {} });
  const [loadingConsolidated, setLoadingConsolidated] = useState(false);
  const [isCompilingClass, setIsCompilingClass] = useState(false);
  const [studentReviews, setStudentReviews] = useState({});
  const [selectedStudentReport, setSelectedStudentReport] = useState(null);
  const [isStudentReportModalOpen, setIsStudentReportModalOpen] = useState(false);
  const [loadingStudentReport, setLoadingStudentReport] = useState(false);
  const [isSavingStudentReview, setIsSavingStudentReview] = useState(false);
  const [isBroadsheetPreviewOpen, setIsBroadsheetPreviewOpen] = useState(false);

  // Load common metadata (classes, sections, subjects, teachers)
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [clsRes, secRes, subRes, exRes, tchRes] = await Promise.all([
          adminService.getClasses(),
          adminService.getSections(),
          adminService.getSubjects(),
          academicsService.getExams().catch(() => ({ data: [] })),
          academicsService.getTeachers().catch(() => ({ data: [] })),
        ]);
        setClasses(clsRes.data || []);
        setSections(secRes.data || []);
        setSubjects(subRes.data || []);
        setExams(exRes.data || []);
        setTeachersList(tchRes.data || []);

        if (clsRes.data?.length > 0) {
          setSelectedClassId(clsRes.data[0]._id);
        }
        if (exRes.data?.length > 0) {
          setSelectedExamId((prev) => prev || exRes.data[0]._id);
        }
      } catch (e) {
        console.error('Failed to load academic metadata', e);
      }
    };
    fetchMetadata();
  }, []);

  // Update sections when selected class changes
  useEffect(() => {
    if (selectedClassId) {
      const classSecs = sections.filter(
        (s) => s.classId?._id === selectedClassId || s.classId === selectedClassId
      );
      if (classSecs.length > 0) {
        setSelectedSectionId(classSecs[0]._id);
      } else {
        setSelectedSectionId('');
      }
    }
  }, [selectedClassId, sections]);

  // Load Attendance when Class, Section, or Date changes
  useEffect(() => {
    if (activeTab === 'attendance' && selectedClassId && selectedSectionId) {
      fetchAttendance();
    }
  }, [activeTab, selectedClassId, selectedSectionId, attendanceDate]);

  const fetchAttendance = async () => {
    if (isStudent) return;
    setLoading(true);
    try {
      const res = await academicsService.getClassAttendanceRegister({
        classId: selectedClassId,
        sectionId: selectedSectionId,
        date: attendanceDate,
      });
      if (res.success && res.data) {
        setAttendanceRoster(res.data.roster || []);
      }
    } catch (err) {
      console.error('Failed to load attendance', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = (index, newStatus) => {
    const updated = [...attendanceRoster];
    updated[index].status = newStatus;
    setAttendanceRoster(updated);
  };

  const handleMarkAllPresent = () => {
    const updated = attendanceRoster.map((item) => ({ ...item, status: 'Present' }));
    setAttendanceRoster(updated);
  };

  const handleSaveAttendance = async () => {
    setIsSavingAttendance(true);
    try {
      const entries = attendanceRoster.map((r) => ({
        studentId: r.student._id,
        status: r.status,
        remarks: r.remarks,
      }));

      await academicsService.saveClassAttendance({
        classId: selectedClassId,
        sectionId: selectedSectionId,
        date: attendanceDate,
        entries,
      });

      alert('Daily attendance register saved successfully!');
      fetchAttendance();
    } catch (e) {
      alert(e.message || 'Failed to save attendance');
    } finally {
      setIsSavingAttendance(false);
    }
  };

  // Load Timetable (Daily or Weekly Matrix)
  useEffect(() => {
    if (activeTab === 'timetable' && selectedClassId && selectedSectionId) {
      if (timetableViewMode === 'daily') {
        fetchTimetable();
      } else {
        fetchWeeklyMatrix();
      }
    }
  }, [activeTab, selectedClassId, selectedSectionId, selectedDay, timetableViewMode]);

  const fetchTimetable = async () => {
    try {
      const res = await academicsService.getTimetable({
        classId: selectedClassId,
        sectionId: selectedSectionId,
        dayOfWeek: selectedDay,
      });
      if (res.success && res.data && res.data.length > 0) {
        setTimetableData(res.data[0].periods || []);
      } else {
        setTimetableData([]);
      }
    } catch (e) {
      console.error('Failed to load timetable', e);
    }
  };

  const fetchWeeklyMatrix = async () => {
    try {
      const res = await academicsService.getTimetable({
        classId: selectedClassId,
        sectionId: selectedSectionId,
      });
      if (res.success && Array.isArray(res.data)) {
        setWeeklyMatrixData(res.data);
      } else {
        setWeeklyMatrixData([]);
      }
    } catch (e) {
      console.error('Failed to load weekly matrix timetable', e);
    }
  };

  const handleTimetableDateChange = (newDateStr) => {
    setTimetableDate(newDateStr);
    const dateObj = new Date(newDateStr + 'T00:00:00');
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const day = days[dateObj.getDay()];
    setSelectedDay(day);
  };

  const shiftDate = (offsetDays) => {
    const cur = new Date(timetableDate + 'T00:00:00');
    cur.setDate(cur.getDate() + offsetDays);
    const newStr = cur.toISOString().split('T')[0];
    handleTimetableDateChange(newStr);
  };

  const formattedTimetableDate = useMemo(() => {
    if (!timetableDate) return '';
    const d = new Date(timetableDate + 'T00:00:00');
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }, [timetableDate]);

  const handleExtractPdfSubmit = async (e) => {
    e.preventDefault();
    setExtractingPdf(true);
    setExtractSuccessMsg('');
    try {
      let fileBase64 = null;
      let filePath = null;

      if (selectedPdfFile) {
        fileBase64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(selectedPdfFile);
        });
      } else {
        filePath = '/documents/Grade10_Academic_Master_Timetable.pdf';
      }

      const res = await academicsService.extractTimetableFromPdf({
        fileBase64,
        filePath,
        classId: selectedClassId,
        sectionId: selectedSectionId,
        dayOfWeek: selectedDay,
        saveToDatabase: saveExtractedToDb,
      });

      if (res.success && res.data) {
        if (Array.isArray(res.data.periods) && res.data.periods.length > 0) {
          setTimetableData(res.data.periods);
        }
        setExtractSuccessMsg(
          `✓ Successfully extracted ${res.data.totalExtracted || res.data.periods.length} periods from Timetable PDF!`
        );
        setIsExtractModalOpen(false);
        setSelectedPdfFile(null);
        fetchTimetable();
        fetchWeeklyMatrix();
      }
    } catch (err) {
      alert(err.message || 'Failed to extract timetable from PDF');
    } finally {
      setExtractingPdf(false);
    }
  };

  // Preset Timetable Templates
  const getStandard8Periods = () => [
    { periodNumber: 1, startTime: '08:30 AM', endTime: '09:15 AM', subjectId: '', subjectName: 'Mathematics', teacherId: '', teacherName: '', roomNumber: 'Room 204', isBreak: false },
    { periodNumber: 2, startTime: '09:15 AM', endTime: '10:00 AM', subjectId: '', subjectName: 'General Science', teacherId: '', teacherName: '', roomNumber: 'Room 204', isBreak: false },
    { periodNumber: 3, startTime: '10:00 AM', endTime: '10:45 AM', subjectId: '', subjectName: 'English Literature', teacherId: '', teacherName: '', roomNumber: 'Room 204', isBreak: false },
    { periodNumber: 4, startTime: '10:45 AM', endTime: '11:15 AM', subjectId: '', subjectName: 'Break Time', teacherId: '', teacherName: 'N/A', roomNumber: 'Cafeteria / Courtyard', isBreak: true },
    { periodNumber: 5, startTime: '11:15 AM', endTime: '12:00 PM', subjectId: '', subjectName: 'Social Studies', teacherId: '', teacherName: '', roomNumber: 'Room 204', isBreak: false },
    { periodNumber: 6, startTime: '12:00 PM', endTime: '12:45 PM', subjectId: '', subjectName: 'Computer Science', teacherId: '', teacherName: '', roomNumber: 'ICT Lab A', isBreak: false },
    { periodNumber: 7, startTime: '12:45 PM', endTime: '01:30 PM', subjectId: '', subjectName: 'Physical Education', teacherId: '', teacherName: '', roomNumber: 'School Grounds', isBreak: false },
    { periodNumber: 8, startTime: '01:30 PM', endTime: '02:15 PM', subjectId: '', subjectName: 'Arts & Music', teacherId: '', teacherName: '', roomNumber: 'Music Hall', isBreak: false },
  ];

  const getStandard6Periods = () => [
    { periodNumber: 1, startTime: '08:30 AM', endTime: '09:15 AM', subjectId: '', subjectName: 'Mathematics', teacherId: '', teacherName: '', roomNumber: 'Room 204', isBreak: false },
    { periodNumber: 2, startTime: '09:15 AM', endTime: '10:00 AM', subjectId: '', subjectName: 'General Science', teacherId: '', teacherName: '', roomNumber: 'Room 204', isBreak: false },
    { periodNumber: 3, startTime: '10:00 AM', endTime: '10:30 AM', subjectId: '', subjectName: 'Break Time', teacherId: '', teacherName: 'N/A', roomNumber: 'Cafeteria', isBreak: true },
    { periodNumber: 4, startTime: '10:30 AM', endTime: '11:15 AM', subjectId: '', subjectName: 'English Literature', teacherId: '', teacherName: '', roomNumber: 'Room 204', isBreak: false },
    { periodNumber: 5, startTime: '11:15 AM', endTime: '12:00 PM', subjectId: '', subjectName: 'Social Studies', teacherId: '', teacherName: '', roomNumber: 'Room 204', isBreak: false },
    { periodNumber: 6, startTime: '12:00 PM', endTime: '12:45 PM', subjectId: '', subjectName: 'Computer Science', teacherId: '', teacherName: '', roomNumber: 'ICT Lab A', isBreak: false },
  ];

  const handleOpenDesigner = () => {
    setDesignerError('');
    if (timetableData && timetableData.length > 0) {
      const mapped = timetableData.map((p, idx) => ({
        periodNumber: p.periodNumber || (idx + 1),
        startTime: p.startTime || '08:30 AM',
        endTime: p.endTime || '09:15 AM',
        subjectId: p.subjectId?._id || p.subjectId || '',
        subjectName: p.subjectId?.name || p.subjectName || '',
        teacherId: p.teacherId?._id || p.teacherId || '',
        teacherName: p.teacherId ? `${p.teacherId.firstName} ${p.teacherId.lastName}` : (p.teacherName || ''),
        roomNumber: p.roomNumber || (p.isBreak ? 'Cafeteria / Courtyard' : 'Room 204'),
        isBreak: !!p.isBreak,
      }));
      setDesignerPeriods(mapped);
    } else {
      setDesignerPeriods(getStandard8Periods());
    }

    if (selectedDay && selectedDay !== 'Sunday') {
      setDesignerTargetDays([selectedDay]);
    } else {
      setDesignerTargetDays(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
    }

    setIsDesignerModalOpen(true);
  };

  const handleAddDesignerPeriod = () => {
    const nextNum = designerPeriods.length + 1;
    setDesignerPeriods((prev) => [
      ...prev,
      {
        periodNumber: nextNum,
        startTime: '01:30 PM',
        endTime: '02:15 PM',
        subjectId: '',
        subjectName: '',
        teacherId: '',
        teacherName: '',
        roomNumber: 'Room 204',
        isBreak: false,
      },
    ]);
  };

  const handleRemoveDesignerPeriod = (index) => {
    setDesignerPeriods((prev) => {
      const filtered = prev.filter((_, i) => i !== index);
      return filtered.map((p, i) => ({ ...p, periodNumber: i + 1 }));
    });
  };

  const handleDesignerPeriodChange = (index, field, value) => {
    setDesignerPeriods((prev) => {
      const copy = [...prev];
      const target = { ...copy[index] };

      if (field === 'isBreak') {
        target.isBreak = value;
        if (value) {
          target.subjectId = '';
          target.subjectName = 'Break Time';
          target.teacherId = '';
          target.teacherName = 'N/A';
          target.roomNumber = 'Cafeteria / Courtyard';
        } else {
          target.subjectName = '';
          target.teacherName = '';
          target.roomNumber = 'Room 204';
        }
      } else if (field === 'subjectId') {
        target.subjectId = value;
        const matched = subjects.find((s) => s._id === value);
        if (matched) {
          target.subjectName = matched.name;
        }
      } else if (field === 'teacherId') {
        target.teacherId = value;
        const matched = teachersList.find((t) => t._id === value);
        if (matched) {
          target.teacherName = `${matched.firstName} ${matched.lastName}`;
        }
      } else {
        target[field] = value;
      }

      copy[index] = target;
      return copy;
    });
  };

  const toggleTargetDay = (day) => {
    setDesignerTargetDays((prev) => {
      if (prev.includes(day)) {
        if (prev.length === 1) return prev; // Keep at least one day
        return prev.filter((d) => d !== day);
      } else {
        return [...prev, day];
      }
    });
  };

  const handleSaveDesignerSchedule = async (e) => {
    e?.preventDefault();
    if (designerTargetDays.length === 0) {
      setDesignerError('Please select at least one day to apply this timetable to.');
      return;
    }
    if (designerPeriods.length === 0) {
      setDesignerError('Please add at least one period to your schedule routine.');
      return;
    }

    setIsSavingSchedule(true);
    setDesignerError('');

    try {
      const res = await academicsService.saveTimetableDay({
        classId: selectedClassId,
        sectionId: selectedSectionId,
        days: designerTargetDays,
        periods: designerPeriods,
      });

      if (res.success) {
        setExtractSuccessMsg(
          `✓ Timetable schedule successfully saved and applied to ${designerTargetDays.join(', ')}!`
        );
        setIsDesignerModalOpen(false);
        fetchTimetable();
        fetchWeeklyMatrix();
      }
    } catch (err) {
      setDesignerError(err.message || 'Failed to save timetable schedule');
    } finally {
      setIsSavingSchedule(false);
    }
  };

  // Load Homework
  useEffect(() => {
    if (activeTab === 'homework' && selectedClassId && selectedSectionId) {
      fetchHomework();
    }
  }, [activeTab, selectedClassId, selectedSectionId]);

  const fetchHomework = async () => {
    try {
      const res = await academicsService.getHomeworkList({
        classId: selectedClassId,
        sectionId: selectedSectionId,
      });
      setHomeworkList(res.data || []);
    } catch (e) {
      console.error('Failed to load homework', e);
    }
  };

  const handleOpenCreateHw = () => {
    setEditingHwId(null);
    setHwForm({
      title: '',
      description: '',
      subjectId: '',
      dueDate: '',
      maxMarks: 50,
      attachmentTitle: '',
      attachmentUrl: '',
    });
    setIsHwModalOpen(true);
  };

  const handleOpenEditHw = (hw) => {
    setEditingHwId(hw._id);
    let dateStr = '';
    if (hw.dueDate) {
      try {
        dateStr = new Date(hw.dueDate).toISOString().split('T')[0];
      } catch {
        dateStr = '';
      }
    }
    setHwForm({
      title: hw.title || '',
      description: hw.description || '',
      subjectId: hw.subjectId?._id || hw.subjectId || '',
      dueDate: dateStr,
      maxMarks: hw.maxMarks || 50,
      attachmentTitle: hw.attachments?.[0]?.title || '',
      attachmentUrl: hw.attachments?.[0]?.fileUrl || '',
    });
    setIsHwModalOpen(true);
  };

  const handleSaveHomework = async (e) => {
    e.preventDefault();
    setIsSubmittingHw(true);
    try {
      const attachments = hwForm.attachmentUrl
        ? [
            {
              title: hwForm.attachmentTitle || 'Homework Worksheet PDF',
              fileUrl: hwForm.attachmentUrl,
            },
          ]
        : [];

      if (editingHwId) {
        await academicsService.updateHomework(editingHwId, {
          title: hwForm.title,
          description: hwForm.description,
          subjectId: hwForm.subjectId,
          dueDate: hwForm.dueDate,
          maxMarks: hwForm.maxMarks,
          attachments,
          classId: selectedClassId,
          sectionId: selectedSectionId,
        });
        setHwActionMsg('✓ Homework assignment updated successfully!');
      } else {
        await academicsService.createHomework({
          title: hwForm.title,
          description: hwForm.description,
          subjectId: hwForm.subjectId,
          dueDate: hwForm.dueDate,
          maxMarks: hwForm.maxMarks,
          attachments,
          classId: selectedClassId,
          sectionId: selectedSectionId,
        });
        setHwActionMsg('✓ Homework assignment created and published successfully!');
      }

      setIsHwModalOpen(false);
      setEditingHwId(null);
      setHwForm({
        title: '',
        description: '',
        subjectId: '',
        dueDate: '',
        maxMarks: 50,
        attachmentTitle: '',
        attachmentUrl: '',
      });
      fetchHomework();
    } catch (err) {
      alert(err.message || 'Failed to save homework assignment');
    } finally {
      setIsSubmittingHw(false);
    }
  };

  const handleDeleteHomework = async (hw) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete homework assignment:\n"${hw.title}"?\n\nThis will permanently remove this assignment.`
    );
    if (!confirmDelete) return;

    try {
      await academicsService.deleteHomework(hw._id);
      setHwActionMsg(`✓ Homework "${hw.title}" deleted successfully!`);
      fetchHomework();
    } catch (err) {
      alert(err.message || 'Failed to delete homework assignment');
    }
  };

  // Load Marksheet
  useEffect(() => {
    if (
      activeTab === 'marks' &&
      selectedExamId &&
      selectedClassId &&
      selectedSectionId &&
      selectedExamSubjectId
    ) {
      fetchMarksheet();
    }
  }, [activeTab, selectedExamId, selectedClassId, selectedSectionId, selectedExamSubjectId]);

  const fetchMarksheet = async () => {
    if (isStudent) return;
    setLoading(true);
    try {
      const res = await academicsService.getExamMarks({
        examId: selectedExamId,
        classId: selectedClassId,
        sectionId: selectedSectionId,
        subjectId: selectedExamSubjectId,
      });
      setMarksheet(res.data || []);
    } catch (err) {
      console.error('Failed to load marksheet', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarksheetChange = (index, value) => {
    const updated = [...marksheet];
    updated[index].marksObtained = value;
    setMarksheet(updated);
  };

  const handleSaveMarksheet = async () => {
    setIsSavingMarks(true);
    try {
      const marksData = marksheet.map((item) => ({
        studentId: item.student._id,
        marksObtained: item.marksObtained,
        totalMarks: item.totalMarks,
        isAbsent: item.isAbsent,
        remarks: item.remarks,
      }));

      await academicsService.saveExamMarks({
        examId: selectedExamId,
        classId: selectedClassId,
        sectionId: selectedSectionId,
        subjectId: selectedExamSubjectId,
        marksData,
      });

      alert('Exam marks saved and published successfully!');
      fetchMarksheet();
    } catch (e) {
      alert(e.message || 'Failed to save marks');
    } finally {
      setIsSavingMarks(false);
    }
  };

  // Marksheet Student Evaluation & Grade/Status Computation
  const getStudentResult = (marksVal, totalMarksVal = 100, isAbsent = false) => {
    if (isAbsent) {
      return { grade: 'ABS', status: 'Absent', badgeVariant: 'warning', pass: false, percentage: 0, remark: 'Absent from Examination' };
    }
    if (marksVal === '' || marksVal === null || marksVal === undefined) {
      return { grade: '—', status: 'Pending', badgeVariant: 'neutral', pass: null, percentage: 0, remark: 'Marks Not Entered' };
    }
    const marks = Number(marksVal);
    const total = Number(totalMarksVal) || 100;
    const percentage = total > 0 ? (marks / total) * 100 : 0;

    let grade = 'F';
    if (percentage >= 90) grade = 'A+';
    else if (percentage >= 80) grade = 'A';
    else if (percentage >= 70) grade = 'B+';
    else if (percentage >= 60) grade = 'B';
    else if (percentage >= 50) grade = 'C';
    else if (percentage >= 40) grade = 'D';
    else grade = 'F';

    const pass = percentage >= 40;
    const status = pass ? 'PASS' : 'FAIL';
    const badgeVariant = pass ? 'success' : 'danger';

    let remark = 'Needs Improvement';
    if (grade === 'A+' || grade === 'A') remark = 'Distinction / Outstanding';
    else if (grade === 'B+' || grade === 'B') remark = 'Good Performance';
    else if (grade === 'C') remark = 'Satisfactory';
    else if (grade === 'D') remark = 'Passed (Marginal)';
    else remark = 'Failed (Remedial Required)';

    return { grade, status, badgeVariant, pass, percentage: Number(percentage.toFixed(1)), remark };
  };

  // Marksheet Analytics for Preview Modal
  const marksheetAnalytics = useMemo(() => {
    if (!marksheet || marksheet.length === 0) {
      return { total: 0, evaluated: 0, passed: 0, failed: 0, absent: 0, passRate: 0, avgMarks: 0, maxScore: 0 };
    }

    let evaluated = 0;
    let passed = 0;
    let failed = 0;
    let absent = 0;
    let totalScore = 0;
    let maxScore = 0;

    marksheet.forEach((item) => {
      if (item.isAbsent) {
        absent++;
      } else if (item.marksObtained !== '' && item.marksObtained !== null && item.marksObtained !== undefined) {
        evaluated++;
        const marks = Number(item.marksObtained);
        totalScore += marks;
        if (marks > maxScore) maxScore = marks;
        if (marks >= 40) {
          passed++;
        } else {
          failed++;
        }
      }
    });

    const passRate = evaluated > 0 ? Math.round((passed / evaluated) * 100) : 0;
    const avgMarks = evaluated > 0 ? (totalScore / evaluated).toFixed(1) : 0;

    return {
      total: marksheet.length,
      evaluated,
      passed,
      failed,
      absent,
      passRate,
      avgMarks,
      maxScore,
    };
  }, [marksheet]);

  // Export Marksheet to CSV
  const handleExportMarksheetCsv = () => {
    if (!marksheet || marksheet.length === 0) return;
    const currentExam = exams.find((e) => e._id === selectedExamId);
    const currentSubject = subjects.find((s) => s._id === selectedExamSubjectId);

    const headers = ['Roll Number', 'Student ID', 'Student Name', 'Marks Obtained', 'Total Marks', 'Percentage', 'Grade', 'Result Status', 'Remarks'];
    const rows = marksheet.map((item) => {
      const res = getStudentResult(item.marksObtained, item.totalMarks, item.isAbsent);
      return [
        item.student.rollNumber,
        item.student.studentId,
        `"${item.student.firstName} ${item.student.lastName}"`,
        item.marksObtained !== '' ? item.marksObtained : 'N/A',
        item.totalMarks || 100,
        `${res.percentage}%`,
        res.grade,
        res.status,
        `"${res.remark}"`,
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Marksheet_${currentExam?.name?.replace(/\s+/g, '_') || 'Exam'}_${currentSubject?.name?.replace(/\s+/g, '_') || 'Subject'}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintMarksheet = () => {
    window.print();
  };

  // Fetch Consolidated Class Results
  const fetchConsolidatedResults = async () => {
    if (isStudent || !selectedExamId || !selectedClassId || !selectedSectionId) return;
    setLoadingConsolidated(true);
    try {
      const res = await academicsService.getConsolidatedClassResults({
        examId: selectedExamId,
        classId: selectedClassId,
        sectionId: selectedSectionId,
      });
      setConsolidatedData(res.data || { subjects: [], students: [], classStats: {} });
      // Prepopulate reviews
      const initialReviews = {};
      (res.data?.students || []).forEach((st) => {
        initialReviews[st.student._id] = st.teacherRemarks || '';
      });
      setStudentReviews(initialReviews);
    } catch (err) {
      console.error('Failed to load consolidated class results', err);
    } finally {
      setLoadingConsolidated(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'marks' && examSubMode === 'consolidated' && selectedExamId && selectedClassId && selectedSectionId) {
      fetchConsolidatedResults();
    }
  }, [activeTab, examSubMode, selectedExamId, selectedClassId, selectedSectionId]);

  // Handle Review Change for a Student in Consolidated Broadsheet
  const handleStudentReviewChange = (studentId, text) => {
    setStudentReviews((prev) => ({
      ...prev,
      [studentId]: text,
    }));
  };

  // Compile Class Results (Class Teacher / Coordinator)
  const handleCompileClassResults = async () => {
    if (!selectedExamId || !selectedClassId || !selectedSectionId) {
      alert('Please select Exam, Class, and Section first.');
      return;
    }
    setIsCompilingClass(true);
    try {
      await academicsService.compileClassResults({
        examId: selectedExamId,
        classId: selectedClassId,
        sectionId: selectedSectionId,
        reviews: studentReviews,
      });
      alert('✓ Class results successfully compiled and all student report cards published!');
      fetchConsolidatedResults();
    } catch (err) {
      alert(err.message || 'Failed to compile class results');
    } finally {
      setIsCompilingClass(false);
    }
  };

  // Open Individual Student Complete Marksheet (Report Card)
  const handleOpenStudentReport = async (studentId) => {
    if (!selectedExamId) {
      alert('Please select an Examination term first.');
      return;
    }
    setLoadingStudentReport(true);
    setIsStudentReportModalOpen(true);
    try {
      const res = await academicsService.getStudentComprehensiveReport(studentId, {
        examId: selectedExamId,
      });
      setSelectedStudentReport(res.data || null);
    } catch (err) {
      alert(err.message || 'Failed to load student comprehensive marksheet');
      setIsStudentReportModalOpen(false);
    } finally {
      setLoadingStudentReport(false);
    }
  };

  // Save Single Student Review in Report Card Modal
  const handleSaveStudentReview = async () => {
    if (!selectedStudentReport?.reportCardId) {
      alert('Please compile class results first to lock permanent record, or use Compile Class Results button.');
      return;
    }
    setIsSavingStudentReview(true);
    try {
      await academicsService.updateReportCardRemarks(selectedStudentReport.reportCardId, {
        teacherRemarks: selectedStudentReport.teacherRemarks,
        principalRemarks: selectedStudentReport.principalRemarks,
      });
      alert('✓ Student teacher review updated successfully!');
      fetchConsolidatedResults();
    } catch (err) {
      alert(err.message || 'Failed to update review');
    } finally {
      setIsSavingStudentReview(false);
    }
  };

  // Export Consolidated Broadsheet to CSV
  const handleExportConsolidatedCsv = () => {
    if (!consolidatedData?.students?.length) return;
    const currentExam = exams.find((e) => e._id === selectedExamId);
    const subHeaders = (consolidatedData.subjects || []).map((s) => `"${s.name} (${s.code || ''})"`);
    const headers = [
      'Class Rank',
      'Roll Number',
      'Student ID',
      'Student Name',
      ...subHeaders,
      'Grand Total Obtained',
      'Max Total Marks',
      'Percentage (%)',
      'Overall Grade',
      'Result Status',
      'Attendance (%)',
      'Class Teacher Review / Remarks',
    ];

    const rows = consolidatedData.students.map((st) => {
      const subMarks = (consolidatedData.subjects || []).map((s) => {
        const m = st.subjectsMarks[s._id];
        return m ? (m.isAbsent ? 'ABS' : m.marksObtained !== '' ? m.marksObtained : 'N/A') : 'N/A';
      });

      return [
        st.classRank,
        st.student.rollNumber,
        st.student.studentId,
        `"${st.student.firstName} ${st.student.lastName}"`,
        ...subMarks,
        st.totalMarksObtained,
        st.totalMarksPossible,
        `${st.percentage}%`,
        st.overallGrade,
        st.passStatus,
        `${st.attendancePercentage}%`,
        `"${(studentReviews[st.student._id] || st.teacherRemarks || '').replace(/"/g, '""')}"`,
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Consolidated_Class_Gazette_${currentExam?.name?.replace(/\s+/g, '_') || 'Exam'}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Attendance stats computation
  const presentCount = attendanceRoster.filter((r) => r.status === 'Present').length;
  const absentCount = attendanceRoster.filter((r) => r.status === 'Absent').length;
  const attendanceRate =
    attendanceRoster.length > 0 ? Math.round((presentCount / attendanceRoster.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Academics & Teaching Console</h1>
          <p className="text-xs text-slate-500 mt-1">
            Daily student attendance register, weekly class timetables, homework assignments, and examinations.
          </p>
        </div>
      </div>

      {/* Global Class & Section Filter Selector */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-600">Select Class:</label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-semibold"
          >
            {classes.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-600">Section:</label>
          <select
            value={selectedSectionId}
            onChange={(e) => setSelectedSectionId(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-semibold"
          >
            {sections
              .filter((s) => s.classId?._id === selectedClassId || s.classId === selectedClassId)
              .map((sec) => (
                <option key={sec._id} value={sec._id}>Section {sec.name}</option>
              ))}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-px">
        {(isStudent
          ? [
              { id: 'timetable', label: 'My Weekly Timetable', icon: Clock },
              { id: 'homework', label: 'Homework & Tasks', icon: BookOpen },
            ]
          : [
              { id: 'attendance', label: 'Daily Attendance', icon: CalendarCheck },
              { id: 'timetable', label: 'Weekly Timetable', icon: Clock },
              { id: 'homework', label: 'Homework & Tasks', icon: BookOpen },
              { id: 'marks', label: 'Exams & Marks Entry', icon: Award },
            ]
        ).map((tab) => {
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

      {/* TAB 1: DAILY ATTENDANCE REGISTER (Faculty & Admin Only) */}
      {!isStudent && activeTab === 'attendance' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-slate-700">Attendance Date:</label>
              <input
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800"
              />
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                Present: {presentCount}
              </span>
              <span className="text-rose-700 bg-rose-50 px-3 py-1 rounded-lg border border-rose-200">
                Absent: {absentCount}
              </span>
              <span className="text-indigo-700 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-200">
                Rate: {attendanceRate}%
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleMarkAllPresent}>
                Mark All Present
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={Save}
                isLoading={isSavingAttendance}
                onClick={handleSaveAttendance}
              >
                Save Attendance
              </Button>
            </div>
          </div>

          {loading ? (
            <LoadingSpinner text="Loading section register..." />
          ) : attendanceRoster.length === 0 ? (
            <EmptyState
              icon={CalendarCheck}
              title="No students in this section"
              description="Enroll students in this class and section to take attendance."
            />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider">
                    <th className="p-3.5 font-semibold text-center w-16">Roll #</th>
                    <th className="p-3.5 font-semibold">Student ID</th>
                    <th className="p-3.5 font-semibold">Student Name</th>
                    <th className="p-3.5 font-semibold text-center">Attendance Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {attendanceRoster.map((item, index) => (
                    <tr key={item.student._id} className="hover:bg-slate-50/80">
                      <td className="p-3.5 text-center font-bold text-slate-800">
                        {item.student.rollNumber}
                      </td>
                      <td className="p-3.5 font-mono font-semibold text-indigo-600">
                        {item.student.studentId}
                      </td>
                      <td className="p-3.5 font-bold text-slate-900">
                        {item.student.firstName} {item.student.lastName}
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center justify-center gap-1.5">
                          {['Present', 'Absent', 'Late', 'Excused Leave'].map((st) => {
                            const isSelected = item.status === st;
                            const colors = {
                              Present: isSelected
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
                              Absent: isSelected
                                ? 'bg-rose-600 text-white shadow-sm'
                                : 'bg-rose-50 text-rose-700 hover:bg-rose-100',
                              Late: isSelected
                                ? 'bg-amber-600 text-white shadow-sm'
                                : 'bg-amber-50 text-amber-700 hover:bg-amber-100',
                              'Excused Leave': isSelected
                                ? 'bg-sky-600 text-white shadow-sm'
                                : 'bg-sky-50 text-sky-700 hover:bg-sky-100',
                            };
                            return (
                              <button
                                key={st}
                                type="button"
                                onClick={() => handleStatusToggle(index, st)}
                                className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${colors[st]}`}
                              >
                                {st}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TIMETABLE */}
      {activeTab === 'timetable' && (
        <div className="space-y-4">
          {/* Extraction Success Banner */}
          {extractSuccessMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between shadow-xs">
              <span className="flex items-center gap-2 font-semibold">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                {extractSuccessMsg}
              </span>
              <button
                type="button"
                onClick={() => setExtractSuccessMsg('')}
                className="text-emerald-700 hover:text-emerald-900 font-bold px-2 py-0.5 rounded cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* Top Control Bar: Calendar Date Picker, Quick Nav, Mode Switcher & PDF Actions */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Calendar Date Picker & Quick Nav */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus-within:ring-2 focus-within:ring-indigo-500/20">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <input
                  type="date"
                  value={timetableDate}
                  onChange={(e) => handleTimetableDateChange(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-slate-800 outline-none cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => shiftDate(-1)}
                  title="Previous Day"
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleTimetableDateChange(new Date().toISOString().split('T')[0])}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => shiftDate(1)}
                  title="Next Day"
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200">
                <span className="text-xs font-bold text-slate-800">{formattedTimetableDate}</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    selectedDay === 'Sunday'
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-indigo-100 text-indigo-700'
                  }`}
                >
                  {selectedDay}
                </span>
              </div>
            </div>

            {/* View Mode & Actions */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Daily Grid vs Weekly Matrix Toggle */}
              <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200/80">
                <button
                  type="button"
                  onClick={() => setTimetableViewMode('daily')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                    timetableViewMode === 'daily'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <CalendarDays className="w-3.5 h-3.5" />
                  Daily Schedule
                </button>
                <button
                  type="button"
                  onClick={() => setTimetableViewMode('matrix')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                    timetableViewMode === 'matrix'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  Weekly Matrix
                </button>
              </div>

              {/* Design / Edit Timetable Routine (Replicate to Multiple Days) */}
              {!isStudent && (
                <button
                  type="button"
                  onClick={handleOpenDesigner}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Design / Edit Routine
                </button>
              )}

              {/* Extract Timetable from PDF */}
              <button
                type="button"
                onClick={() => setIsExtractModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Extract PDF
              </button>

              {/* Export Timetable PDF */}
              <a
                href="/documents/Grade10_Academic_Master_Timetable.pdf"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-indigo-600" />
                Export PDF
              </a>
            </div>
          </div>

          {/* Quick Day Tabs (Synced with Calendar) */}
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2 overflow-x-auto">
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => {
              const isCurrentDay = selectedDay === day;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  className={`px-3.5 py-1 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                    isCurrentDay
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Sunday / Holiday Alert */}
          {selectedDay === 'Sunday' && (
            <div className="p-8 rounded-2xl bg-amber-50/70 border border-amber-200 text-center space-y-3">
              <span className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-100 text-amber-800">
                <Calendar className="w-6 h-6" />
              </span>
              <h4 className="font-bold text-amber-900 text-base">Sunday - Weekend Holiday</h4>
              <p className="text-xs text-amber-700 max-w-md mx-auto">
                Classes and academic periods are not scheduled on Sundays. You can pick another date from the calendar or switch to Monday's schedule.
              </p>
              <button
                type="button"
                onClick={() => {
                  const d = new Date(timetableDate + 'T00:00:00');
                  d.setDate(d.getDate() + 1);
                  handleTimetableDateChange(d.toISOString().split('T')[0]);
                }}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                View Monday Schedule
              </button>
            </div>
          )}

          {/* VIEW 1: DAILY TIMETABLE SCHEDULE GRID (Clean Tabular Grid) */}
          {selectedDay !== 'Sunday' && timetableViewMode === 'daily' && (
            timetableData.length === 0 ? (
              <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600">
                  <Clock className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-800 text-base">No timetable defined for {selectedDay}</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Periods for this day have not been configured yet. You can design a routine from scratch (and replicate it across all weekdays) or extract periods directly from a timetable PDF.
                </p>
                <div className="flex items-center justify-center gap-3">
                  {!isStudent && (
                    <Button
                      variant="primary"
                      icon={Edit3}
                      onClick={handleOpenDesigner}
                    >
                      Design Routine
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    icon={Sparkles}
                    onClick={() => setIsExtractModalOpen(true)}
                  >
                    Extract from PDF
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                    <span className="font-bold text-slate-800 text-sm">
                      {selectedDay} Schedule • {formattedTimetableDate}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                      {timetableData.length} Periods
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-500">
                      Grade 10 • Section A
                    </span>
                    {!isStudent && (
                      <button
                        type="button"
                        onClick={handleOpenDesigner}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-indigo-700 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" />
                        Edit Schedule
                      </button>
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/90 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="py-3.5 px-4 w-20">Period</th>
                        <th className="py-3.5 px-4 w-44">Time Window</th>
                        <th className="py-3.5 px-4">Subject & Curriculum</th>
                        <th className="py-3.5 px-4">Faculty / Instructor</th>
                        <th className="py-3.5 px-4">Room / Venue</th>
                        <th className="py-3.5 px-4 text-right">Session Type</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {timetableData.map((p) => {
                        if (p.isBreak) {
                          return (
                            <tr
                              key={p._id || p.periodNumber}
                              className="bg-amber-50/50 border-y border-amber-200/60"
                            >
                              <td className="py-3.5 px-4">
                                <span className="px-2.5 py-1 rounded-lg bg-amber-200/80 text-amber-900 font-bold text-[10px] tracking-wide">
                                  BREAK
                                </span>
                              </td>
                              <td className="py-3.5 px-4 font-mono font-bold text-amber-900">
                                <Clock className="w-3.5 h-3.5 inline mr-1 text-amber-600" />
                                {p.startTime} - {p.endTime}
                              </td>
                              <td colSpan={3} className="py-3.5 px-4 font-semibold text-amber-900">
                                Recess & Nutritional Break • Cafeteria & Courtyard Grounds
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-white border border-amber-300 text-amber-800">
                                  Recess
                                </span>
                              </td>
                            </tr>
                          );
                        }
                        return (
                          <tr
                            key={p._id || p.periodNumber}
                            className="hover:bg-slate-50/80 transition-colors"
                          >
                            <td className="py-3.5 px-4">
                              <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold text-xs">
                                P{p.periodNumber}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-mono font-semibold text-slate-700 whitespace-nowrap">
                              <Clock className="w-3.5 h-3.5 inline mr-1.5 text-slate-400" />
                              {p.startTime} - {p.endTime}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-slate-900 text-sm">
                                {p.subjectId?.name || p.subjectName || 'Subject'}
                              </div>
                              {(p.subjectId?.code || p.subjectCode) && (
                                <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-600">
                                  {p.subjectId?.code || p.subjectCode}
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-slate-800">
                                {p.teacherId
                                  ? `${p.teacherId.firstName} ${p.teacherId.lastName}`
                                  : p.teacherName || 'Faculty Assigned'}
                              </div>
                              <span className="text-[11px] text-slate-400 block">Department Faculty</span>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-200/60">
                                {p.roomNumber || 'Room 204'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                                Active Lecture
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          )}

          {/* VIEW 2: WEEKLY MASTER MATRIX GRID (Full Week Matrix Layout) */}
          {selectedDay !== 'Sunday' && timetableViewMode === 'matrix' && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <LayoutGrid className="w-4 h-4 text-indigo-600" />
                  <span className="font-bold text-slate-800 text-sm">
                    Weekly Master Timetable Matrix Grid
                  </span>
                </div>
                <span className="text-xs text-slate-500 font-medium">Grade 10 • Section A (Monday - Friday)</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/90 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4 w-28">Day</th>
                      <th className="py-3 px-3">
                        Period 1<br />
                        <span className="text-[10px] font-normal font-mono text-slate-400">08:30-09:15</span>
                      </th>
                      <th className="py-3 px-3">
                        Period 2<br />
                        <span className="text-[10px] font-normal font-mono text-slate-400">09:15-10:00</span>
                      </th>
                      <th className="py-3 px-3">
                        Period 3<br />
                        <span className="text-[10px] font-normal font-mono text-slate-400">10:00-10:45</span>
                      </th>
                      <th className="py-3 px-3 bg-amber-50/50">
                        Recess<br />
                        <span className="text-[10px] font-normal font-mono text-amber-600">10:45-11:15</span>
                      </th>
                      <th className="py-3 px-3">
                        Period 5<br />
                        <span className="text-[10px] font-normal font-mono text-slate-400">11:15-12:00</span>
                      </th>
                      <th className="py-3 px-3">
                        Period 6<br />
                        <span className="text-[10px] font-normal font-mono text-slate-400">12:00-12:45</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => {
                      const daySchedule = weeklyMatrixData.find((d) => d.dayOfWeek === day);
                      const periods = daySchedule?.periods || [];
                      const getPeriod = (pNum) => periods.find((p) => p.periodNumber === pNum);

                      return (
                        <tr key={day} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-900 bg-slate-50/50 border-r border-slate-100">
                            {day}
                          </td>
                          {[1, 2, 3, 4, 5, 6].map((pNum) => {
                            const p = getPeriod(pNum);
                            if (pNum === 4 || p?.isBreak) {
                              return (
                                <td key={pNum} className="py-2.5 px-3 bg-amber-50/30 text-center">
                                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded">
                                    Break
                                  </span>
                                </td>
                              );
                            }
                            if (!p) {
                              return (
                                <td key={pNum} className="py-2.5 px-3 text-slate-300 italic text-[11px]">
                                  —
                                </td>
                              );
                            }
                            return (
                              <td key={pNum} className="py-2.5 px-3">
                                <div className="font-bold text-slate-800 text-[11px] truncate max-w-[130px]">
                                  {p.subjectId?.name || p.subjectName || 'Subject'}
                                </div>
                                <div className="text-[10px] text-slate-500 truncate max-w-[130px]">
                                  {p.teacherId
                                    ? `${p.teacherId.firstName} ${p.teacherId.lastName}`
                                    : p.teacherName || ''}
                                </div>
                                {p.roomNumber && (
                                  <span className="text-[9px] font-semibold text-slate-400">
                                    {p.roomNumber}
                                  </span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: HOMEWORK */}
      {activeTab === 'homework' && (
        <div className="space-y-4">
          {/* Action Notification Banner */}
          {hwActionMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between shadow-xs">
              <span className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                {hwActionMsg}
              </span>
              <button
                type="button"
                onClick={() => setHwActionMsg('')}
                className="text-emerald-700 hover:text-emerald-900 font-bold px-2 py-0.5 rounded cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-800">Homework & Submissions</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage curriculum tasks, assign PDF worksheets, and review student homework.
              </p>
            </div>
            {!isStudent && (
              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={handleOpenCreateHw}
              >
                Assign Homework
              </Button>
            )}
          </div>

          {homeworkList.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No homework assigned"
              description="No active homework or review tasks found for this section."
              actionText={!isStudent ? 'Assign Homework' : undefined}
              onAction={!isStudent ? handleOpenCreateHw : undefined}
            />
          ) : (
            <div className="space-y-3">
              {homeworkList.map((hw) => (
                <Card key={hw._id} className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="primary">{hw.subjectId?.name}</Badge>
                        <span className="text-xs text-slate-400">
                          Due: {new Date(hw.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-slate-900 mt-1">{hw.title}</h4>
                      <p className="text-xs text-slate-600 mt-1 max-w-2xl">{hw.description}</p>
                      {hw.attachments?.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          {hw.attachments.map((att, idx) => (
                            <a
                              key={idx}
                              href={att.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold border border-indigo-200/60 transition-colors"
                            >
                              <FileText className="w-3.5 h-3.5 text-indigo-600" />
                              {att.title || 'Attached PDF Worksheet'}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className="text-xs font-semibold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                        {hw.submissions?.length || 0} Submissions
                      </span>

                      {!isStudent && (
                        <div className="flex items-center gap-1.5 border-l border-slate-200 pl-2.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditHw(hw)}
                            title="Edit Homework"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 text-slate-700 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteHomework(hw)}
                            title="Delete Homework"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 text-slate-700 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: EXAMS & MARKS ENTRY (Faculty & Admin Only) */}
      {!isStudent && activeTab === 'marks' && (
        <div className="space-y-4">
          {/* Dual Mode Switcher: Subject Marks vs Consolidated Broad Sheet */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2 p-1 bg-slate-100/80 rounded-xl">
              <button
                type="button"
                onClick={() => setExamSubMode('subject')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  examSubMode === 'subject'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                1. Subject Marks Entry (Faculty)
              </button>
              <button
                type="button"
                onClick={() => {
                  setExamSubMode('consolidated');
                  fetchConsolidatedResults();
                }}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  examSubMode === 'consolidated'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                2. Consolidated Class Result & Gazette (Class Teacher / Coordinator)
              </button>
            </div>

            <span className="text-[11px] text-slate-500 hidden sm:inline-block pr-2">
              {examSubMode === 'subject'
                ? 'Individual subject scoring & evaluation'
                : 'Multi-subject class master gazette & report card generation'}
            </span>
          </div>

          {/* MODE 1: SUBJECT MARKS ENTRY */}
          {examSubMode === 'subject' && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <label className="font-semibold text-slate-700">Select Exam:</label>
                  <select
                    value={selectedExamId}
                    onChange={(e) => setSelectedExamId(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-semibold"
                  >
                    <option value="">Select Exam Master...</option>
                    {exams.map((ex) => (
                      <option key={ex._id} value={ex._id}>{ex.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <label className="font-semibold text-slate-700">Subject:</label>
                  <select
                    value={selectedExamSubjectId}
                    onChange={(e) => setSelectedExamSubjectId(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-semibold"
                  >
                    <option value="">Select Subject...</option>
                    {subjects
                      .filter((s) => s.classId?._id === selectedClassId || s.classId === selectedClassId)
                      .map((sub) => (
                        <option key={sub._id} value={sub._id}>{sub.name} ({sub.code})</option>
                      ))}
                  </select>
                </div>

                {marksheet.length > 0 && (
                  <div className="ml-auto flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={Eye}
                      onClick={() => setIsMarksheetPreviewOpen(true)}
                    >
                      Preview Marksheet
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      icon={Save}
                      isLoading={isSavingMarks}
                      onClick={handleSaveMarksheet}
                    >
                      Publish Subject Marks
                    </Button>
                  </div>
                )}
              </div>

              {!selectedExamId || !selectedExamSubjectId ? (
                <EmptyState
                  icon={Award}
                  title="Select an Exam and Subject"
                  description="Choose an examination term and subject from the dropdown above to load the student marksheet."
                />
              ) : loading ? (
                <LoadingSpinner text="Loading exam marksheet..." />
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider">
                        <th className="p-3.5 font-semibold text-center w-16">Roll #</th>
                        <th className="p-3.5 font-semibold">Student ID</th>
                        <th className="p-3.5 font-semibold">Student Name</th>
                        <th className="p-3.5 font-semibold text-center w-36">Marks Obtained (Out of 100)</th>
                        <th className="p-3.5 font-semibold text-center w-24">Calculated Grade</th>
                        <th className="p-3.5 font-semibold text-center w-28">Result Status</th>
                        <th className="p-3.5 font-semibold text-center w-36">Complete Marksheet</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {marksheet.map((item, index) => {
                        const result = getStudentResult(item.marksObtained, item.totalMarks, item.isAbsent);

                        return (
                          <tr key={item.student._id} className="hover:bg-slate-50/80">
                            <td className="p-3.5 text-center font-bold text-slate-800">
                              {item.student.rollNumber}
                            </td>
                            <td className="p-3.5 font-mono font-semibold text-indigo-600">
                              {item.student.studentId}
                            </td>
                            <td className="p-3.5 font-bold text-slate-900">
                              {item.student.firstName} {item.student.lastName}
                            </td>
                            <td className="p-3.5 text-center">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={item.marksObtained}
                                onChange={(e) => handleMarksheetChange(index, e.target.value)}
                                placeholder="0 - 100"
                                className="w-24 text-center px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                              />
                            </td>
                            <td className="p-3.5 text-center">
                              <Badge
                                variant={
                                  result.grade === 'A+' || result.grade === 'A'
                                    ? 'success'
                                    : result.grade === 'F'
                                    ? 'danger'
                                    : 'primary'
                                }
                              >
                                {result.grade}
                              </Badge>
                            </td>
                            <td className="p-3.5 text-center">
                              {result.status === 'PASS' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> PASS
                                </span>
                              )}
                              {result.status === 'FAIL' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                  <XCircle className="w-3 h-3 text-rose-600" /> FAIL
                                </span>
                              )}
                              {result.status === 'Pending' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                  Pending
                                </span>
                              )}
                              {result.status === 'Absent' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                  Absent
                                </span>
                              )}
                            </td>
                            <td className="p-3.5 text-center">
                              <button
                                type="button"
                                onClick={() => handleOpenStudentReport(item.student._id)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors border border-indigo-200/60 cursor-pointer"
                                title="Download complete report card with all subjects & teacher reviews"
                              >
                                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Report Card</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* MODE 2: CONSOLIDATED CLASS RESULT & GAZETTE (CLASS TEACHER / COORDINATOR) */}
          {examSubMode === 'consolidated' && (
            <div className="space-y-4">
              {/* Consolidated Action Bar */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <label className="font-semibold text-slate-700">Select Exam:</label>
                    <select
                      value={selectedExamId}
                      onChange={(e) => setSelectedExamId(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-semibold"
                    >
                      <option value="">Select Exam Master...</option>
                      {exams.map((ex) => (
                        <option key={ex._id} value={ex._id}>{ex.name}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={fetchConsolidatedResults}
                    disabled={loadingConsolidated}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                    title="Refresh Consolidated Results"
                  >
                    <RefreshCw className={`w-4 h-4 ${loadingConsolidated ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={Download}
                    onClick={handleExportConsolidatedCsv}
                    disabled={!consolidatedData?.students?.length}
                  >
                    Export Gazette (CSV)
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={Printer}
                    onClick={() => setIsBroadsheetPreviewOpen(true)}
                    disabled={!consolidatedData?.students?.length}
                  >
                    Print Broadsheet
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    icon={CheckCircle2}
                    isLoading={isCompilingClass}
                    onClick={handleCompileClassResults}
                    disabled={!consolidatedData?.students?.length}
                  >
                    Compile & Publish Class Results
                  </Button>
                </div>
              </div>

              {/* Class Overview Metric Cards */}
              {consolidatedData?.classStats && (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="p-3 bg-white border border-slate-200 rounded-xl">
                    <div className="text-[11px] font-semibold text-slate-500">Total Enrolled</div>
                    <div className="text-xl font-bold text-slate-800 mt-1">
                      {consolidatedData.classStats.totalStudents || 0}
                    </div>
                    <div className="text-[10px] text-slate-400">Students in Class</div>
                  </div>
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <div className="text-[11px] font-semibold text-emerald-800">Passed Students</div>
                    <div className="text-xl font-bold text-emerald-700 mt-1">
                      {consolidatedData.classStats.passedStudents || 0}{' '}
                      <span className="text-xs font-normal">({consolidatedData.classStats.passRate || 0}%)</span>
                    </div>
                    <div className="text-[10px] text-emerald-600 font-medium">Clear in All Subjects</div>
                  </div>
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
                    <div className="text-[11px] font-semibold text-rose-800">Failed / Compartment</div>
                    <div className="text-xl font-bold text-rose-700 mt-1">
                      {consolidatedData.classStats.failedStudents || 0}
                    </div>
                    <div className="text-[10px] text-rose-600 font-medium">&lt; 40% in Any Subject</div>
                  </div>
                  <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
                    <div className="text-[11px] font-semibold text-indigo-800">Class Average</div>
                    <div className="text-xl font-bold text-indigo-700 mt-1">
                      {consolidatedData.classStats.classAverage || 0}%
                    </div>
                    <div className="text-[10px] text-indigo-600 font-medium">Overall Class Performance</div>
                  </div>
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <div className="text-[11px] font-semibold text-amber-800">Highest Score</div>
                    <div className="text-xl font-bold text-amber-700 mt-1">
                      {consolidatedData.classStats.highestScore || 0}
                    </div>
                    <div className="text-[10px] text-amber-600 font-medium">Top Aggregate Score</div>
                  </div>
                </div>
              )}

              {/* Master Broadsheet Table */}
              {loadingConsolidated ? (
                <LoadingSpinner text="Compiling multi-subject class results..." />
              ) : !consolidatedData?.students?.length ? (
                <EmptyState
                  icon={Award}
                  title="No Results Found"
                  description="Select an examination term to compile and view the consolidated class result broadsheet."
                />
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                  <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-800">
                        Class Broad Sheet (Multi-Subject Gazette)
                      </span>
                      <span className="text-[11px] text-slate-500">
                        — Aggregated across all subject teachers
                      </span>
                    </div>
                    <span className="text-[11px] text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200/50">
                      Passing Criteria: ≥ 40% in each subject
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                      <thead>
                        <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                          <th className="p-3 text-center w-12">Rank</th>
                          <th className="p-3 text-center w-14">Roll #</th>
                          <th className="p-3 w-40">Student Name</th>
                          {consolidatedData.subjects.map((sub) => (
                            <th key={sub._id} className="p-3 text-center min-w-[100px]">
                              <div>{sub.name}</div>
                              <div className="text-[10px] text-slate-400 font-normal">({sub.code || '100'})</div>
                            </th>
                          ))}
                          <th className="p-3 text-center w-28 font-black text-slate-900">Grand Total</th>
                          <th className="p-3 text-center w-20 font-black text-slate-900">%</th>
                          <th className="p-3 text-center w-16">Grade</th>
                          <th className="p-3 text-center w-24">Status</th>
                          <th className="p-3 min-w-[240px]">Class Teacher Review / Remarks</th>
                          <th className="p-3 text-center w-28">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-800">
                        {consolidatedData.students.map((st) => (
                          <tr key={st.student._id} className="hover:bg-slate-50/80">
                            <td className="p-3 text-center">
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full font-black text-xs bg-slate-100 text-slate-700">
                                #{st.classRank}
                              </span>
                            </td>
                            <td className="p-3 text-center font-bold text-slate-800">
                              {st.student.rollNumber}
                            </td>
                            <td className="p-3">
                              <div className="font-bold text-slate-900">
                                {st.student.firstName} {st.student.lastName}
                              </div>
                              <div className="text-[10px] font-mono text-indigo-600">
                                {st.student.studentId}
                              </div>
                            </td>
                            {consolidatedData.subjects.map((sub) => {
                              const sm = st.subjectsMarks[sub._id];
                              return (
                                <td key={sub._id} className="p-3 text-center">
                                  {sm ? (
                                    sm.isAbsent ? (
                                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                        ABS
                                      </span>
                                    ) : sm.marksObtained !== '' ? (
                                      <div className="font-semibold text-slate-800">
                                        <span>{sm.marksObtained}</span>
                                        <span className="text-[10px] text-slate-400 ml-0.5">/{sm.totalMarks}</span>
                                        <span
                                          className={`ml-1 text-[10px] font-bold px-1 rounded ${
                                            sm.marksObtained >= 80
                                              ? 'text-emerald-700 bg-emerald-50'
                                              : sm.marksObtained < 40
                                              ? 'text-rose-700 bg-rose-50'
                                              : 'text-indigo-700 bg-indigo-50'
                                          }`}
                                        >
                                          {sm.grade}
                                        </span>
                                      </div>
                                    ) : (
                                      <span className="text-slate-300 font-medium">—</span>
                                    )
                                  ) : (
                                    <span className="text-slate-300 font-medium">—</span>
                                  )}
                                </td>
                              );
                            })}
                            <td className="p-3 text-center font-black text-slate-900 bg-slate-50/50">
                              {st.totalMarksObtained} <span className="text-[10px] text-slate-400 font-normal">/{st.totalMarksPossible}</span>
                            </td>
                            <td className="p-3 text-center font-bold text-indigo-700 bg-indigo-50/30">
                              {st.percentage}%
                            </td>
                            <td className="p-3 text-center">
                              <span
                                className={`inline-block px-2 py-0.5 rounded font-black text-xs ${
                                  st.overallGrade === 'A+' || st.overallGrade === 'A'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : st.overallGrade === 'F'
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-indigo-100 text-indigo-800'
                                }`}
                              >
                                {st.overallGrade}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              {st.passStatus === 'PASS' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> PASS
                                </span>
                              )}
                              {st.passStatus === 'FAIL' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                  <XCircle className="w-3 h-3 text-rose-600" /> FAIL
                                </span>
                              )}
                              {st.passStatus === 'Pending' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                  Pending
                                </span>
                              )}
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={studentReviews[st.student._id] !== undefined ? studentReviews[st.student._id] : (st.teacherRemarks || '')}
                                onChange={(e) => handleStudentReviewChange(st.student._id, e.target.value)}
                                placeholder="Enter teacher review & remarks for student..."
                                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                              />
                            </td>
                            <td className="p-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleOpenStudentReport(st.student._id)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors border border-indigo-200/60 cursor-pointer"
                                title="View & Download complete marksheet across all subjects"
                              >
                                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Report Card</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* CREATE / EDIT HOMEWORK MODAL */}
      <Modal
        isOpen={isHwModalOpen}
        onClose={() => {
          setIsHwModalOpen(false);
          setEditingHwId(null);
        }}
        title={editingHwId ? "Edit Homework Assignment" : "Assign Homework Task"}
      >
        <form onSubmit={handleSaveHomework} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold mb-1">Subject *</label>
            <select
              required
              value={hwForm.subjectId}
              onChange={(e) => setHwForm({ ...hwForm, subjectId: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
            >
              <option value="">Select Subject...</option>
              {subjects
                .filter((s) => s.classId?._id === selectedClassId || s.classId === selectedClassId)
                .map((sub) => (
                  <option key={sub._id} value={sub._id}>{sub.name}</option>
                ))}
            </select>
          </div>
          <div>
            <label className="block font-semibold mb-1">Homework Title *</label>
            <input
              type="text"
              required
              value={hwForm.title}
              onChange={(e) => setHwForm({ ...hwForm, title: e.target.value })}
              placeholder="e.g. Exercise 4.2 Quadratic Equations"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Description / Instructions *</label>
            <textarea
              required
              rows={3}
              value={hwForm.description}
              onChange={(e) => setHwForm({ ...hwForm, description: e.target.value })}
              placeholder="Detailed instructions for students..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Due Date *</label>
              <input
                type="date"
                required
                value={hwForm.dueDate}
                onChange={(e) => setHwForm({ ...hwForm, dueDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Max Marks</label>
              <input
                type="number"
                value={hwForm.maxMarks}
                onChange={(e) => setHwForm({ ...hwForm, maxMarks: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-100">
            <div>
              <label className="block font-semibold mb-1">Attachment PDF URL / Link</label>
              <input
                type="text"
                value={hwForm.attachmentUrl}
                onChange={(e) => setHwForm({ ...hwForm, attachmentUrl: e.target.value })}
                placeholder="/documents/Grade10_Mathematics_Polynomials_Worksheet.pdf"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px]"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Attachment Display Label</label>
              <input
                type="text"
                value={hwForm.attachmentTitle}
                onChange={(e) => setHwForm({ ...hwForm, attachmentTitle: e.target.value })}
                placeholder="e.g. Polynomials Worksheet PDF"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsHwModalOpen(false);
                setEditingHwId(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmittingHw}
            >
              {editingHwId ? "Save Changes" : "Assign Homework"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* EXTRACT TIMETABLE FROM PDF MODAL */}
      <Modal
        isOpen={isExtractModalOpen}
        onClose={() => setIsExtractModalOpen(false)}
        title="Extract & Import Timetable from PDF"
      >
        <form onSubmit={handleExtractPdfSubmit} className="space-y-4 text-xs">
          <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200/80 text-indigo-900 space-y-1">
            <p className="font-bold flex items-center gap-1.5 text-xs text-indigo-900">
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
              Automated PDF Timetable Extraction
            </p>
            <p className="text-[11px] text-indigo-700 leading-relaxed">
              Upload your school's master timetable PDF or extract directly from the preloaded schedule. Our parsing engine automatically reads period numbers, start/end times, subjects, faculty names, and classroom venues directly into your grid!
            </p>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Select Timetable PDF File
            </label>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setSelectedPdfFile(e.target.files?.[0] || null)}
              className="w-full p-2 border border-slate-200 rounded-xl bg-slate-50 text-xs cursor-pointer"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              {selectedPdfFile
                ? `Selected: ${selectedPdfFile.name} (${(selectedPdfFile.size / 1024).toFixed(1)} KB)`
                : 'Default: Extracting from official demo "Grade10_Academic_Master_Timetable.pdf"'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Assign to Day</label>
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
              >
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 pt-5">
              <input
                type="checkbox"
                id="saveTimetableCheck"
                checked={saveExtractedToDb}
                onChange={(e) => setSaveExtractedToDb(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
              />
              <label htmlFor="saveTimetableCheck" className="font-semibold text-slate-700 cursor-pointer">
                Save to Database
              </label>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsExtractModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              icon={Sparkles}
              isLoading={extractingPdf}
            >
              Extract & Apply Grid
            </Button>
          </div>
        </form>
      </Modal>

      {/* TIMETABLE ROUTINE DESIGNER & MULTI-DAY BULK REPLICATOR MODAL */}
      <Modal
        isOpen={isDesignerModalOpen}
        onClose={() => setIsDesignerModalOpen(false)}
        title="Timetable Routine Designer & Editor"
        subtitle="Design your class timetable once and apply it across any or all days with a single click."
        maxWidth="max-w-4xl"
      >
        <form onSubmit={handleSaveDesignerSchedule} className="space-y-4 text-xs">
          {designerError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-semibold flex items-center justify-between">
              <span>{designerError}</span>
              <button
                type="button"
                onClick={() => setDesignerError('')}
                className="text-rose-600 font-bold ml-2 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* 1. MULTI-DAY SELECTION BOX (CORE USER REQUIREMENT) */}
          <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-2xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="font-bold text-indigo-950 text-sm flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-indigo-600" />
                  Target Days Selection (Apply to Multiple Days)
                </h4>
                <p className="text-[11px] text-indigo-700/90 mt-0.5">
                  Select which days will adopt this exact timetable routine simultaneously:
                </p>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setDesignerTargetDays(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'])}
                  className="px-2.5 py-1 rounded-lg bg-indigo-100/90 hover:bg-indigo-200 text-indigo-800 text-[11px] font-bold transition-colors cursor-pointer"
                >
                  Mon - Fri (Weekdays)
                </button>
                <button
                  type="button"
                  onClick={() => setDesignerTargetDays(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'])}
                  className="px-2.5 py-1 rounded-lg bg-indigo-100/90 hover:bg-indigo-200 text-indigo-800 text-[11px] font-bold transition-colors cursor-pointer"
                >
                  Mon - Sat (All Days)
                </button>
                <button
                  type="button"
                  onClick={() => setDesignerTargetDays([selectedDay === 'Sunday' ? 'Monday' : selectedDay])}
                  className="px-2.5 py-1 rounded-lg bg-white border border-indigo-200 text-indigo-700 text-[11px] font-semibold hover:bg-indigo-50 transition-colors cursor-pointer"
                >
                  Only {selectedDay === 'Sunday' ? 'Monday' : selectedDay}
                </button>
              </div>
            </div>

            {/* Day Toggle Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 pt-1">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((d) => {
                const isChecked = designerTargetDays.includes(d);
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleTargetDay(d)}
                    className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-between border transition-all cursor-pointer ${
                      isChecked
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:bg-indigo-50/40'
                    }`}
                  >
                    <span>{d}</span>
                    <span
                      className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                        isChecked ? 'bg-white text-indigo-700 font-extrabold' : 'border border-slate-300'
                      }`}
                    >
                      {isChecked ? '✓' : ''}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active Selected Info Pill */}
            <div className="flex items-center gap-2 text-[11px] font-semibold text-indigo-900 bg-white/80 px-3 py-1.5 rounded-xl border border-indigo-100">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>
                Schedule will be applied to <strong>{designerTargetDays.length} day(s)</strong>: {designerTargetDays.join(', ')}
              </span>
            </div>
          </div>

          {/* 2. TEMPLATE ACTIONS & PERIOD LIST CONTROLS */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800 text-sm">Periods Schedule Routine</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                {designerPeriods.length} Periods
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setDesignerPeriods(getStandard8Periods())}
                className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-semibold transition-colors cursor-pointer"
              >
                Standard 8 Periods
              </button>
              <button
                type="button"
                onClick={() => setDesignerPeriods(getStandard6Periods())}
                className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-semibold transition-colors cursor-pointer"
              >
                6 Periods
              </button>
              <button
                type="button"
                onClick={handleAddDesignerPeriod}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-bold hover:bg-indigo-100 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Period
              </button>
            </div>
          </div>

          {/* 3. PERIOD ROWS EDITOR */}
          <div className="space-y-3 max-h-[440px] overflow-y-auto pr-1">
            {designerPeriods.map((p, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-xl border transition-all ${
                  p.isBreak
                    ? 'bg-amber-50/60 border-amber-200'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  {/* Period Badge & Break Toggle */}
                  <div className="flex items-center gap-2.5">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 font-bold text-xs">
                      P{p.periodNumber}
                    </span>

                    <div className="inline-flex rounded-lg p-0.5 bg-slate-100 border border-slate-200">
                      <button
                        type="button"
                        onClick={() => handleDesignerPeriodChange(idx, 'isBreak', false)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                          !p.isBreak ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500'
                        }`}
                      >
                        Lecture
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDesignerPeriodChange(idx, 'isBreak', true)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                          p.isBreak ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-500'
                        }`}
                      >
                        Recess / Break
                      </button>
                    </div>
                  </div>

                  {/* Timing Inputs */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-semibold text-slate-400">Time:</span>
                    <input
                      type="text"
                      value={p.startTime}
                      onChange={(e) => handleDesignerPeriodChange(idx, 'startTime', e.target.value)}
                      placeholder="08:30 AM"
                      className="w-20 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-center font-mono font-semibold text-slate-800 text-[11px]"
                    />
                    <span className="text-slate-400">-</span>
                    <input
                      type="text"
                      value={p.endTime}
                      onChange={(e) => handleDesignerPeriodChange(idx, 'endTime', e.target.value)}
                      placeholder="09:15 AM"
                      className="w-20 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-center font-mono font-semibold text-slate-800 text-[11px]"
                    />
                  </div>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveDesignerPeriod(idx)}
                    title="Remove Period"
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors self-end md:self-center cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Subject, Faculty & Venue Fields */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 mt-2.5 pt-2 border-t border-slate-100">
                  {p.isBreak ? (
                    <div className="col-span-3 flex items-center justify-between bg-amber-100/50 rounded-lg px-3 py-2 text-amber-900 font-semibold text-xs">
                      <span>Recess & Nutritional Break (Cafeteria / Grounds)</span>
                      <input
                        type="text"
                        value={p.roomNumber}
                        onChange={(e) => handleDesignerPeriodChange(idx, 'roomNumber', e.target.value)}
                        placeholder="Cafeteria / Courtyard"
                        className="px-2 py-1 bg-white border border-amber-300 rounded text-xs w-48 text-right font-normal"
                      />
                    </div>
                  ) : (
                    <>
                      {/* Subject Selection */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                          Subject
                        </label>
                        <select
                          value={p.subjectId}
                          onChange={(e) => handleDesignerPeriodChange(idx, 'subjectId', e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800 text-xs"
                        >
                          <option value="">-- Choose Subject --</option>
                          {subjects.map((sub) => (
                            <option key={sub._id} value={sub._id}>
                              {sub.name} {sub.code ? `(${sub.code})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Faculty / Instructor */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                          Faculty / Instructor
                        </label>
                        <select
                          value={p.teacherId}
                          onChange={(e) => handleDesignerPeriodChange(idx, 'teacherId', e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800 text-xs"
                        >
                          <option value="">-- Choose Teacher --</option>
                          {teachersList.map((tch) => (
                            <option key={tch._id} value={tch._id}>
                              {tch.firstName} {tch.lastName} ({tch.employeeId || 'Faculty'})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Classroom / Venue */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                          Classroom / Venue
                        </label>
                        <input
                          type="text"
                          value={p.roomNumber}
                          onChange={(e) => handleDesignerPeriodChange(idx, 'roomNumber', e.target.value)}
                          placeholder="e.g. Room 204, ICT Lab"
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800 text-xs"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* 4. MODAL FOOTER */}
          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-[11px] text-slate-500">
              Changes will update MongoDB timetable records for all {designerTargetDays.length} selected days.
            </span>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsDesignerModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                icon={Save}
                isLoading={isSavingSchedule}
              >
                Save & Apply to {designerTargetDays.length} Days
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* 5. MARKSHEET PREVIEW MODAL */}
      <Modal
        isOpen={isMarksheetPreviewOpen}
        onClose={() => setIsMarksheetPreviewOpen(false)}
        title="Official Examination Marksheet Preview"
        subtitle="Comprehensive class performance records, grades, result status, and verification seal."
        maxWidth="max-w-5xl"
        footer={
          <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-slate-500 font-medium">
              Official academic performance report. Passing criteria is 40% and above.
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                icon={Download}
                onClick={handleExportMarksheetCsv}
              >
                Export CSV
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={Printer}
                onClick={handlePrintMarksheet}
              >
                Print Marksheet
              </Button>
            </div>
          </div>
        }
      >
        <div id="printable-marksheet" className="space-y-6 text-slate-800">
          {/* Header Banner */}
          <div className="border-b-2 border-slate-900 pb-4 text-center sm:text-left sm:flex sm:justify-between sm:items-end">
            <div>
              <div className="inline-block px-2.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold text-[10px] tracking-wider uppercase mb-1">
                Official Academic Performance Record
              </div>
              <h2 className="text-xl font-black tracking-tight text-slate-900">
                {exams.find((e) => e._id === selectedExamId)?.name || 'Terminal Examination'} Marksheet
              </h2>
              <div className="text-xs text-slate-600 mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                <span>
                  <strong>Class:</strong>{' '}
                  {classes.find((c) => c._id === selectedClassId)?.name || 'Class'}{' '}
                  (Section {sections.find((s) => s._id === selectedSectionId)?.name || 'A'})
                </span>
                <span>
                  <strong>Subject:</strong>{' '}
                  {subjects.find((s) => s._id === selectedExamSubjectId)?.name || 'Subject'}{' '}
                  ({subjects.find((s) => s._id === selectedExamSubjectId)?.code || '—'})
                </span>
                <span>
                  <strong>Maximum Marks:</strong> 100
                </span>
                <span>
                  <strong>Passing Marks:</strong> 40 (40%)
                </span>
              </div>
            </div>
            <div className="text-right text-xs text-slate-500 mt-2 sm:mt-0">
              <p>
                <strong>Date:</strong>{' '}
                {new Date().toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
              <p className="text-[11px] text-slate-400">Status: Published Evaluation</p>
            </div>
          </div>

          {/* Quick Analytics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
              <div className="text-xs text-slate-500 font-medium">Total Students</div>
              <div className="text-xl font-bold text-slate-800 mt-0.5">
                {marksheetAnalytics.total}
              </div>
              <div className="text-[10px] text-slate-400">Enrolled Roster</div>
            </div>
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
              <div className="text-xs text-emerald-700 font-medium">Passed Students</div>
              <div className="text-xl font-bold text-emerald-700 mt-0.5">
                {marksheetAnalytics.passed}{' '}
                <span className="text-xs font-normal">({marksheetAnalytics.passRate}%)</span>
              </div>
              <div className="text-[10px] text-emerald-600 font-medium">Score ≥ 40%</div>
            </div>
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-center">
              <div className="text-xs text-rose-700 font-medium">Failed Students</div>
              <div className="text-xl font-bold text-rose-700 mt-0.5">
                {marksheetAnalytics.failed}
              </div>
              <div className="text-[10px] text-rose-600 font-medium">Score &lt; 40%</div>
            </div>
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-center">
              <div className="text-xs text-indigo-700 font-medium">Class Average</div>
              <div className="text-xl font-bold text-indigo-700 mt-0.5">
                {marksheetAnalytics.avgMarks}
              </div>
              <div className="text-[10px] text-indigo-600 font-medium">
                Highest: {marksheetAnalytics.maxScore} / 100
              </div>
            </div>
          </div>

          {/* Marksheet Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                  <th className="p-2.5 text-center w-14">Roll #</th>
                  <th className="p-2.5 w-28">Student ID</th>
                  <th className="p-2.5">Student Full Name</th>
                  <th className="p-2.5 text-center w-28">Marks (100)</th>
                  <th className="p-2.5 text-center w-24">Percentage</th>
                  <th className="p-2.5 text-center w-20">Grade</th>
                  <th className="p-2.5 text-center w-28">Result Status</th>
                  <th className="p-2.5 w-44">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {marksheet.map((item) => {
                  const result = getStudentResult(item.marksObtained, item.totalMarks, item.isAbsent);
                  return (
                    <tr key={item.student._id} className="hover:bg-slate-50/70">
                      <td className="p-2.5 text-center font-bold text-slate-700">
                        {item.student.rollNumber}
                      </td>
                      <td className="p-2.5 font-mono text-slate-600">
                        {item.student.studentId}
                      </td>
                      <td className="p-2.5 font-semibold text-slate-900">
                        {item.student.firstName} {item.student.lastName}
                      </td>
                      <td className="p-2.5 text-center font-bold text-slate-900">
                        {item.marksObtained !== '' ? item.marksObtained : '—'}
                      </td>
                      <td className="p-2.5 text-center font-medium text-slate-700">
                        {item.marksObtained !== '' ? `${result.percentage}%` : '—'}
                      </td>
                      <td className="p-2.5 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded font-black text-xs ${
                            result.grade === 'A+' || result.grade === 'A'
                              ? 'bg-emerald-100 text-emerald-800'
                              : result.grade === 'F'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-indigo-100 text-indigo-800'
                          }`}
                        >
                          {result.grade}
                        </span>
                      </td>
                      <td className="p-2.5 text-center">
                        {result.status === 'PASS' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> PASS
                          </span>
                        )}
                        {result.status === 'FAIL' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            <XCircle className="w-3 h-3 text-rose-600" /> FAIL
                          </span>
                        )}
                        {result.status === 'Pending' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            Pending
                          </span>
                        )}
                        {result.status === 'Absent' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            Absent
                          </span>
                        )}
                      </td>
                      <td className="p-2.5 text-[11px] text-slate-600">
                        {result.remark}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Verification Signatures Footer */}
          <div className="pt-8 border-t border-slate-200 grid grid-cols-3 gap-6 text-center text-xs">
            <div>
              <div className="border-b border-dashed border-slate-400 h-8 mb-2"></div>
              <p className="font-bold text-slate-800">Subject Teacher</p>
              <p className="text-[10px] text-slate-500">Sign & Date</p>
            </div>
            <div>
              <div className="border-b border-dashed border-slate-400 h-8 mb-2"></div>
              <p className="font-bold text-slate-800">Academic Coordinator</p>
              <p className="text-[10px] text-slate-500">Sign & Date</p>
            </div>
            <div>
              <div className="border-b border-dashed border-slate-400 h-8 mb-2"></div>
              <p className="font-bold text-slate-800">Principal / Controller of Exams</p>
              <p className="text-[10px] text-slate-500">Official Stamp & Seal</p>
            </div>
          </div>
        </div>
      </Modal>

      {/* 6. INDIVIDUAL STUDENT COMPLETE MARKSHEET (REPORT CARD) MODAL */}
      <Modal
        isOpen={isStudentReportModalOpen}
        onClose={() => setIsStudentReportModalOpen(false)}
        title="Student Examination Marksheet & Report Card"
        subtitle="Complete academic report across all subjects with teacher qualitative remarks"
        maxWidth="max-w-4xl"
        footer={
          <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-slate-500 font-medium">
              Official Academic Transcript • Generated by Central Examination Board
            </span>
            <div className="flex items-center gap-2">
              {selectedStudentReport?.reportCardId && (
                <Button
                  variant="secondary"
                  size="sm"
                  icon={Save}
                  isLoading={isSavingStudentReview}
                  onClick={handleSaveStudentReview}
                >
                  Save Remarks
                </Button>
              )}
              <Button
                variant="primary"
                size="sm"
                icon={Printer}
                onClick={() => window.print()}
              >
                Download / Print Marksheet
              </Button>
            </div>
          </div>
        }
      >
        {loadingStudentReport ? (
          <LoadingSpinner text="Generating student complete marksheet..." />
        ) : !selectedStudentReport ? (
          <EmptyState
            icon={FileText}
            title="Report Not Found"
            description="Could not compile report card for this student."
          />
        ) : (
          <div id="printable-student-report" className="space-y-6 text-slate-800 p-2 sm:p-4">
            {/* 1. Official Header */}
            <div className="border-b-2 border-slate-900 pb-4 text-center sm:text-left sm:flex sm:justify-between sm:items-center">
              <div>
                <div className="inline-block px-2.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-black text-[10px] tracking-wider uppercase mb-1">
                  OFFICIAL STUDENT PERFORMANCE TRANSCRIPT
                </div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900">
                  {selectedStudentReport.exam.name}
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Academic Session: 2025-2026 • Term Examination Result
                </p>
              </div>
              <div className="mt-3 sm:mt-0 text-center sm:text-right">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                    selectedStudentReport.passStatus === 'PASS'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-rose-100 text-rose-800 border border-rose-300'
                  }`}
                >
                  RESULT: {selectedStudentReport.passStatus}
                </span>
                <div className="text-[11px] text-slate-400 mt-1">
                  Rank in Class: <strong>#{selectedStudentReport.classRank}</strong>
                </div>
              </div>
            </div>

            {/* 2. Student Bio-Data Card */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Student Name</span>
                <div className="font-bold text-slate-900 text-sm mt-0.5">
                  {selectedStudentReport.student.fullName}
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Roll Number</span>
                <div className="font-bold text-slate-800 mt-0.5">
                  #{selectedStudentReport.student.rollNumber}
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Student ID</span>
                <div className="font-mono font-bold text-indigo-600 mt-0.5">
                  {selectedStudentReport.student.studentId}
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Class & Section</span>
                <div className="font-bold text-slate-800 mt-0.5">
                  {selectedStudentReport.student.class} - {selectedStudentReport.student.section}
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Parent / Guardian</span>
                <div className="font-semibold text-slate-800 mt-0.5">
                  {selectedStudentReport.student.parentName}
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Attendance</span>
                <div className="font-semibold text-slate-800 mt-0.5">
                  {selectedStudentReport.attendancePercentage}% Present
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Gender</span>
                <div className="font-semibold text-slate-800 mt-0.5">
                  {selectedStudentReport.student.gender || '—'}
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Issue Date</span>
                <div className="font-semibold text-slate-800 mt-0.5">
                  {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </div>
            </div>

            {/* 3. All-Subjects Marks Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                    <th className="p-3 w-24">Subject Code</th>
                    <th className="p-3">Subject Name</th>
                    <th className="p-3 text-center w-24">Max Marks</th>
                    <th className="p-3 text-center w-24">Marks Obtained</th>
                    <th className="p-3 text-center w-20">%</th>
                    <th className="p-3 text-center w-20">Grade</th>
                    <th className="p-3 text-center w-24">Status</th>
                    <th className="p-3 w-40">Subject Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {selectedStudentReport.subjectsSummary.map((sub) => (
                    <tr key={sub.subjectId} className="hover:bg-slate-50/70">
                      <td className="p-3 font-mono font-bold text-slate-600">
                        {sub.subjectCode}
                      </td>
                      <td className="p-3 font-bold text-slate-900">
                        {sub.subjectName}
                      </td>
                      <td className="p-3 text-center font-semibold text-slate-600">
                        {sub.totalMarks}
                      </td>
                      <td className="p-3 text-center font-black text-slate-900">
                        {sub.marksObtained}
                      </td>
                      <td className="p-3 text-center font-semibold text-slate-700">
                        {sub.percentage}%
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded font-black text-xs ${
                            sub.grade === 'A+' || sub.grade === 'A'
                              ? 'bg-emerald-100 text-emerald-800'
                              : sub.grade === 'F'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-indigo-100 text-indigo-800'
                          }`}
                        >
                          {sub.grade}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            sub.status === 'PASS'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : sub.status === 'Absent'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {sub.status}
                        </span>
                      </td>
                      <td className="p-3 text-[11px] text-slate-600">
                        {sub.remarks || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 font-black border-t-2 border-slate-200 text-slate-900">
                    <td colSpan={2} className="p-3 uppercase tracking-wider text-xs">
                      Grand Total Across All Subjects
                    </td>
                    <td className="p-3 text-center text-slate-600">
                      {selectedStudentReport.totalMarksPossible}
                    </td>
                    <td className="p-3 text-center text-indigo-700 text-sm">
                      {selectedStudentReport.totalMarksObtained}
                    </td>
                    <td className="p-3 text-center text-indigo-700 text-sm">
                      {selectedStudentReport.percentage}%
                    </td>
                    <td className="p-3 text-center text-indigo-700">
                      {selectedStudentReport.overallGrade}
                    </td>
                    <td colSpan={2} className="p-3 text-center">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-black ${
                          selectedStudentReport.passStatus === 'PASS'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {selectedStudentReport.passStatus}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* 4. Teacher's Review & Observations Box */}
            <div className="bg-indigo-50/50 border border-indigo-200/70 p-4 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-xs text-indigo-900">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Class Teacher's Review & Academic Evaluation:</span>
                </div>
                <span className="text-[10px] text-slate-500">Qualitative Assessment</span>
              </div>
              <textarea
                rows={2}
                value={selectedStudentReport.teacherRemarks || ''}
                onChange={(e) =>
                  setSelectedStudentReport({
                    ...selectedStudentReport,
                    teacherRemarks: e.target.value,
                  })
                }
                placeholder="Type comprehensive qualitative review for this student..."
                className="w-full p-2.5 bg-white border border-indigo-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>

            {/* 5. Principal Remarks & Verification Signatures */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">
                Principal & Academic Board Remarks:
              </span>
              <p className="font-semibold text-slate-800 mt-0.5">
                "{selectedStudentReport.principalRemarks}"
              </p>
            </div>

            <div className="pt-8 border-t border-slate-200 grid grid-cols-3 gap-6 text-center text-xs">
              <div>
                <div className="border-b border-dashed border-slate-400 h-8 mb-2"></div>
                <p className="font-bold text-slate-800">Class Teacher</p>
                <p className="text-[10px] text-slate-500">Verified & Signed</p>
              </div>
              <div>
                <div className="border-b border-dashed border-slate-400 h-8 mb-2"></div>
                <p className="font-bold text-slate-800">Academic Coordinator</p>
                <p className="text-[10px] text-slate-500">Verified & Approved</p>
              </div>
              <div>
                <div className="border-b border-dashed border-slate-400 h-8 mb-2"></div>
                <p className="font-bold text-slate-800">Principal / Controller</p>
                <p className="text-[10px] text-slate-500">Institutional Seal</p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* 7. CONSOLIDATED BROADSHEET GAZETTE PRINT MODAL */}
      <Modal
        isOpen={isBroadsheetPreviewOpen}
        onClose={() => setIsBroadsheetPreviewOpen(false)}
        title="Class Consolidated Result Broadsheet (Master Gazette)"
        subtitle="Complete multi-subject examination master sheet for Class Teacher & Coordinator"
        maxWidth="max-w-6xl"
        footer={
          <div className="w-full flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">
              Official Academic Gazette for {classes.find((c) => c._id === selectedClassId)?.name}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                icon={Download}
                onClick={handleExportConsolidatedCsv}
              >
                Export CSV
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={Printer}
                onClick={() => window.print()}
              >
                Print Gazette
              </Button>
            </div>
          </div>
        }
      >
        <div id="printable-broadsheet" className="space-y-4 text-xs">
          <div className="border-b-2 border-slate-900 pb-3 text-center sm:text-left sm:flex sm:justify-between sm:items-end">
            <div>
              <div className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">
                CENTRAL EXAMINATION MASTER GAZETTE
              </div>
              <h2 className="text-xl font-black text-slate-900">
                {exams.find((e) => e._id === selectedExamId)?.name} — Consolidated Class Broadsheet
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Class: {classes.find((c) => c._id === selectedClassId)?.name} • Section:{' '}
                {sections.find((s) => s._id === selectedSectionId)?.name} • Session 2025-2026
              </p>
            </div>
            <div className="text-right text-[11px] text-slate-500">
              <p>Generated: {new Date().toLocaleDateString('en-GB')}</p>
              <p>Passing Threshold: 40% in all subjects</p>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px]">
                  <th className="p-2.5 text-center">Rank</th>
                  <th className="p-2.5 text-center">Roll #</th>
                  <th className="p-2.5">Student Full Name</th>
                  {consolidatedData.subjects.map((sub) => (
                    <th key={sub._id} className="p-2.5 text-center">
                      {sub.name}
                    </th>
                  ))}
                  <th className="p-2.5 text-center font-black">Grand Total</th>
                  <th className="p-2.5 text-center font-black">%</th>
                  <th className="p-2.5 text-center">Grade</th>
                  <th className="p-2.5 text-center">Result</th>
                  <th className="p-2.5">Teacher Review</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {consolidatedData.students.map((st) => (
                  <tr key={st.student._id} className="hover:bg-slate-50">
                    <td className="p-2.5 text-center font-bold">#{st.classRank}</td>
                    <td className="p-2.5 text-center font-bold">{st.student.rollNumber}</td>
                    <td className="p-2.5 font-bold">{st.student.firstName} {st.student.lastName}</td>
                    {consolidatedData.subjects.map((sub) => {
                      const sm = st.subjectsMarks[sub._id];
                      return (
                        <td key={sub._id} className="p-2.5 text-center">
                          {sm ? (sm.isAbsent ? 'ABS' : sm.marksObtained !== '' ? sm.marksObtained : '—') : '—'}
                        </td>
                      );
                    })}
                    <td className="p-2.5 text-center font-black text-slate-900 bg-slate-50">
                      {st.totalMarksObtained} / {st.totalMarksPossible}
                    </td>
                    <td className="p-2.5 text-center font-bold text-indigo-700">{st.percentage}%</td>
                    <td className="p-2.5 text-center font-bold">{st.overallGrade}</td>
                    <td className="p-2.5 text-center font-bold">
                      <span className={st.passStatus === 'PASS' ? 'text-emerald-700' : 'text-rose-700'}>
                        {st.passStatus}
                      </span>
                    </td>
                    <td className="p-2.5 text-[11px] text-slate-600 max-w-[220px] truncate">
                      {studentReviews[st.student._id] || st.teacherRemarks || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pt-6 border-t border-slate-200 grid grid-cols-3 gap-6 text-center text-xs">
            <div>
              <div className="border-b border-dashed border-slate-400 h-6 mb-1"></div>
              <p className="font-bold">Class Teacher Signature</p>
            </div>
            <div>
              <div className="border-b border-dashed border-slate-400 h-6 mb-1"></div>
              <p className="font-bold">Academic Coordinator</p>
            </div>
            <div>
              <div className="border-b border-dashed border-slate-400 h-6 mb-1"></div>
              <p className="font-bold">Principal Official Seal</p>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AcademicsPage;
