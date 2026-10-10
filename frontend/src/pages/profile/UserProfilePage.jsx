import React, { useState } from 'react';
import { User, Mail, Shield, Calendar, KeyRound, CheckCircle2, ShieldCheck, Edit3 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import Card from '../../components/common/Card.jsx';
import Badge from '../../components/common/Badge.jsx';
import Button from '../../components/common/Button.jsx';
import Modal from '../../components/common/Modal.jsx';
import ChangePasswordModal from '../../components/common/ChangePasswordModal.jsx';
import authService from '../../services/authService.js';

export const UserProfilePage = () => {
  const { user, setUser } = useAuth();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [isSavingEmail, setIsSavingEmail] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [emailSuccess, setEmailSuccess] = useState('');

  const permissions = user?.role?.permissions || [];

  const handleOpenEmailModal = () => {
    setEmailInput(user?.email || '');
    setEmailError('');
    setEmailSuccess('');
    setIsEmailModalOpen(true);
  };

  const handleSaveEmail = async (e) => {
    e.preventDefault();
    setEmailError('');
    setEmailSuccess('');
    setIsSavingEmail(true);

    try {
      const res = await authService.updateProfile({ email: emailInput });
      if (res.success && res.data) {
        setUser(res.data);
        localStorage.setItem('user', JSON.stringify(res.data));
        setEmailSuccess('Email address updated successfully!');
        setTimeout(() => {
          setIsEmailModalOpen(false);
          setEmailSuccess('');
        }, 1500);
      }
    } catch (err) {
      setEmailError(err.message || 'Failed to update email address.');
    } finally {
      setIsSavingEmail(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">User Profile</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your account credentials and view your authorized system privileges.
          </p>
        </div>
        <Button
          variant="outline"
          icon={KeyRound}
          onClick={() => setIsPasswordModalOpen(true)}
        >
          Change Password
        </Button>
      </div>

      {/* Profile Overview Card */}
      <Card>
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white font-bold text-2xl flex items-center justify-center shadow-lg shadow-indigo-600/30 shrink-0">
            {user?.username?.substring(0, 2).toUpperCase() || 'U'}
          </div>
          <div className="flex-1 text-center sm:text-left space-y-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h2 className="text-xl font-bold text-slate-800">{user?.username}</h2>
              <Badge variant="primary" size="sm">
                {user?.role?.displayName || user?.role?.name}
              </Badge>
              {user?.isActive && (
                <Badge variant="success" size="sm">
                  Active
                </Badge>
              )}
            </div>
            <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
              <p className="text-sm text-slate-500 flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-slate-400" />
                <span className="font-mono">{user?.email || 'No email attached'}</span>
              </p>
              <button
                type="button"
                onClick={handleOpenEmailModal}
                className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-semibold cursor-pointer ml-1"
                title="Edit Registered Email"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            </div>
            <p className="text-xs text-slate-400 flex items-center justify-center sm:justify-start gap-1.5 pt-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Last login: {user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'First session'}
            </p>
          </div>
        </div>
      </Card>

      {/* Role & Privileges Grid */}
      <Card
        title="Role & Assigned Permissions"
        subtitle={`Your account inherits permissions granted to role '${user?.role?.displayName || user?.role?.name}'`}
        icon={ShieldCheck}
      >
        {user?.role?.name === 'SUPER_ADMIN' ? (
          <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl flex items-start gap-3">
            <Shield className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-indigo-900">Unrestricted Root Access (SUPER_ADMIN)</p>
              <p className="text-xs text-indigo-700 mt-1">
                You hold system-wide master authority. You bypass all individual permission restrictions across all 12 operational departments and system audit logs.
              </p>
            </div>
          </div>
        ) : permissions.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {permissions.map((perm, idx) => (
              <div
                key={perm._id || idx}
                className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between"
              >
                <div className="truncate pr-2">
                  <p className="text-xs font-semibold text-slate-700 font-mono">{perm.code}</p>
                  <p className="text-[10px] text-slate-500 capitalize">{perm.resource} / {perm.action}</p>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500">No explicit granular permissions assigned.</p>
        )}
      </Card>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />

      {/* Edit Email Modal */}
      <Modal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        title="Update Registered Email"
        subtitle="Set your personal or official email address for receiving system notifications and password reset links."
      >
        <form onSubmit={handleSaveEmail} className="space-y-4">
          {emailError && (
            <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200">
              {emailError}
            </div>
          )}

          {emailSuccess && (
            <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded-xl border border-emerald-200">
              {emailSuccess}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="e.g. yourname@gmail.com"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
            <p className="text-[11px] text-slate-500 mt-1.5">
              Make sure this is your active Gmail address so you can receive password reset emails.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => setIsEmailModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSavingEmail}
            >
              Save Email
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UserProfilePage;
