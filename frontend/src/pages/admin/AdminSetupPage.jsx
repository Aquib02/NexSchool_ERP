import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  School,
  Calendar,
  Layers,
  BookOpen,
  Building2,
  Bell,
  Plus,
  CheckCircle,
  Clock,
  Trash2,
  Users,
  Check,
} from 'lucide-react';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';
import Modal from '../../components/common/Modal.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import adminService from '../../services/adminService.js';

export const AdminSetupPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'classes');
  const [loading, setLoading] = useState(false);

  // State collections
  const [sessions, setSessions] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [notices, setNotices] = useState([]);

  // Modals
  const [modalType, setModalType] = useState(null); // 'class', 'section', 'subject', 'session', 'notice'
  const [selectedClassId, setSelectedClassId] = useState('');

  // Form states
  const [classForm, setClassForm] = useState({ name: '', code: '', numericOrder: 1, description: '' });
  const [sectionForm, setSectionForm] = useState({ name: '', classId: '', capacity: 40, roomNumber: '' });
  const [subjectForm, setSubjectForm] = useState({ name: '', code: '', classId: '', totalMarks: 100, passMarks: 40 });
  const [sessionForm, setSessionForm] = useState({
    name: '',
    startDate: '',
    endDate: '',
    isCurrent: false,
    status: 'completed',
  });
  const [noticeForm, setNoticeForm] = useState({ title: '', content: '', category: 'General', isPinned: false });

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sessRes, clsRes, secRes, subRes, deptRes, notRes] = await Promise.all([
        adminService.getSessions().catch(() => ({ data: [] })),
        adminService.getClasses().catch(() => ({ data: [] })),
        adminService.getSections().catch(() => ({ data: [] })),
        adminService.getSubjects().catch(() => ({ data: [] })),
        adminService.getDepartments().catch(() => ({ data: [] })),
        adminService.getNotices().catch(() => ({ data: [] })),
      ]);

      setSessions(sessRes.data || []);
      setClasses(clsRes.data || []);
      setSections(secRes.data || []);
      setSubjects(subRes.data || []);
      setDepartments(deptRes.data || []);
      setNotices(notRes.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handlers
  const handleCreateClass = async (e) => {
    e.preventDefault();
    try {
      await adminService.createClass(classForm);
      setModalType(null);
      setClassForm({ name: '', code: '', numericOrder: 1, description: '' });
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to create class');
    }
  };

  const handleCreateSection = async (e) => {
    e.preventDefault();
    try {
      await adminService.createSection(sectionForm);
      setModalType(null);
      setSectionForm({ name: '', classId: '', capacity: 40, roomNumber: '' });
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to create section');
    }
  };

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    try {
      await adminService.createSubject(subjectForm);
      setModalType(null);
      setSubjectForm({ name: '', code: '', classId: '', totalMarks: 100, passMarks: 40 });
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to create subject');
    }
  };

  const handleCreateNotice = async (e) => {
    e.preventDefault();
    try {
      await adminService.createNotice(noticeForm);
      setModalType(null);
      setNoticeForm({ title: '', content: '', category: 'General', isPinned: false });
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to publish notice');
    }
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    try {
      await adminService.createSession(sessionForm);
      setModalType(null);
      setSessionForm({
        name: '',
        startDate: '',
        endDate: '',
        isCurrent: false,
        status: 'completed',
      });
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to create academic session');
    }
  };

  const handleSetCurrentSession = async (session) => {
    try {
      await adminService.updateSession(session._id, { isCurrent: true, status: 'active' });
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to set active session');
    }
  };

  const handleDeleteNotice = async (id) => {
    if (confirm('Are you sure you want to delete this notice?')) {
      await adminService.deleteNotice(id);
      loadData();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">School Administration & Setup</h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure classes, sections, curriculum subjects, academic sessions, and institutional circulars.
          </p>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-px">
        {[
          { id: 'classes', label: 'Classes & Sections', icon: Layers },
          { id: 'subjects', label: 'Subjects Catalog', icon: BookOpen },
          { id: 'sessions', label: 'Academic Sessions', icon: Calendar },
          { id: 'departments', label: 'Departments', icon: Building2 },
          { id: 'notices', label: 'Notices & Circulars', icon: Bell },
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

      {loading ? (
        <LoadingSpinner text="Loading setup data..." />
      ) : (
        <>
          {/* TAB 1: CLASSES & SECTIONS */}
          {activeTab === 'classes' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-800">Classes & Assigned Sections</h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" icon={Plus} onClick={() => setModalType('class')}>
                    Add Class
                  </Button>
                  <Button variant="primary" size="sm" icon={Plus} onClick={() => setModalType('section')}>
                    Add Section
                  </Button>
                </div>
              </div>

              {classes.length === 0 ? (
                <EmptyState
                  title="No classes created yet"
                  description="Begin setting up the school by adding grades/classes."
                  actionText="Add First Class"
                  onAction={() => setModalType('class')}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {classes.map((cls) => {
                    const classSections = sections.filter(
                      (s) => s.classId?._id === cls._id || s.classId === cls._id
                    );
                    return (
                      <Card key={cls._id} className="hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                              {cls.code}
                            </span>
                            <h4 className="text-base font-bold text-slate-800 mt-1">{cls.name}</h4>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {cls.description || 'General curriculum'}
                            </p>
                          </div>
                          <Badge variant="neutral">Order: {cls.numericOrder}</Badge>
                        </div>

                        <div className="mt-4 pt-4 border-t border-slate-100">
                          <p className="text-xs font-semibold text-slate-600 mb-2">Sections ({classSections.length}):</p>
                          <div className="flex flex-wrap gap-2">
                            {classSections.length > 0 ? (
                              classSections.map((sec) => (
                                <span
                                  key={sec._id}
                                  className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700 flex items-center gap-1.5"
                                >
                                  Section {sec.name}
                                  {sec.roomNumber && <span className="text-[10px] text-slate-400">({sec.roomNumber})</span>}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-slate-400 italic">No sections created</span>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SUBJECTS */}
          {activeTab === 'subjects' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-800">Academic Subjects</h3>
                <Button variant="primary" size="sm" icon={Plus} onClick={() => setModalType('subject')}>
                  Add Subject
                </Button>
              </div>

              {subjects.length === 0 ? (
                <EmptyState
                  title="No subjects registered"
                  description="Register curriculum subjects and allocate pass criteria."
                  actionText="Add Subject"
                  onAction={() => setModalType('subject')}
                />
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider">
                        <th className="p-3.5 font-semibold">Subject Code</th>
                        <th className="p-3.5 font-semibold">Subject Name</th>
                        <th className="p-3.5 font-semibold">Class</th>
                        <th className="p-3.5 font-semibold">Type</th>
                        <th className="p-3.5 font-semibold">Total Marks</th>
                        <th className="p-3.5 font-semibold">Pass Marks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {subjects.map((sub) => (
                        <tr key={sub._id} className="hover:bg-slate-50/80">
                          <td className="p-3.5 font-mono font-semibold text-indigo-600">{sub.code}</td>
                          <td className="p-3.5 font-medium text-slate-900">{sub.name}</td>
                          <td className="p-3.5">{sub.classId?.name || 'Class'}</td>
                          <td className="p-3.5">
                            <Badge variant={sub.type === 'Core' ? 'primary' : 'neutral'}>{sub.type}</Badge>
                          </td>
                          <td className="p-3.5 font-medium">{sub.totalMarks}</td>
                          <td className="p-3.5 font-medium text-emerald-600">{sub.passMarks}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ACADEMIC SESSIONS */}
          {activeTab === 'sessions' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-800">Academic Sessions & Past Years</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Manage historical academic sessions (e.g. 2023-2024, 2024-2025) and active school operating years.
                  </p>
                </div>
                <Button variant="primary" size="sm" icon={Plus} onClick={() => setModalType('session')}>
                  Add Academic Session
                </Button>
              </div>

              {sessions.length === 0 ? (
                <EmptyState
                  title="No academic sessions configured"
                  description="Add your first academic session or register past academic years."
                  actionText="Add Academic Session"
                  onAction={() => setModalType('session')}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sessions.map((sess) => (
                    <Card
                      key={sess._id}
                      className={`p-5 space-y-3 ${
                        sess.isCurrent ? 'border-indigo-400 bg-indigo-50/20 ring-2 ring-indigo-500/20' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-lg font-bold text-slate-900">{sess.name}</h4>
                            <Badge
                              variant={
                                sess.status === 'active' || sess.isCurrent
                                  ? 'success'
                                  : sess.status === 'completed'
                                  ? 'neutral'
                                  : 'warning'
                              }
                            >
                              {sess.status === 'completed'
                                ? 'Completed'
                                : sess.isCurrent || sess.status === 'active'
                                ? 'Active'
                                : 'Upcoming'}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {new Date(sess.startDate).toLocaleDateString()} — {new Date(sess.endDate).toLocaleDateString()}
                          </p>
                        </div>
                        {sess.isCurrent && (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                            <CheckCircle className="w-3.5 h-3.5" /> Current
                          </span>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-slate-400 text-[11px]">
                          {sess.isCurrent ? 'Live Operational Session' : 'Historical / Past Session'}
                        </span>
                        {!sess.isCurrent && (
                          <button
                            onClick={() => handleSetCurrentSession(sess)}
                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" /> Set as Current
                          </button>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: DEPARTMENTS */}
          {activeTab === 'departments' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-800">Operational Departments</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {departments.map((dept) => (
                  <Card key={dept._id}>
                    <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                      {dept.code}
                    </span>
                    <h4 className="text-sm font-bold text-slate-800 mt-2">{dept.name}</h4>
                    <p className="text-xs text-slate-500 mt-1">{dept.description || 'Departmental unit'}</p>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: NOTICES */}
          {activeTab === 'notices' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-800">Circulars & Announcements</h3>
                <Button variant="primary" size="sm" icon={Plus} onClick={() => setModalType('notice')}>
                  Publish Notice
                </Button>
              </div>

              {notices.length === 0 ? (
                <EmptyState
                  title="No notices published"
                  description="Publish school events, exam dates, or administrative memos."
                  actionText="Publish Notice"
                  onAction={() => setModalType('notice')}
                />
              ) : (
                <div className="space-y-3">
                  {notices.map((n) => (
                    <div
                      key={n._id}
                      className="p-5 bg-white rounded-2xl border border-slate-200 flex items-start justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {n.isPinned && <Badge variant="warning">Pinned</Badge>}
                          <Badge variant="primary">{n.category}</Badge>
                          <span className="text-xs text-slate-400">
                            {new Date(n.publishDate).toLocaleDateString()}
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-slate-900">{n.title}</h4>
                        <p className="text-xs text-slate-600 max-w-2xl whitespace-pre-line">{n.content}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteNotice(n._id)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* CREATE CLASS MODAL */}
      <Modal isOpen={modalType === 'class'} onClose={() => setModalType(null)} title="Create New Class">
        <form onSubmit={handleCreateClass} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold mb-1">Class Name</label>
            <input
              type="text"
              required
              value={classForm.name}
              onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
              placeholder="e.g. Class 10"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Class Code</label>
            <input
              type="text"
              required
              value={classForm.code}
              onChange={(e) => setClassForm({ ...classForm, code: e.target.value })}
              placeholder="e.g. C10"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Numeric Order (for sorting)</label>
            <input
              type="number"
              required
              value={classForm.numericOrder}
              onChange={(e) => setClassForm({ ...classForm, numericOrder: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModalType(null)}>Cancel</Button>
            <Button type="submit" variant="primary">Save Class</Button>
          </div>
        </form>
      </Modal>

      {/* CREATE SECTION MODAL */}
      <Modal isOpen={modalType === 'section'} onClose={() => setModalType(null)} title="Add Section to Class">
        <form onSubmit={handleCreateSection} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold mb-1">Select Class</label>
            <select
              required
              value={sectionForm.classId}
              onChange={(e) => setSectionForm({ ...sectionForm, classId: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
            >
              <option value="">Select a Class...</option>
              {classes.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-semibold mb-1">Section Name</label>
            <input
              type="text"
              required
              value={sectionForm.name}
              onChange={(e) => setSectionForm({ ...sectionForm, name: e.target.value })}
              placeholder="e.g. A"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Room Number</label>
            <input
              type="text"
              value={sectionForm.roomNumber}
              onChange={(e) => setSectionForm({ ...sectionForm, roomNumber: e.target.value })}
              placeholder="e.g. Room 102"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModalType(null)}>Cancel</Button>
            <Button type="submit" variant="primary">Save Section</Button>
          </div>
        </form>
      </Modal>

      {/* CREATE SUBJECT MODAL */}
      <Modal isOpen={modalType === 'subject'} onClose={() => setModalType(null)} title="Register Subject">
        <form onSubmit={handleCreateSubject} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold mb-1">Class</label>
            <select
              required
              value={subjectForm.classId}
              onChange={(e) => setSubjectForm({ ...subjectForm, classId: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
            >
              <option value="">Select Class...</option>
              {classes.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-semibold mb-1">Subject Name</label>
            <input
              type="text"
              required
              value={subjectForm.name}
              onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
              placeholder="e.g. Physics"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Subject Code</label>
            <input
              type="text"
              required
              value={subjectForm.code}
              onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
              placeholder="e.g. PHY-10"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-semibold mb-1">Total Marks</label>
              <input
                type="number"
                value={subjectForm.totalMarks}
                onChange={(e) => setSubjectForm({ ...subjectForm, totalMarks: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Pass Marks</label>
              <input
                type="number"
                value={subjectForm.passMarks}
                onChange={(e) => setSubjectForm({ ...subjectForm, passMarks: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModalType(null)}>Cancel</Button>
            <Button type="submit" variant="primary">Save Subject</Button>
          </div>
        </form>
      </Modal>

      {/* CREATE ACADEMIC SESSION MODAL */}
      <Modal isOpen={modalType === 'session'} onClose={() => setModalType(null)} title="Add Academic Session / Year">
        <form onSubmit={handleCreateSession} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Academic Year Name *</label>
            <input
              type="text"
              required
              value={sessionForm.name}
              onChange={(e) => setSessionForm({ ...sessionForm, name: e.target.value })}
              placeholder="e.g. 2024-2025 or 2023-2024"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
            />
            <span className="text-[11px] text-slate-400 mt-0.5 block">Format: YYYY-YYYY (e.g., 2024-2025 for past records)</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Start Date *</label>
              <input
                type="date"
                required
                value={sessionForm.startDate}
                onChange={(e) => setSessionForm({ ...sessionForm, startDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">End Date *</label>
              <input
                type="date"
                required
                value={sessionForm.endDate}
                onChange={(e) => setSessionForm({ ...sessionForm, endDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Session Lifecycle Status</label>
            <select
              value={sessionForm.status || 'completed'}
              onChange={(e) => setSessionForm({ ...sessionForm, status: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
            >
              <option value="completed">Completed (Past academic years like 2023-24, 2024-25)</option>
              <option value="active">Active (Current ongoing academic year)</option>
              <option value="upcoming">Upcoming (Future planned academic year)</option>
            </select>
          </div>

          <div className="flex items-center gap-2 pt-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <input
              type="checkbox"
              id="isCurrentSession"
              checked={sessionForm.isCurrent}
              onChange={(e) => setSessionForm({ ...sessionForm, isCurrent: e.target.checked })}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="isCurrentSession" className="text-xs text-slate-700 font-medium">
              Set as current active session for school operations
            </label>
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setModalType(null)}>Cancel</Button>
            <Button type="submit" variant="primary">Save Academic Session</Button>
          </div>
        </form>
      </Modal>

      {/* CREATE NOTICE MODAL */}
      <Modal isOpen={modalType === 'notice'} onClose={() => setModalType(null)} title="Publish School Circular">
        <form onSubmit={handleCreateNotice} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold mb-1">Title</label>
            <input
              type="text"
              required
              value={noticeForm.title}
              onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })}
              placeholder="e.g. Upcoming Sports Meet Schedule"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Content</label>
            <textarea
              required
              rows={4}
              value={noticeForm.content}
              onChange={(e) => setNoticeForm({ ...noticeForm, content: e.target.value })}
              placeholder="Write circular announcement details here..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="pinCheck"
              checked={noticeForm.isPinned}
              onChange={(e) => setNoticeForm({ ...noticeForm, isPinned: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="pinCheck" className="font-semibold text-slate-700">
              Pin notice to top of board
            </label>
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModalType(null)}>Cancel</Button>
            <Button type="submit" variant="primary">Publish Now</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminSetupPage;
