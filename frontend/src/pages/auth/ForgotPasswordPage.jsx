import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import Button from '../../components/common/Button.jsx';
import authService from '../../services/authService.js';

export const ForgotPasswordPage = () => {
  const [identifier, setIdentifier] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [message, setMessage] = useState('');
  const [resetLink, setResetLink] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await authService.forgotPassword(identifier);
      setIsSubmitted(true);
      const data = res?.data || res;
      setMessage(res.message || data?.message || 'Password reset instructions dispatched.');
      setResetLink(data?.resetLink || null);
      setUserEmail(data?.userEmail || '');
    } catch (err) {
      setError(err.message || 'Failed to dispatch reset request.');
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
        <h3 className="text-xl font-bold text-slate-900">Reset your password</h3>
        <p className="text-xs text-slate-500 mt-1">
          Enter your registered school username or email address to receive password reset instructions.
        </p>
      </div>

      {isSubmitted ? (
        <div className="text-center py-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h4 className="text-base font-semibold text-slate-800">Password Reset Request</h4>
          <p className="text-xs text-slate-500 mt-2 max-w-sm mx-auto">{message}</p>
          {userEmail && (
            <p className="text-xs font-mono bg-slate-50 text-slate-600 p-2 rounded-lg mt-3 max-w-xs mx-auto border border-slate-200">
              Account Email: {userEmail}
            </p>
          )}

          {resetLink && (
            <div className="mt-5 p-4 bg-indigo-50 border border-indigo-200 rounded-2xl text-left max-w-sm mx-auto">
              <p className="text-xs font-semibold text-indigo-900 mb-2">
                Direct Reset Link Available:
              </p>
              <p className="text-[11px] text-indigo-700 mb-3">
                Since external SMTP is not yet configured on this instance, you can click below to set your new password immediately.
              </p>
              <a
                href={resetLink}
                className="inline-block w-full text-center bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2.5 px-4 rounded-xl shadow-xs transition-colors"
              >
                Set New Password Now →
              </a>
            </div>
          )}

          <div className="mt-6 flex items-center justify-center gap-3">
            <Link to="/login">
              <Button variant="secondary" size="md">
                Return to Sign In
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

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
                placeholder="e.g. admin or name@gmail.com"
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
            Request Password Reset
          </Button>
        </form>
      )}
    </div>
  );
};

export default ForgotPasswordPage;
