import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import Button from '../../components/common/Button.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export const UnauthorizedPage = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
      <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center mb-6 shadow-sm shadow-rose-100">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <h1 className="text-2xl font-bold text-slate-800 mb-2">Access Denied (403 Forbidden)</h1>
      <p className="text-sm text-slate-500 max-w-md mb-2">
        Your current role{' '}
        <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
          {user?.role?.displayName || user?.role?.name || 'Unassigned'}
        </span>{' '}
        does not have authorization to view this department or execute this action.
      </p>
      <p className="text-xs text-slate-400 max-w-md mb-8">
        If you believe you should have access, please contact the School Principal or IT Administrator to adjust your role permissions.
      </p>
      <Link to="/dashboard">
        <Button variant="primary" icon={ArrowLeft}>
          Return to Dashboard
        </Button>
      </Link>
    </div>
  );
};

export default UnauthorizedPage;
