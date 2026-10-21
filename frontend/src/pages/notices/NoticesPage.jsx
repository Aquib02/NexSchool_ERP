import React, { useState, useEffect } from 'react';
import {
  BellRing,
  Pin,
  Search,
  Filter,
  Plus,
  Calendar,
  AlertTriangle,
  FileText,
  Paperclip,
  Trash2,
  Users,
  CheckCircle2,
  X,
  Megaphone,
} from 'lucide-react';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';
import Modal from '../../components/common/Modal.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import noticeService from '../../services/noticeService.js';
import { useAuth } from '../../context/AuthContext.jsx';

export const NoticesPage = () => {
  const { user, hasRole } = useAuth();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [audienceFilter, setAudienceFilter] = useState('All');

  // Modals
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
  const [noticeForm, setNoticeForm] = useState({
    title: '',
    content: '',
    category: 'General',
    targetAudience: ['All'],
    isPinned: false,
    expiryDate: '',
    attachmentUrl: '',
  });

  const [banner, setBanner] = useState({ type: '', text: '' });
  const showBanner = (type, text) => {
    setBanner({ type, text });
    setTimeout(() => setBanner({ type: '', text: '' }), 4000);
  };

  const loadNotices = async () => {
    try {
      setLoading(true);
      const isStudent = user?.role?.name === 'STUDENT';
      const params = {};
      if (categoryFilter !== 'All') params.category = categoryFilter;
      if (!isStudent && audienceFilter !== 'All') params.targetAudience = audienceFilter;
      if (search) params.search = search;

      const res = await noticeService.getNotices(params);
      const list = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.data?.data)
        ? res.data.data
        : Array.isArray(res)
        ? res
        : [];
      setNotices(list);
    } catch (err) {
      console.error(err);
      showBanner('error', 'Failed to load notices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotices();
  }, [categoryFilter, audienceFilter]);

  const handleCreateNotice = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await noticeService.createNotice(noticeForm);
      showBanner('success', 'Notice published and broadcasted');
      setIsNoticeModalOpen(false);
      setNoticeForm({
        title: '',
        content: '',
        category: 'General',
        targetAudience: ['All'],
        isPinned: false,
        expiryDate: '',
        attachmentUrl: '',
      });
      await loadNotices();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || err.message || 'Failed to publish notice';
      showBanner('error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNotice = async (id) => {
    if (!window.confirm('Are you sure you want to delete this circular?')) return;
    try {
      await noticeService.deleteNotice(id);
      showBanner('success', 'Notice removed');
      await loadNotices();
    } catch (err) {
      console.error(err);
      showBanner('error', 'Failed to delete notice');
    }
  };

  const isStudent = user?.role?.name === 'STUDENT';
  const canPublish = !isStudent && hasRole(['SUPER_ADMIN', 'PRINCIPAL', 'ADMINISTRATOR', 'TEACHER']);

  // Pinned Emergency or Top notices
  const noticeArray = Array.isArray(notices) ? notices : [];
  const pinnedNotices = noticeArray.filter((n) => n.isPinned);
  const regularNotices = noticeArray.filter((n) => !n.isPinned);

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
            <Megaphone className="w-7 h-7 text-indigo-600" />
            Notices & Campus Circulars
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Official announcements, academic schedules, events, and campus broadcast bulletins.
          </p>
        </div>
        {canPublish && (
          <Button variant="primary" onClick={() => setIsNoticeModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" />
            Publish Circular
          </Button>
        )}
      </div>

      {/* Filter and search bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadNotices()}
            placeholder="Search circulars..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white"
          >
            <option value="All">All Categories</option>
            {['General', 'Academic', 'Administrative', 'Examination', 'Holiday', 'Sports', 'Event', 'Emergency'].map(
              (cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              )
            )}
          </select>

          {!isStudent && (
            <select
              value={audienceFilter}
              onChange={(e) => setAudienceFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white"
            >
              <option value="All">All Audiences</option>
              <option value="Students">Students</option>
              <option value="Teachers">Teachers</option>
              <option value="Staff">Staff</option>
              <option value="Parents">Parents</option>
            </select>
          )}

          <Button variant="secondary" size="sm" onClick={loadNotices}>
            Search
          </Button>
        </div>
      </div>

      {/* PINNED CIRCULARS BANNER */}
      {pinnedNotices.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 uppercase tracking-wider">
            <Pin className="w-3.5 h-3.5" /> Pinned Announcements
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pinnedNotices.map((n) => (
              <div
                key={n._id}
                className={`p-5 rounded-2xl border ${
                  n.category === 'Emergency'
                    ? 'border-rose-300 bg-rose-50/50'
                    : 'border-indigo-200 bg-indigo-50/30'
                } shadow-xs`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded-lg bg-indigo-100 text-indigo-700">
                      <Pin className="w-3.5 h-3.5" />
                    </span>
                    <h3 className="font-bold text-slate-900 text-base">{n.title}</h3>
                  </div>
                  <Badge variant={n.category === 'Emergency' ? 'danger' : 'primary'}>
                    {n.category}
                  </Badge>
                </div>

                <p className="text-sm text-slate-700 mt-2 whitespace-pre-line">{n.content}</p>

                <div className="mt-4 flex flex-wrap items-center justify-between text-xs text-slate-500 border-t border-slate-200/60 pt-3">
                  <div className="flex items-center gap-2">
                    <span>By: {n.authorId ? `${n.authorId.firstName || n.authorId.username}` : 'Principal'}</span>
                    <span>•</span>
                    <span>{new Date(n.publishDate).toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {n.attachmentUrl && (
                      <a
                        href={n.attachmentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold"
                      >
                        <Paperclip className="w-3 h-3" /> Attachment
                      </a>
                    )}
                    {canPublish && (
                      <button
                        onClick={() => handleDeleteNotice(n._id)}
                        className="text-rose-500 hover:text-rose-700 ml-2"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* REGULAR CIRCULARS */}
      {loading ? (
        <LoadingSpinner />
      ) : regularNotices.length === 0 && pinnedNotices.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No circulars posted"
          description={canPublish ? "Click 'Publish Circular' to post school announcements." : "No circulars have been published yet."}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {regularNotices.map((n) => (
            <div
              key={n._id}
              className="p-5 rounded-2xl border border-slate-200/80 bg-white hover:shadow-xs transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-bold text-slate-900 text-base">{n.title}</h3>
                  <Badge variant="default">{n.category}</Badge>
                </div>

                <p className="text-sm text-slate-600 line-clamp-4 whitespace-pre-line">{n.content}</p>

                {/* Audience chips */}
                <div className="flex flex-wrap gap-1 mt-3">
                  {n.targetAudience?.map((aud, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600"
                    >
                      {aud}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-3">
                <span>{new Date(n.publishDate).toLocaleDateString()}</span>
                <div className="flex items-center gap-2">
                  {n.attachmentUrl && (
                    <a
                      href={n.attachmentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-indigo-600 font-semibold"
                    >
                      <Paperclip className="w-3 h-3" /> PDF
                    </a>
                  )}
                  {canPublish && (
                    <button
                      onClick={() => handleDeleteNotice(n._id)}
                      className="text-rose-500 hover:text-rose-700"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: PUBLISH CIRCULAR */}
      <Modal
        isOpen={isNoticeModalOpen}
        onClose={() => setIsNoticeModalOpen(false)}
        title="Publish Official Campus Circular"
      >
        <form onSubmit={handleCreateNotice} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Notice Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Schedule for Mid-Term Examination 2026"
              value={noticeForm.title}
              onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Category</label>
              <select
                value={noticeForm.category}
                onChange={(e) => setNoticeForm({ ...noticeForm, category: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
              >
                {['General', 'Academic', 'Administrative', 'Examination', 'Holiday', 'Sports', 'Event', 'Emergency'].map(
                  (cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  )
                )}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Target Audience</label>
              <select
                value={noticeForm.targetAudience[0] || 'All'}
                onChange={(e) => setNoticeForm({ ...noticeForm, targetAudience: [e.target.value] })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
              >
                <option value="All">All Campus</option>
                <option value="Students">Students</option>
                <option value="Teachers">Teachers</option>
                <option value="Parents">Parents</option>
                <option value="Staff">Staff</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Circular Content *</label>
            <textarea
              required
              rows={4}
              placeholder="Full announcement body and guidelines"
              value={noticeForm.content}
              onChange={(e) => setNoticeForm({ ...noticeForm, content: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Attachment URL</label>
              <input
                type="text"
                placeholder="https://.../document.pdf or /documents/notice.pdf"
                value={noticeForm.attachmentUrl}
                onChange={(e) => setNoticeForm({ ...noticeForm, attachmentUrl: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Expiry Date</label>
              <input
                type="date"
                value={noticeForm.expiryDate}
                onChange={(e) => setNoticeForm({ ...noticeForm, expiryDate: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={noticeForm.isPinned}
              onChange={(e) => setNoticeForm({ ...noticeForm, isPinned: e.target.checked })}
            />
            <span className="font-medium">Pin this circular to the top of noticeboard</span>
          </label>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsNoticeModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={loading}>
              Publish & Broadcast
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default NoticesPage;
