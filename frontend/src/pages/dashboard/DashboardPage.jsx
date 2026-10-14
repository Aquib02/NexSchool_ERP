import React, { useState, useMemo } from 'react';
import { Link, Navigate } from 'react-router-dom';
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
  GraduationCap,
  Award,
  Radio,
  MessageSquare,
  Megaphone,
  Home,
  UserCircle,
  Stethoscope,
  UtensilsCrossed,
  ShieldCheck,
  Sparkles,
  Settings,
  Brain,
  FileText,
  School,
  ArrowRight,
  Search,
  Layers,
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
  const { user, hasPermission, hasRole } = useAuth();
  const roleName = user?.role?.name || 'USER';

  // Strict isolation: Students navigate directly to their dedicated self-service portal
  if (roleName === 'STUDENT') {
    return <Navigate to="/portal/student" replace />;
  }

  // State for modules directory filtering
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [moduleSearch, setModuleSearch] = useState('');

  // Structured Module & Sub-Module Catalog
  const moduleHub = useMemo(() => [
    {
      id: 'academics',
      title: 'Academic & Learning',
      category: 'ACADEMICS',
      icon: GraduationCap,
      accent: 'from-indigo-600 to-blue-600',
      badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      description: 'Curriculum design, digital learning, and certifications',
      subModules: [
        {
          name: 'Academics & Timetable',
          path: '/academics',
          icon: BookOpen,
          description: 'Class setup, subject allocations & timetable rosters',
          show: hasPermission('academics:view'),
        },
        {
          name: 'LMS & E-Learning',
          path: '/lms',
          icon: Laptop,
          description: 'Homework submissions, CBT quizzes & study vault',
          show: hasPermission('lms:view'),
        },
        {
          name: 'Certificates & ID Cards',
          path: '/certificates',
          icon: Award,
          description: 'Transfer, bonafide certs, student IDs & hall tickets',
          show: hasPermission('certificates:view'),
        },
      ],
    },
    {
      id: 'students',
      title: 'Students & Admissions',
      category: 'STUDENTS',
      icon: Users,
      accent: 'from-blue-600 to-cyan-600',
      badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
      description: 'Lifecycle from initial inquiry to student graduation',
      subModules: [
        {
          name: 'Admissions Pipeline',
          path: '/admissions',
          icon: FileCheck,
          description: 'Candidate inquiries, entrance marks & enrollment',
          show: hasPermission('admissions:view'),
        },
        {
          name: 'Students Directory',
          path: '/students',
          icon: Users,
          description: '360 student profiles, family records & documents',
          show: hasPermission('students:view'),
        },
        {
          name: 'Student Portal',
          path: '/portal/student',
          icon: UserCircle,
          description: 'Dedicated student portal for timetable and homework',
          show: true,
        },
      ],
    },
    {
      id: 'transport',
      title: 'Transport & Fleet',
      category: 'OPERATIONS',
      icon: Bus,
      accent: 'from-amber-500 to-orange-600',
      badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
      description: 'Bus route logistics, telematics & live student transit safety',
      subModules: [
        {
          name: 'Transport Logistics',
          path: '/transport',
          icon: Bus,
          description: 'Vehicle fleet inventory, routes & stop allocations',
          show: hasPermission('transport:view'),
        },
        {
          name: 'Fleet Live GPS Tracking',
          path: '/tracking',
          icon: Radio,
          description: 'Live bus telemetry, boarding checklist & panic SOS',
          show: hasPermission('tracking:view'),
        },
      ],
    },
    {
      id: 'communication',
      title: 'Communication & Community',
      category: 'COMMUNICATION',
      icon: MessageSquare,
      accent: 'from-violet-600 to-purple-600',
      badgeBg: 'bg-purple-50 text-purple-700 border-purple-200',
      description: 'Multi-channel parent-teacher engagement and circulars',
      subModules: [
        {
          name: 'Communication & PTM',
          path: '/communication',
          icon: MessageSquare,
          description: 'WhatsApp & SMS broadcasts, PTM bookings & chat',
          show: hasPermission('communication:view'),
        },
        {
          name: 'Campus Circulars',
          path: '/notices',
          icon: Megaphone,
          description: 'Digital campus bulletins, official notices & announcements',
          show: true,
        },
        {
          name: 'Parent Portal',
          path: '/portal/parent',
          icon: Home,
          description: 'Dedicated guardian dashboard for attendance & fees',
          show: true,
        },
      ],
    },
    {
      id: 'finance_hr',
      title: 'Finance & Human Resources',
      category: 'FINANCE',
      icon: CreditCard,
      accent: 'from-emerald-600 to-teal-600',
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      description: 'Fee collection registries, expenses & faculty management',
      subModules: [
        {
          name: 'Accounts & Fee Collection',
          path: '/finance',
          icon: CreditCard,
          description: 'Fee structures, receipts, ledgers & outstanding dues',
          show: hasPermission('fees:view'),
        },
        {
          name: 'Staff & Faculty Directory',
          path: '/staff',
          icon: UserCheck,
          description: 'Employee records, department staffing & leave tracking',
          show: hasPermission('staff:view'),
        },
      ],
    },
    {
      id: 'operations',
      title: 'Campus Facilities & Operations',
      category: 'OPERATIONS',
      icon: School,
      accent: 'from-slate-700 to-slate-900',
      badgeBg: 'bg-slate-100 text-slate-700 border-slate-300',
      description: 'Clinic, library, cafeteria, security gate, hygiene & IT',
      subModules: [
        {
          name: 'Library Vault',
          path: '/library',
          icon: BookOpen,
          description: 'Book catalog, circulation loans, returns & late fines',
          show: hasPermission('library:view'),
        },
        {
          name: 'Medical Clinic',
          path: '/medical',
          icon: Stethoscope,
          description: 'Student medical history, clinic visits & dispensary',
          show: hasPermission('medical:view'),
        },
        {
          name: 'Canteen & Cafeteria',
          path: '/canteen',
          icon: UtensilsCrossed,
          description: 'Meal menu, inventory & point-of-sale transactions',
          show: hasPermission('canteen:view'),
        },
        {
          name: 'Security & Campus Gate',
          path: '/security',
          icon: ShieldCheck,
          description: 'Visitor passes, gate logs & security incident records',
          show: hasPermission('security:view'),
        },
        {
          name: 'Housekeeping & Hygiene',
          path: '/housekeeping',
          icon: Sparkles,
          description: 'Sanitation checklists, cleaning rosters & janitorial stock',
          show: hasPermission('housekeeping:view'),
        },
        {
          name: 'IT Assets & Helpdesk',
          path: '/it',
          icon: Laptop,
          description: 'Hardware equipment inventory & technical helpdesk tickets',
          show: hasPermission('it:view'),
        },
      ],
    },
    {
      id: 'administration',
      title: 'Administration, Security & AI',
      category: 'ADMIN',
      icon: Shield,
      accent: 'from-rose-600 to-red-700',
      badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
      description: 'System setup, granular RBAC, AI intelligence & audit log',
      subModules: [
        {
          name: 'Institution Setup',
          path: '/admin',
          icon: Settings,
          description: 'Academic sessions, departments & global configurations',
          show: hasRole(['SUPER_ADMIN', 'PRINCIPAL', 'ADMINISTRATOR']),
        },
        {
          name: 'Roles & RBAC Matrix',
          path: '/rbac',
          icon: Shield,
          description: 'Configure security roles & granular permissions matrix',
          show: hasRole(['SUPER_ADMIN', 'ADMINISTRATOR']),
        },
        {
          name: 'AI Analytics & Copilot',
          path: '/ai-analytics',
          icon: Brain,
          description: 'Predictive dropout retention & AI copilot lesson planner',
          show: hasPermission('analytics:view'),
        },
        {
          name: 'System Audit Logs',
          path: '/audit-logs',
          icon: FileText,
          description: 'Complete security event trail & compliance history',
          show: hasRole(['SUPER_ADMIN', 'ADMIN', 'PRINCIPAL']) || hasPermission('audit:view'),
        },
      ],
    },
  ], [hasPermission, hasRole]);

  // Filter modules based on category and search query
  const filteredModuleHub = useMemo(() => {
    return moduleHub
      .map((mod) => {
        const permittedSubs = mod.subModules.filter((s) => s.show !== false);
        if (permittedSubs.length === 0) return null;

        // Category filter
        if (selectedFilter !== 'ALL' && mod.category !== selectedFilter) {
          return null;
        }

        // Search filter
        if (moduleSearch.trim()) {
          const q = moduleSearch.toLowerCase();
          const matchesTitle = mod.title.toLowerCase().includes(q);
          const matchingSubs = permittedSubs.filter(
            (s) => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
          );
          if (!matchesTitle && matchingSubs.length === 0) return null;
          return {
            ...mod,
            subModules: matchingSubs.length > 0 ? matchingSubs : permittedSubs,
          };
        }

        return {
          ...mod,
          subModules: permittedSubs,
        };
      })
      .filter(Boolean);
  }, [moduleHub, selectedFilter, moduleSearch]);

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
    <div className="space-y-7 pb-10">
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

      {/* ========================================================================= */}
      {/* CORE MODULES & SUB-MODULES DIRECTORY (ORGANIZED & GROUPED)               */}
      {/* ========================================================================= */}
      <div className="space-y-4 pt-2">
        {/* Header & Filter Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse" />
              <h2 className="text-lg font-bold text-slate-900">ERP Modules & Sub-Modules Directory</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Features are logically categorized into Parent Modules and associated Sub-Modules.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={moduleSearch}
                onChange={(e) => setModuleSearch(e.target.value)}
                placeholder="Search sub-modules..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              {[
                { id: 'ALL', label: 'All' },
                { id: 'ACADEMICS', label: 'Academics' },
                { id: 'STUDENTS', label: 'Students' },
                { id: 'COMMUNICATION', label: 'Comms' },
                { id: 'OPERATIONS', label: 'Operations' },
                { id: 'ADMIN', label: 'Admin' },
              ].map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => setSelectedFilter(pill.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                    selectedFilter === pill.id
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Grouped Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredModuleHub.map((parentMod) => {
            const ParentIcon = parentMod.icon;

            return (
              <div
                key={parentMod.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-indigo-300/80 transition-all overflow-hidden flex flex-col justify-between"
              >
                {/* Parent Module Header */}
                <div>
                  <div className={`p-4 bg-gradient-to-r ${parentMod.accent} text-white flex items-center justify-between`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                        <ParentIcon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold tracking-tight text-white">{parentMod.title}</h3>
                        <p className="text-[11px] text-white/80 line-clamp-1 mt-0.5">{parentMod.description}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold bg-white/20 px-2 py-0.5 rounded-full text-white shrink-0">
                      {parentMod.subModules.length} Sub-Modules
                    </span>
                  </div>

                  {/* Associated Sub-Modules List */}
                  <div className="p-3 divide-y divide-slate-100">
                    {parentMod.subModules.map((sub) => {
                      const SubIcon = sub.icon;

                      return (
                        <Link
                          key={sub.path}
                          to={sub.path}
                          className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600 flex items-center justify-center shrink-0 mt-0.5 transition-colors">
                            <SubIcon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <p className="text-xs font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors truncate">
                                {sub.name}
                              </p>
                              <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                            </div>
                            <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                              {sub.description}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>

                {/* Footer hint */}
                <div className="px-4 py-2 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Category: {parentMod.category}</span>
                  <span className="font-medium text-indigo-600">Explore &rarr;</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
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
