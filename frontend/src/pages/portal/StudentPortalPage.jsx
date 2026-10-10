import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Calendar,
  Clock,
  BookOpen,
  Award,
  CreditCard,
  Bell,
  Bus,
  AlertTriangle,
  CheckCircle2,
  CalendarDays,
  FileText,
  User,
  ChevronRight,
  TrendingUp,
  Download,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import portalService from '../../services/portalService.js';
import studentService from '../../services/studentService.js';
import { useAuth } from '../../context/AuthContext.jsx';

export const StudentPortalPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = ['SUPER_ADMIN', 'PRINCIPAL', 'ADMINISTRATOR', 'TEACHER'].includes(user?.role?.name);

  const [loading, setLoading] = useState(true);
  const [portalData, setPortalData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // overview, timetable, homework, academics, fees, attendance
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [error, setError] = useState(null);

  // Admin student switcher state
  const [studentList, setStudentList] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');

  const fetchPortalData = async (targetId = null) => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (targetId) params.studentId = targetId;
      const res = await portalService.getStudentPortalData(params);
      if (res.data?.success) {
        setPortalData(res.data.data);
        if (res.data.data.student?._id) {
          setSelectedStudentId(res.data.data.student._id);
        }
      }
    } catch (err) {
      console.error('Failed to load student portal:', err);
      setError(err.response?.data?.message || 'Failed to load student portal data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceHistory = async () => {
    try {
      setAttendanceLoading(true);
      const params = {};
      if (selectedStudentId) params.studentId = selectedStudentId;
      const res = await portalService.getStudentAttendanceHistory(params);
      if (res.data?.success) {
        setAttendanceHistory(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load attendance logs:', err);
    } finally {
      setAttendanceLoading(false);
    }
  };

  // Load student list for admin switcher
  useEffect(() => {
    if (isAdmin) {
      studentService
        .getStudents({ limit: 50 })
        .then((res) => {
          if (res.data?.students) {
            setStudentList(res.data.students);
          }
        })
        .catch((e) => console.error('Failed to load students for admin preview', e));
    }
  }, [isAdmin]);

  const handleStudentSwitch = (newId) => {
    setSelectedStudentId(newId);
    setAttendanceHistory([]);
    fetchPortalData(newId);
  };

  useEffect(() => {
    fetchPortalData();
  }, []);

  useEffect(() => {
    if (activeTab === 'attendance' && attendanceHistory.length === 0) {
      fetchAttendanceHistory();
    }
  }, [activeTab]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-slate-500 font-medium">Loading Student Self-Service Portal...</p>
      </div>
    );
  }

  if (error || !portalData) {
    return (
      <div className="p-6">
        <Card className="max-w-xl mx-auto p-8 text-center border-rose-200 bg-rose-50/50">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800 mb-1">Portal Unavailable</h3>
          <p className="text-sm text-slate-600 mb-6">{error || 'No active student record could be found.'}</p>
          <Button onClick={fetchPortalData} variant="primary" icon={RefreshCw}>
            Retry Connection
          </Button>
        </Card>
      </div>
    );
  }

  const { student, summary, todaySchedule, homeworkList, reportCards, feeInvoices, transport, notices } = portalData;
  const isAttendanceLow = summary.attendancePercentage < 75;

  return (
    <div className="space-y-6 pb-12">
      {/* 0. Admin Live Simulation Banner */}
      {isAdmin && student && (
        <div className="bg-slate-900 text-white p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 border border-slate-700 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center font-bold text-indigo-400 shrink-0">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                  Admin Live Preview Mode
                </span>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30 font-medium">
                  Read-Only Student Experience
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Auditing student portal as <strong>{student.firstName} {student.lastName}</strong> ({student.studentId || 'ID'}).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            {studentList.length > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-400 font-medium whitespace-nowrap">Switch Student:</span>
                <select
                  value={selectedStudentId || student._id}
                  onChange={(e) => handleStudentSwitch(e.target.value)}
                  className="bg-slate-800 border border-slate-600 text-white rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {studentList.map((s) => (
                    <option key={s._id} value={s._id} className="text-slate-800 bg-white">
                      {s.firstName} {s.lastName} ({s.classId?.name || 'Class'})
                    </option>
                  ))}
                </select>
              </div>
            )}
            <Button
              size="sm"
              variant="secondary"
              onClick={() => navigate('/students')}
              className="text-xs shrink-0 whitespace-nowrap"
            >
              Student Directory &rarr;
            </Button>
          </div>
        </div>
      )}

      {/* 1. Low Attendance Alert Banner */}
      {isAttendanceLow && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center gap-3 text-amber-900">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-600 animate-bounce" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-sm text-amber-950">Attendance Alert Required</h4>
            <p className="text-xs text-amber-800 mt-0.5">
              Your cumulative attendance is currently <strong className="underline">{summary.attendancePercentage}%</strong>, which is below the mandatory 75% examination eligibility requirement.
            </p>
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setActiveTab('attendance')}
            className="shrink-0 border-amber-300 text-amber-900 hover:bg-amber-100"
          >
            Review Log
          </Button>
        </div>
      )}

      {/* 2. Hero Student Profile Card */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-indigo-950/20">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 -mb-16 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-500 to-indigo-300 p-0.5 shadow-lg shadow-indigo-900/50">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center overflow-hidden">
                {student.avatarUrl ? (
                  <img src={student.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-indigo-300" />
                )}
              </div>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {student.studentId || 'STU-ID'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {student.status || 'Active'}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
                {student.firstName} {student.lastName}
              </h1>
              <p className="text-sm text-slate-400 mt-1 flex items-center gap-2">
                <span>Class: <strong>{student.classId?.name || 'Class'} ({student.sectionId?.name || 'A'})</strong></span>
                <span>•</span>
                <span>Roll No: <strong>{student.rollNumber || 'N/A'}</strong></span>
                <span>•</span>
                <span>Session: <strong>{student.academicSessionId?.name || '2025-2026'}</strong></span>
              </p>
            </div>
          </div>

          {/* Quick Circular Attendance Gauge */}
          <div className="flex items-center gap-4 bg-white/5 backdrop-blur-md px-5 py-4 rounded-2xl border border-white/10 shrink-0">
            <div className="relative flex items-center justify-center">
              <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-800"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={isAttendanceLow ? 'text-amber-400' : 'text-emerald-400'}
                  strokeDasharray={`${summary.attendancePercentage}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-sm font-black text-white">{summary.attendancePercentage}%</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Attendance Rate</p>
              <p className="text-sm font-bold text-white mt-0.5">
                {summary.presentDays} / {summary.totalAttendanceDays} Days
              </p>
              <span className={`text-[11px] font-semibold ${isAttendanceLow ? 'text-amber-300' : 'text-emerald-300'}`}>
                {isAttendanceLow ? 'Below 75% Requirement' : 'Good Standing'}
              </span>
            </div>
          </div>
        </div>

        {/* 4 Key Metric Widgets */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-800/50 p-3.5 rounded-xl border border-slate-700/50">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-medium mb-1">
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" /> Pending Tasks
            </div>
            <p className="text-xl font-black text-white">{summary.pendingHomeworkCount}</p>
          </div>
          <div className="bg-slate-800/50 p-3.5 rounded-xl border border-slate-700/50">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-medium mb-1">
              <Award className="w-3.5 h-3.5 text-amber-400" /> Cumulative GPA
            </div>
            <p className="text-xl font-black text-white">{summary.latestGpa ? summary.latestGpa.toFixed(2) : '3.90'}</p>
          </div>
          <div className="bg-slate-800/50 p-3.5 rounded-xl border border-slate-700/50">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-medium mb-1">
              <CreditCard className="w-3.5 h-3.5 text-emerald-400" /> Fee Balance
            </div>
            <p className="text-xl font-black text-white">
              ${summary.pendingFeeBalance?.toLocaleString() || '0'}
            </p>
          </div>
          <div className="bg-slate-800/50 p-3.5 rounded-xl border border-slate-700/50">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-medium mb-1">
              <Bus className="w-3.5 h-3.5 text-blue-400" /> Bus Route
            </div>
            <p className="text-sm font-bold text-white truncate">
              {transport ? transport.routeId?.name || 'Assigned' : 'Self Commute'}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'overview', label: 'Today & Overview', icon: CalendarDays },
          { id: 'timetable', label: 'Class Timetable', icon: Clock },
          { id: 'homework', label: `Homework (${homeworkList.length})`, icon: BookOpen },
          { id: 'academics', label: 'Report Cards & GPA', icon: Award },
          { id: 'fees', label: 'Fees & Invoices', icon: CreditCard },
          { id: 'attendance', label: 'Attendance Log', icon: CheckCircle2 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 4. Tab Content Panels */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Schedule Preview */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-slate-800">Today's Schedule</h3>
                </div>
                <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </span>
              </div>

              {todaySchedule && todaySchedule.length > 0 ? (
                <div className="space-y-2.5">
                  {todaySchedule.map((p, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-indigo-50/50 border border-slate-200/70 transition-all"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm">
                          P{p.periodNumber || idx + 1}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">
                            {p.subjectId?.name || 'Subject'}
                          </p>
                          <p className="text-xs text-slate-500">
                            {p.teacherId ? `Prof. ${p.teacherId.firstName} ${p.teacherId.lastName}` : 'Assigned Faculty'} • Room {p.roomNumber || '101'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold text-indigo-900 bg-indigo-100/60 px-2 py-0.5 rounded-md">
                          {p.startTime || '09:00'} - {p.endTime || '09:45'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-600">No classes scheduled for today.</p>
                  <p className="text-xs text-slate-400 mt-0.5">Enjoy your weekend or study break!</p>
                </div>
              )}
            </Card>

            {/* Priority Active Homework */}
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-slate-800">Pending Homework & Assignments</h3>
                </div>
                <Button size="xs" variant="ghost" onClick={() => setActiveTab('homework')}>
                  View All ({homeworkList.length})
                </Button>
              </div>

              {homeworkList.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {homeworkList.slice(0, 3).map((hw) => (
                    <div key={hw._id} className="py-3 flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="primary" size="sm">
                            {hw.subjectId?.name || 'Subject'}
                          </Badge>
                          <span className="text-xs text-slate-400">Max Marks: {hw.maxMarks || 20}</span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-800">{hw.title}</h4>
                        <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{hw.description}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Due {new Date(hw.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-slate-500 text-sm">
                  <CheckCircle2 className="w-7 h-7 text-emerald-500 mx-auto mb-1" />
                  All caught up! No pending homework assignments.
                </div>
              )}
            </Card>
          </div>

          {/* Right Column: Circulars & Transport */}
          <div className="space-y-6">
            {/* Notices & Circulars */}
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Bell className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-slate-800">Campus Circulars</h3>
              </div>

              {notices && notices.length > 0 ? (
                <div className="space-y-3">
                  {notices.map((n) => (
                    <div key={n._id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 hover:border-indigo-200 transition-all">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                          {n.category || 'General'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(n.publishDate || n.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-800 leading-snug">{n.title}</h4>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{n.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-4">No active circulars at this moment.</p>
              )}
            </Card>

            {/* Transport Card */}
            {transport && (
              <Card className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50/40 border-blue-200/60">
                <div className="flex items-center gap-2 mb-3">
                  <Bus className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-blue-950">Transport Pass</h3>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-blue-100">
                    <span className="text-slate-500">Route</span>
                    <span className="font-bold text-slate-800">{transport.routeId?.name} (#{transport.routeId?.routeNumber})</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-blue-100">
                    <span className="text-slate-500">Bus Plate</span>
                    <span className="font-bold text-slate-800">{transport.vehicleId?.registrationNumber || 'BUS-01'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Driver Contact</span>
                    <span className="font-bold text-indigo-600">{transport.vehicleId?.driverName} ({transport.vehicleId?.driverPhone || 'N/A'})</span>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Timetable Tab */}
      {activeTab === 'timetable' && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Class Timetable & Schedule</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Standard weekly timetable for {student.classId?.name} - Section {student.sectionId?.name}
              </p>
            </div>
            <Button size="sm" variant="secondary" icon={Download} onClick={() => window.print()}>
              Print Schedule
            </Button>
          </div>

          {todaySchedule && todaySchedule.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {todaySchedule.map((p, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-indigo-300 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-indigo-100 text-indigo-800">
                      Period {p.periodNumber || idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      {p.startTime} - {p.endTime}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-800 text-base mb-1">{p.subjectId?.name || 'Subject'}</h4>
                  <p className="text-xs text-slate-500">Instructor: {p.teacherId ? `${p.teacherId.firstName} ${p.teacherId.lastName}` : 'Assigned Staff'}</p>
                  <p className="text-xs text-slate-400 mt-1">Location: Room {p.roomNumber || 'General Wing'}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No Timetable Configured"
              description="The academic timetable for this class and section has not been published yet."
            />
          )}
        </Card>
      )}

      {/* Homework Tab */}
      {activeTab === 'homework' && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Assigned Coursework & Homework</h3>
              <p className="text-xs text-slate-500 mt-0.5">Track your assignments and upcoming submission deadlines</p>
            </div>
          </div>

          {homeworkList.length > 0 ? (
            <div className="space-y-4">
              {homeworkList.map((hw) => {
                const isOverdue = new Date(hw.dueDate) < new Date();
                return (
                  <div
                    key={hw._id}
                    className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-200 shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 max-w-2xl">
                      <div className="flex items-center gap-2">
                        <Badge variant="primary">{hw.subjectId?.name || 'Subject'}</Badge>
                        <span className="text-xs font-medium text-slate-400">Max Marks: {hw.maxMarks || 20}</span>
                      </div>
                      <h4 className="text-base font-bold text-slate-900">{hw.title}</h4>
                      <p className="text-sm text-slate-600 leading-relaxed">{hw.description}</p>
                      {hw.instructions && (
                        <p className="text-xs text-indigo-600 bg-indigo-50 p-2 rounded-lg font-medium">
                          Note: {hw.instructions}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0 flex flex-col items-end gap-2">
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full border ${
                          isOverdue
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {isOverdue ? 'Overdue Deadline' : 'Upcoming Deadline'}
                      </span>
                      <p className="text-xs text-slate-500">Due: {new Date(hw.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="No Active Homework"
              description="There are no open assignments for your section at this time."
            />
          )}
        </Card>
      )}

      {/* Academics & Report Cards Tab */}
      {activeTab === 'academics' && (
        <Card className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Academic Report Cards & GPA</h3>
            <p className="text-xs text-slate-500 mt-0.5">Official terminal evaluation cards and grading summaries</p>
          </div>

          {reportCards.length > 0 ? (
            <div className="space-y-6">
              {reportCards.map((rc) => (
                <div key={rc._id} className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-200">
                    <div>
                      <h4 className="text-base font-bold text-slate-900">{rc.examId?.name || 'Term Examination'}</h4>
                      <p className="text-xs text-slate-500">
                        Published: {new Date(rc.createdAt).toLocaleDateString()} • Session {student.academicSessionId?.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs text-slate-400 uppercase font-semibold">Grade Point</p>
                        <p className="text-xl font-black text-indigo-600">{rc.gpa ? rc.gpa.toFixed(2) : '3.90'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-400 uppercase font-semibold">Class Rank</p>
                        <p className="text-xl font-black text-amber-600">#{rc.classRank || 1}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-400 uppercase font-semibold">Percentage</p>
                        <p className="text-xl font-black text-emerald-600">{rc.percentage ? `${rc.percentage.toFixed(1)}%` : '92.5%'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Subject Breakdown Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500">
                          <th className="pb-2 font-bold">Subject</th>
                          <th className="pb-2 font-bold text-center">Max Marks</th>
                          <th className="pb-2 font-bold text-center">Marks Obtained</th>
                          <th className="pb-2 font-bold text-center">Grade</th>
                          <th className="pb-2 font-bold">Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {rc.subjectsSummary?.map((s, sIdx) => (
                          <tr key={sIdx} className="text-slate-700">
                            <td className="py-2 font-semibold text-slate-900">{s.subjectName || 'Subject'}</td>
                            <td className="py-2 text-center text-slate-500">{s.totalMarks || 100}</td>
                            <td className="py-2 text-center font-bold text-indigo-600">{s.marksObtained}</td>
                            <td className="py-2 text-center font-bold">
                              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                                {s.grade || 'A'}
                              </span>
                            </td>
                            <td className="py-2 text-slate-500">{s.remarks || 'Excellent'}</td>
                          </tr>
                        )) || (
                          <tr>
                            <td colSpan="5" className="py-3 text-center text-slate-400">Standard subject grade records applied.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No Report Cards Available"
              description="Examination results have not been finalized or published for your account."
            />
          )}
        </Card>
      )}

      {/* Fees & Invoices Tab */}
      {activeTab === 'fees' && (
        <Card className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Fee Invoices & Payment Ledger</h3>
              <p className="text-xs text-slate-500 mt-0.5">Review your tuition, transport, and term fee balances</p>
            </div>
          </div>

          {feeInvoices.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold">
                    <th className="pb-3">Invoice #</th>
                    <th className="pb-3">Description</th>
                    <th className="pb-3">Due Date</th>
                    <th className="pb-3 text-right">Net Total</th>
                    <th className="pb-3 text-right">Amount Paid</th>
                    <th className="pb-3 text-right">Balance Due</th>
                    <th className="pb-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {feeInvoices.map((inv) => (
                    <tr key={inv._id} className="text-slate-700 hover:bg-slate-50">
                      <td className="py-3 font-mono font-bold text-slate-900">{inv.invoiceNumber || 'INV-001'}</td>
                      <td className="py-3 font-medium text-slate-800">{inv.feeStructureId?.name || 'Tuition Fee'}</td>
                      <td className="py-3 text-slate-500">{new Date(inv.dueDate).toLocaleDateString()}</td>
                      <td className="py-3 text-right font-bold text-slate-900">${inv.netPayable?.toLocaleString()}</td>
                      <td className="py-3 text-right font-semibold text-emerald-600">${inv.paidAmount?.toLocaleString()}</td>
                      <td className="py-3 text-right font-bold text-rose-600">${inv.balanceAmount?.toLocaleString()}</td>
                      <td className="py-3 text-center">
                        <Badge
                          variant={
                            inv.status === 'Paid'
                              ? 'success'
                              : inv.status === 'Partial'
                              ? 'warning'
                              : 'danger'
                          }
                          size="sm"
                        >
                          {inv.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="No Outstanding Invoices"
              description="All student fee ledgers are settled or clear of balances."
            />
          )}
        </Card>
      )}

      {/* Attendance Detailed Log Tab */}
      {activeTab === 'attendance' && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Comprehensive Attendance Log</h3>
              <p className="text-xs text-slate-500 mt-0.5">Historical attendance entries verified by faculty roll-calls</p>
            </div>
          </div>

          {attendanceLoading ? (
            <div className="py-12 flex justify-center">
              <LoadingSpinner />
            </div>
          ) : attendanceHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold">
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Day</th>
                    <th className="pb-3 text-center">Status</th>
                    <th className="pb-3">Remarks / Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {attendanceHistory.map((rec) => {
                    const recDate = new Date(rec.date);
                    return (
                      <tr key={rec._id} className="text-slate-700 hover:bg-slate-50">
                        <td className="py-3 font-semibold text-slate-900">{recDate.toLocaleDateString()}</td>
                        <td className="py-3 text-slate-500">{recDate.toLocaleDateString('en-US', { weekday: 'long' })}</td>
                        <td className="py-3 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                              rec.status === 'Present'
                                ? 'bg-emerald-100 text-emerald-800'
                                : rec.status === 'Late'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {rec.status}
                          </span>
                        </td>
                        <td className="py-3 text-slate-500">{rec.remarks || 'Regular campus session'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="No Attendance Records Found"
              description="Attendance logs will populate as regular faculty mark daily roll-calls."
            />
          )}
        </Card>
      )}
    </div>
  );
};

export default StudentPortalPage;
