import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { School, ShieldCheck, Sparkles, BookOpen } from 'lucide-react';

export const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative gradient blur background */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 mb-4">
          <School className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-white">NexSchool ERP</h2>
        <p className="mt-2 text-sm text-slate-400">
          Centralized School Operations & Academic Intelligence
        </p>
      </div>

      {/* Main Outlet Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-2xl shadow-slate-950/50 rounded-3xl border border-slate-100 sm:px-10">
          <Outlet />
        </div>

        {/* Security assurance */}
        <div className="mt-6 flex items-center justify-center gap-6 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> 256-bit TLS Encrypted
          </span>
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-indigo-400" /> RBAC Protected
          </span>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
