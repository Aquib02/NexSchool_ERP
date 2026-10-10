import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  School,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  GraduationCap,
  BookOpen,
  Users,
  CreditCard,
  Bus,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

export const FrontPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [progress, setProgress] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(2);

  const handleProceed = () => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  };

  useEffect(() => {
    // 1. Kick off visual progress fill over 2000ms
    const animTimer = setTimeout(() => {
      setProgress(100);
    }, 40);

    // 2. Countdown ticks
    const countInterval = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);

    // 3. Exactly 2 seconds timeout to transition
    const redirectTimer = setTimeout(() => {
      handleProceed();
    }, 3000);

    return () => {
      clearTimeout(animTimer);
      clearTimeout(redirectTimer);
      clearInterval(countInterval);
    };
  }, [isAuthenticated]);

  return (
    <div className="min-h-screen w-full bg-slate-950 flex flex-col justify-between items-center px-4 py-8 sm:py-12 relative overflow-hidden select-none">
      {/* Dynamic ambient lights */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/25 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-sky-500/20 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[160px] pointer-events-none" />

      {/* Subtle grid pattern background */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* Top Header Badge */}
      <div className="relative z-10 animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-950/70 border border-indigo-500/30 text-indigo-300 text-xs font-semibold backdrop-blur-md shadow-lg shadow-indigo-950/40">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>NexSchool ERP Enterprise • AY 2025–2026</span>
        </div>
      </div>

      {/* Main Center Content */}
      <div className="relative z-10 max-w-2xl w-full text-center my-auto flex flex-col items-center">
        {/* Animated Icon Emblem */}
        <div className="relative mb-6 group">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-sky-400 to-indigo-600 rounded-3xl blur-md opacity-70 group-hover:opacity-100 transition duration-1000 animate-pulse" />
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-900 rounded-3xl flex items-center justify-center border border-indigo-400/40 shadow-2xl shadow-indigo-950">
            <School className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
          </div>
        </div>

        {/* Brand Titles */}
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white mb-2">
          NexSchool <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-sky-300 to-emerald-400">ERP</span>
        </h1>
        <p className="text-sm sm:text-lg font-medium text-slate-300 max-w-lg mb-6 leading-relaxed">
          Intelligent Institutional Operations, Academic Management & Unified Campus Platform
        </p>

        {/* Feature Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8 max-w-xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 text-xs font-medium backdrop-blur-sm">
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            Students & Staff HR
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 text-xs font-medium backdrop-blur-sm">
            <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
            Academics & Timetable
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 text-xs font-medium backdrop-blur-sm">
            <CreditCard className="w-3.5 h-3.5 text-amber-400" />
            Fee Accounting & Ledgers
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 text-xs font-medium backdrop-blur-sm">
            <Bus className="w-3.5 h-3.5 text-sky-400" />
            Transport & Security
          </span>
        </div>

        {/* Progress & Transition Section */}
        <div className="w-full max-w-xs sm:max-w-sm flex flex-col items-center space-y-3">
          {/* Progress Bar Container */}
          <div className="w-full h-1.5 bg-slate-800/80 rounded-full overflow-hidden border border-slate-700/60 relative">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400 rounded-full transition-all ease-linear"
              style={{
                width: `${progress}%`,
                transitionDuration: '2000ms',
              }}
            />
          </div>

          {/* Status Label & Countdown */}
          <div className="flex items-center justify-between w-full text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              Initializing secure environment...
            </span>
            <span className="font-mono text-indigo-300 font-semibold">
              {secondsRemaining}s
            </span>
          </div>

          {/* Instant Skip Button */}
          <button
            onClick={handleProceed}
            className="group flex items-center gap-1.5 text-xs text-indigo-300 hover:text-white transition-colors cursor-pointer pt-1 font-semibold"
          >
            <span>Proceed to Login</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Bottom Footer Assurance */}
      <div className="relative z-10 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-[11px] text-slate-500 pt-4">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          256-Bit TLS Encryption
        </span>
        <span className="hidden sm:inline text-slate-700">•</span>
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-indigo-400" />
          Role-Based Access Control
        </span>
        <span className="hidden sm:inline text-slate-700">•</span>
        <span>&copy; {new Date().getFullYear()} NexSchool ERP</span>
      </div>
    </div>
  );
};

export default FrontPage;
