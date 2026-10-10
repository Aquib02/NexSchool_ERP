import React, { useState } from 'react';
import { KeyRound, Mail, ShieldCheck, RefreshCw } from 'lucide-react';
import Modal from './Modal.jsx';
import Button from './Button.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import authService from '../../services/authService.js';

export const ChangePasswordModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [method, setMethod] = useState('otp'); // 'otp' (default per user preference) or 'current'

  // Current password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // OTP state
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [debugOtp, setDebugOtp] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSendOtp = async () => {
    setError('');
    setIsSendingOtp(true);
    try {
      const res = await authService.sendOtp(user?.email || user?.username);
      const data = res?.data || res;
      setOtpSent(true);
      setMaskedEmail(data?.maskedEmail || user?.email || '');
      setDebugOtp(data?.debugOtp || '');
      setSuccess('6-digit OTP verification code dispatched to your registered email.');
    } catch (err) {
      setError(err.message || 'Failed to dispatch OTP code.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      if (method === 'otp') {
        if (!otp || otp.trim().length !== 6) {
          setError('Please enter the 6-digit OTP code received on your email.');
          setIsLoading(false);
          return;
        }

        await authService.verifyOtp({
          identifier: user?.email || user?.username,
          otp: otp.trim(),
          newPassword,
        });
      } else {
        await authService.changePassword({
          currentPassword,
          newPassword,
          confirmPassword,
        });
      }

      setSuccess('Password updated successfully! Use it for your next sign-in.');
      setTimeout(() => {
        onClose();
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setOtp('');
        setOtpSent(false);
        setSuccess('');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to change password. Please check your inputs.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Change Account Password"
      subtitle="Choose your preferred verification method to update your credentials."
    >
      {/* Verification Method Tabs */}
      <div className="flex border-b border-slate-200 mb-4">
        <button
          type="button"
          onClick={() => {
            setMethod('otp');
            setError('');
            setSuccess('');
          }}
          className={`flex-1 pb-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
            method === 'otp'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          Verify via Email OTP
        </button>
        <button
          type="button"
          onClick={() => {
            setMethod('current');
            setError('');
            setSuccess('');
          }}
          className={`flex-1 pb-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
            method === 'current'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <KeyRound className="w-3.5 h-3.5" />
          Use Current Password
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded-xl border border-emerald-200">
            {success}
          </div>
        )}

        {/* METHOD 1: EMAIL OTP */}
        {method === 'otp' && (
          <div className="space-y-4">
            <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs text-indigo-900 flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold">Registered Email</p>
                <p className="font-mono text-[11px] text-indigo-700">{user?.email || 'No email attached'}</p>
              </div>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleSendOtp}
                isLoading={isSendingOtp}
              >
                {otpSent ? 'Resend OTP' : 'Send OTP'}
              </Button>
            </div>

            {debugOtp && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                <div className="flex items-center gap-1 font-semibold mb-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                  <span>Test OTP Code:</span>
                </div>
                <div className="font-mono font-bold text-base tracking-widest text-center bg-white p-1.5 rounded border border-amber-300">
                  {debugOtp}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                6-Digit OTP Code
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full px-3.5 py-2 text-base font-mono tracking-widest bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                placeholder="123456"
              />
            </div>
          </div>
        )}

        {/* METHOD 2: CURRENT PASSWORD */}
        {method === 'current' && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Current Password</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              placeholder="Enter current password"
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
          <input
            type="password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            placeholder="At least 6 characters"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password</label>
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            placeholder="Repeat new password"
          />
        </div>

        <div className="pt-3 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            Update Password
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ChangePasswordModal;
