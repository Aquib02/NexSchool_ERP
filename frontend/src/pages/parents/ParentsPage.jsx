import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
} from 'lucide-react';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';
import Modal from '../../components/common/Modal.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import parentService from '../../services/parentService.js';

export const ParentsPage = () => {
  const [parents, setParents] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // Create Parent Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [parentForm, setParentForm] = useState({
    fatherName: '',
    fatherPhone: '',
    fatherEmail: '',
    fatherOccupation: '',
    motherName: '',
    motherPhone: '',
    motherEmail: '',
    primaryContactNumber: '',
  });

  const fetchParents = async (page = 1) => {
    setLoading(true);
    try {
      const res = await parentService.getParents({ page, limit: pagination.limit, search });
      if (res.success && res.data) {
        setParents(res.data.parents || []);
        setPagination(res.data.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
      }
    } catch (e) {
      console.error('Failed to load parents', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParents(1);
  }, [search]);

  const handleCreateParent = async (e) => {
    e.preventDefault();
    try {
      await parentService.createParent(parentForm);
      setIsModalOpen(false);
      setParentForm({
        fatherName: '',
        fatherPhone: '',
        fatherEmail: '',
        fatherOccupation: '',
        motherName: '',
        motherPhone: '',
        motherEmail: '',
        primaryContactNumber: '',
      });
      fetchParents(1);
    } catch (err) {
      alert(err.message || 'Failed to create parent');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Parent & Guardian Directory</h1>
          <p className="text-xs text-slate-500 mt-1">
            Guardian contacts and multi-child family associations across classes.
          </p>
        </div>
        <Button variant="primary" size="sm" icon={Plus} onClick={() => setIsModalOpen(true)}>
          Add Parent Profile
        </Button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by parent name, phone, email, or Parent ID..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Fetching parents directory..." />
      ) : parents.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No parent records found"
          description="Parent profiles are created automatically during student enrollment or manually here."
          actionText="Add Parent"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {parents.map((parent) => (
            <div
              key={parent._id}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                    {parent.parentId}
                  </span>
                  <h4 className="text-base font-bold text-slate-900 mt-1">
                    {parent.fatherName || parent.motherName || parent.guardianName || 'Guardian'}
                  </h4>
                  {parent.fatherOccupation && (
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                      {parent.fatherOccupation}
                    </p>
                  )}
                </div>
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-xs">
                  {parent.fatherName ? parent.fatherName[0] : 'P'}
                </div>
              </div>

              {/* Contact info */}
              <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-semibold text-slate-800">{parent.primaryContactNumber}</span>
                </div>
                {parent.fatherEmail && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{parent.fatherEmail}</span>
                  </div>
                )}
              </div>

              {/* Enrolled Children Chips */}
              <div className="pt-2 border-t border-slate-100">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Enrolled Wards ({parent.studentIds?.length || 0}):
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {parent.studentIds && parent.studentIds.length > 0 ? (
                    parent.studentIds.map((child) => (
                      <Link
                        key={child._id}
                        to={`/students/${child._id}`}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-semibold transition-colors"
                      >
                        <GraduationCap className="w-3 h-3 text-indigo-600" />
                        <span>
                          {child.firstName} {child.lastName}
                        </span>
                        <span className="text-[10px] text-indigo-500 font-normal">
                          ({child.classId?.name})
                        </span>
                      </Link>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">No students linked</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
        <span>
          Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
          {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} parents
        </span>
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page <= 1}
            onClick={() => fetchParents(pagination.page - 1)}
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
            onClick={() => fetchParents(pagination.page + 1)}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* CREATE PARENT MODAL */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Register Parent Profile">
        <form onSubmit={handleCreateParent} className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Father's Name *</label>
              <input
                type="text"
                required
                value={parentForm.fatherName}
                onChange={(e) => setParentForm({ ...parentForm, fatherName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Father's Phone *</label>
              <input
                type="text"
                required
                value={parentForm.fatherPhone}
                onChange={(e) => setParentForm({ ...parentForm, fatherPhone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Mother's Name</label>
              <input
                type="text"
                value={parentForm.motherName}
                onChange={(e) => setParentForm({ ...parentForm, motherName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Mother's Phone</label>
              <input
                type="text"
                value={parentForm.motherPhone}
                onChange={(e) => setParentForm({ ...parentForm, motherPhone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">Father's Email</label>
            <input
              type="email"
              value={parentForm.fatherEmail}
              onChange={(e) => setParentForm({ ...parentForm, fatherEmail: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Occupation</label>
            <input
              type="text"
              value={parentForm.fatherOccupation}
              onChange={(e) => setParentForm({ ...parentForm, fatherOccupation: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Create Parent Profile</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ParentsPage;
