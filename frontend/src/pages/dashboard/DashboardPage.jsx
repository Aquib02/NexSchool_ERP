import React from 'react';
import {
  Users,
  CreditCard,
  UserCheck,
  CalendarCheck,
  TrendingUp,
  AlertCircle,
  FileCheck,
  BookOpen,
  Bus,
  Laptop,
  CheckCircle,
  ArrowUpRight,
  Shield,
  Clock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import Card from '../../components/common/Card.jsx';
import Badge from '../../components/common/Badge.jsx';
import Button from '../../components/common/Button.jsx';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts';

export const DashboardPage = () => {
  const { user } = useAuth();
  const roleName = user?.role?.name || 'USER';

  // Demo analytics data for ERP dashboard
  const collectionData = [
    { month: 'Apr', collections: 420000, target: 400000 },
    { month: 'May', collections: 510000, target: 500000 },
    { month: 'Jun', collections: 380000, target: 450000 },
    { month: 'Jul', collections: 620000, target: 600000 },
    { month: 'Aug', collections: 590000, target: 580000 },
    { month: 'Sep', collections: 480000, target: 500000 },
  ];

  const attendanceTrends = [
    { day: 'Mon', attendance: 96 },
    { day: 'Tue', attendance: 94 },
    { day: 'Wed', attendance: 95 },
    { day: 'Thu', attendance: 91 },
    { day: 'Fri', attendance: 89 },
    { day: 'Sat', attendance: 92 },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-2.5 mb-3">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-white text-indigo-950 shadow-md border border-white/60">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {user?.role?.displayName || roleName} Portal
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-indigo-950/70 text-indigo-100 border border-indigo-400/40 backdrop-blur-sm shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-300" />
              Session: 2025-2026
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Welcome back, {user?.username}!
          </h1>
          <p className="text-sm text-indigo-200 mt-1 max-w-xl">
            {roleName === 'SUPER_ADMIN' || roleName === 'PRINCIPAL'
              ? 'Institutional Operations & Cross-Department Management System is running smoothly.'
              : roleName === 'TEACHER'
              ? 'Here is your daily teaching schedule, attendance summary, and homework assignments.'
              : roleName === 'ACCOUNTANT'
              ? 'Track real-time fee collections, pending dues, expense logs, and receipts.'
              : 'Access your relevant student records and daily school activities.'}
          </p>
        </div>

        {/* Background decorative circles */}
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-radial from-indigo-500/20 to-transparent pointer-events-none" />
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* KPI 1: Students */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Total Enrolled Students</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">1,248</p>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 mt-1">
              <TrendingUp className="w-3 h-3" /> +4.2% this session
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 2: Staff */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Active Faculty & Staff</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">86</p>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 mt-1">
              12 Departments
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 3: Daily Attendance */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Today's Attendance</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">94.8%</p>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 mt-1">
              <CheckCircle className="w-3 h-3" /> 1,183 Present
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <CalendarCheck className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 4: Fee Collection */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Fees Collected (MTD)</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">₹4.85L</p>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 mt-1">
              <AlertCircle className="w-3 h-3" /> ₹62K Pending
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Fee Collection Trends */}
        <Card
          title="Revenue & Fee Collection Register"
          subtitle="Monthly cash & bank collections vs targets"
          className="lg:col-span-2"
        >
          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={collectionData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={(v) => `₹${v / 1000}k`}
                />
                <Tooltip
                  formatter={(val) => [`₹${val.toLocaleString()}`, 'Amount']}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="collections" fill="#4f46e5" radius={[6, 6, 0, 0]} name="Collected" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Chart 2: Weekly Student Attendance */}
        <Card title="Attendance Consistency" subtitle="School-wide percentage per weekday">
          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={attendanceTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis
                  domain={[80, 100]}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  formatter={(val) => [`${val}%`, 'Attendance']}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="attendance"
                  stroke="#0284c7"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#0284c7' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Operational Highlights & Module Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-800">42 Admissions Pending</p>
            <p className="text-[11px] text-slate-500">Entrance tests scheduled</p>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-800">18 Books Overdue</p>
            <p className="text-[11px] text-slate-500">Library circulation active</p>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Bus className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-800">8 Bus Fleets En Route</p>
            <p className="text-[11px] text-slate-500">All routes reported on time</p>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Laptop className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-800">3 IT Tickets Open</p>
            <p className="text-[11px] text-slate-500">Average resolution: 2.1h</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
