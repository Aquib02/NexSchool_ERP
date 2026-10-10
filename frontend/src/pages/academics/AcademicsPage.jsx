import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';
import Modal from '../../components/common/Modal.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import academicsService from '../../services/academicsService.js';
import adminService from '../../services/adminService.js';

export const AcademicsPage = () => {
  const [activeTab, setActiveTab] = useState('attendance');
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
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [timetableData, setTimetableData] = useState([]);

  // 3. HOMEWORK STATE
  const [homeworkList, setHomeworkList] = useState([]);
  const [isHwModalOpen, setIsHwModalOpen] = useState(false);
  const [hwForm, setHwForm] = useState({
    title: '',
    description: '',
    subjectId: '',
    dueDate: '',
    maxMarks: 10,
  });

  // 4. EXAMS & MARKS STATE
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedExamSubjectId, setSelectedExamSubjectId] = useState('');
  const [marksheet, setMarksheet] = useState([]);
  const [isSavingMarks, setIsSavingMarks] = useState(false);

  // Load common metadata (classes, sections, subjects)
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [clsRes, secRes, subRes, exRes] = await Promise.all([
          adminService.getClasses(),
          adminService.getSections(),
          adminService.getSubjects(),
          academicsService.getExams().catch(() => ({ data: [] })),
        ]);
        setClasses(clsRes.data || []);
        setSections(secRes.data || []);
        setSubjects(subRes.data || []);
        setExams(exRes.data || []);

        if (clsRes.data?.length > 0) {
          setSelectedClassId(clsRes.data[0]._id);
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

  // Load Timetable
  useEffect(() => {
    if (activeTab === 'timetable' && selectedClassId && selectedSectionId) {
      fetchTimetable();
    }
  }, [activeTab, selectedClassId, selectedSectionId, selectedDay]);

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

  const handleCreateHomework = async (e) => {
    e.preventDefault();
    try {
      await academicsService.createHomework({
        ...hwForm,
        classId: selectedClassId,
        sectionId: selectedSectionId,
      });
      setIsHwModalOpen(false);
      setHwForm({ title: '', description: '', subjectId: '', dueDate: '', maxMarks: 10 });
      fetchHomework();
    } catch (err) {
      alert(err.message || 'Failed to assign homework');
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
        {[
          { id: 'attendance', label: 'Daily Attendance', icon: CalendarCheck },
          { id: 'timetable', label: 'Weekly Timetable', icon: Clock },
          { id: 'homework', label: 'Homework & Tasks', icon: BookOpen },
          { id: 'marks', label: 'Exams & Marks Entry', icon: Award },
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

      {/* TAB 1: DAILY ATTENDANCE REGISTER */}
      {activeTab === 'attendance' && (
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
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2 overflow-x-auto">
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-4 py-1.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                  selectedDay === day
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {day}
              </button>
            ))}
          </div>

          {timetableData.length === 0 ? (
            <EmptyState
              icon={Clock}
              title={`No timetable defined for ${selectedDay}`}
              description="Periods for this day have not been configured yet."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {timetableData.map((period) => (
                <Card
                  key={period._id || period.periodNumber}
                  className={period.isBreak ? 'bg-slate-50 border-dashed' : ''}
                >
                  <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2">
                    <span>Period #{period.periodNumber}</span>
                    <span>{period.startTime} - {period.endTime}</span>
                  </div>
                  {period.isBreak ? (
                    <p className="text-sm font-semibold text-slate-500 italic">Break Time</p>
                  ) : (
                    <>
                      <h4 className="text-base font-bold text-slate-900">
                        {period.subjectId?.name || 'Subject'}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        Teacher: {period.teacherId ? `${period.teacherId.firstName} ${period.teacherId.lastName}` : 'Unassigned'}
                      </p>
                      {period.roomNumber && (
                        <span className="inline-block mt-3 px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-semibold text-slate-600">
                          {period.roomNumber}
                        </span>
                      )}
                    </>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: HOMEWORK */}
      {activeTab === 'homework' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-800">Homework & Submissions</h3>
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => setIsHwModalOpen(true)}
            >
              Assign Homework
            </Button>
          </div>

          {homeworkList.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No homework assigned"
              description="Assign homework or review tasks for this section."
              actionText="Assign Homework"
              onAction={() => setIsHwModalOpen(true)}
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
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs font-semibold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                        {hw.submissions?.length || 0} Submissions
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: EXAMS & MARKS ENTRY */}
      {activeTab === 'marks' && (
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
              <div className="ml-auto">
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {marksheet.map((item, index) => {
                    const marks = Number(item.marksObtained);
                    let grade = item.grade || '—';
                    if (item.marksObtained !== '') {
                      if (marks >= 90) grade = 'A+';
                      else if (marks >= 80) grade = 'A';
                      else if (marks >= 70) grade = 'B+';
                      else if (marks >= 60) grade = 'B';
                      else if (marks >= 50) grade = 'C';
                      else if (marks >= 40) grade = 'D';
                      else grade = 'F';
                    }

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
                              grade === 'A+' || grade === 'A'
                                ? 'success'
                                : grade === 'F'
                                ? 'danger'
                                : 'primary'
                            }
                          >
                            {grade}
                          </Badge>
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

      {/* CREATE HOMEWORK MODAL */}
      <Modal
        isOpen={isHwModalOpen}
        onClose={() => setIsHwModalOpen(false)}
        title="Assign Homework Task"
      >
        <form onSubmit={handleCreateHomework} className="space-y-3 text-xs">
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
          <div className="pt-2 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsHwModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Assign Homework</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AcademicsPage;
