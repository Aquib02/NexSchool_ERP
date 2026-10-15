import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Lock, User, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import Button from '../../components/common/Button.jsx';

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Check if redirected from session expiration
  const searchParams = new URLSearchParams(location.search);
  const isSessionExpired = searchParams.get('sessionExpired') === 'true';

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await login({ username, password });

    if (result.success) {
      if (result.user?.role?.name === 'STUDENT') {
        navigate('/portal/student', { replace: true });
      } else if (result.user?.role?.name === 'PARENT') {
        navigate('/portal/parent', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } else {
      setError(result.message || 'Login failed. Please check your credentials.');
      setIsLoading(false);
    }
  };

  // Quick fill helper for development & demonstration
  const handleQuickFill = (roleUser, rolePass) => {
    setUsername(roleUser);
    setPassword(rolePass);
    setError('');
  };

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-xl font-bold text-slate-900">Sign in to your account</h3>
        <p className="text-xs text-slate-500 mt-1">
          Enter your authorized staff, student, or parent credentials.
        </p>
      </div>

      {isSessionExpired && !error && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-xs text-amber-800">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Your session has expired. Please sign in again.</span>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-800 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Username or School Email
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. admin or employee ID"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-slate-700">Password</label>
            <Link
              to="/forgot-password"
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
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
          Sign In to Portal <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </form>

      {/* Quick Demo Credentials Panel */}
      <div className="mt-8 pt-6 border-t border-slate-100">
        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-center mb-3">
          Demo Test Credentials
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleQuickFill('admin', 'Admin@12345')}
            className="p-2 text-left bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 border border-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            <span className="block text-xs font-bold text-slate-800">Super Admin</span>
            <span className="block text-[10px] text-slate-500">admin / Admin@12345</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickFill('teacher1', 'Teacher@12345')}
            className="p-2 text-left bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 border border-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            <span className="block text-xs font-bold text-slate-800">Teacher</span>
            <span className="block text-[10px] text-slate-500">teacher1 / Teacher@12345</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
