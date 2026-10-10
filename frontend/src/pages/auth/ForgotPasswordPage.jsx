import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, KeyRound, Lock, RefreshCw, ShieldCheck } from 'lucide-react';
import Button from '../../components/common/Button.jsx';
import authService from '../../services/authService.js';

export const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Enter Identifier, 2: Enter OTP & New Password, 3: Success
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState('');
  const [debugOtp, setDebugOtp] = useState('');
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  // Step 1: Send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await authService.sendOtp(identifier);
      const data = res?.data || res;
      setMaskedEmail(data?.maskedEmail || data?.email || identifier);
      setDebugOtp(data?.debugOtp || '');
      setInfoMessage(data?.message || 'Verification code sent to your registered email.');
      setStep(2);
    } catch (err) {
      setError(err.message || 'Failed to dispatch verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP & Reset Password
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }

    if (!otp || otp.trim().length !== 6) {
      setError('Please enter the 6-digit OTP verification code.');
      return;
    }

    setIsLoading(true);
    try {
      await authService.verifyOtp({
        identifier,
        otp: otp.trim(),
        newPassword,
      });
      setStep(3);
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } catch (err) {
      setError(err.message || 'Invalid or expired OTP verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResend = async () => {
    setError('');
    setIsLoading(true);
    try {
      const res = await authService.sendOtp(identifier);
      const data = res?.data || res;
      setDebugOtp(data?.debugOtp || '');
      setInfoMessage('A fresh verification code has been dispatched.');
    } catch (err) {
      setError(err.message || 'Failed to resend code.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
        </Link>
        <h3 className="text-xl font-bold text-slate-900">
          {step === 1 && 'Reset your password'}
          {step === 2 && 'Enter Verification Code'}
          {step === 3 && 'Password Reset Complete'}
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          {step === 1 && 'Enter your username or registered email address to receive a 6-digit OTP code.'}
          {step === 2 && `We sent a 6-digit OTP code to ${maskedEmail || 'your registered email'}.`}
          {step === 3 && 'Your credentials have been updated successfully.'}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-800">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: Enter Username or Email */}
      {step === 1 && (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Registered Username or Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. admin or arshkhan.2683@gmail.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            className="w-full mt-2"
          >
            Send 6-Digit OTP Code →
          </Button>
        </form>
      )}

      {/* STEP 2: Enter OTP & New Password */}
      {step === 2 && (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          {infoMessage && (
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-800">
              {infoMessage}
            </div>
          )}

          {debugOtp && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
              <div className="flex items-center gap-1.5 font-semibold mb-1">
                <ShieldCheck className="w-4 h-4 text-amber-700" />
                <span>Test / Fallback OTP Code:</span>
              </div>
              <p className="text-[11px] text-amber-800 mb-2">
                External SMTP server is not yet configured. Use this code to complete verification:
              </p>
              <div className="text-center font-mono font-bold text-lg tracking-widest bg-white p-2 rounded-lg border border-amber-300">
                {debugOtp}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              6-Digit Verification Code (OTP)
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-base font-mono tracking-widest text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              New Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            className="w-full mt-2"
          >
            Verify OTP & Reset Password
          </Button>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-xs text-slate-500 hover:text-slate-700 font-medium cursor-pointer"
            >
              Change Username / Email
            </button>
            <button
              type="button"
              onClick={handleResend}
              disabled={isLoading}
              className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-semibold cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" /> Resend Code
            </button>
          </div>
        </form>
      )}

      {/* STEP 3: Success Screen */}
      {step === 3 && (
        <div className="text-center py-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h4 className="text-base font-semibold text-slate-800">Password Reset Complete</h4>
          <p className="text-xs text-slate-500 mt-2 max-w-sm mx-auto">
            Your password has been securely reset. Redirecting you to the login screen...
          </p>
          <div className="mt-6">
            <Link to="/login">
              <Button variant="primary" size="md">
                Sign In Now
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default ForgotPasswordPage;
