import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  CalendarCheck,
  CreditCard,
  UserCheck,
  FileCheck,
  BookOpen,
  Bus,
  Stethoscope,
  Laptop,
  Sparkles,
  ShieldCheck,
  UtensilsCrossed,
  Shield,
  FileText,
  Megaphone,
  Settings,
  ChevronLeft,
  ChevronRight,
  School,
  UserCircle,
  Home,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

export const Sidebar = ({ isOpen, isCollapsed, toggleCollapse, closeMobileSidebar }) => {
  const { user, hasPermission, hasRole } = useAuth();
  const location = useLocation();

  // Navigation catalog with permission requirements
  const navigationItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      show: true,
    },
    {
      name: 'Administration',
      path: '/admin',
      icon: School,
      show: hasRole(['SUPER_ADMIN', 'PRINCIPAL', 'ADMINISTRATOR']),
    },
    {
      name: 'Students',
      path: '/students',
      icon: Users,
      show: hasPermission('students:view'),
    },
    {
      name: 'Academics',
      path: '/academics',
      icon: GraduationCap,
      show: hasPermission('academics:view'),
    },
    {
      name: 'Accounts & Fees',
      path: '/finance',
      icon: CreditCard,
      show: hasPermission('fees:view'),
    },
    {
      name: 'Staff & HR',
      path: '/staff',
      icon: UserCheck,
      show: hasPermission('staff:view'),
    },
    {
      name: 'Admissions',
      path: '/admissions',
      icon: FileCheck,
      show: hasPermission('admissions:view'),
    },
    {
      name: 'Library',
      path: '/library',
      icon: BookOpen,
      show: hasPermission('library:view'),
    },
    {
      name: 'Transport',
      path: '/transport',
      icon: Bus,
      show: hasPermission('transport:view'),
    },
    {
      name: 'Medical',
      path: '/medical',
      icon: Stethoscope,
      show: hasPermission('medical:view'),
    },
    {
      name: 'IT Assets & Helpdesk',
      path: '/it',
      icon: Laptop,
      show: hasPermission('it:view'),
    },
    {
      name: 'Housekeeping',
      path: '/housekeeping',
      icon: Sparkles,
      show: hasPermission('housekeeping:view'),
    },
    {
      name: 'Security & Gate',
      path: '/security',
      icon: ShieldCheck,
      show: hasPermission('security:view'),
    },
    {
      name: 'Canteen',
      path: '/canteen',
      icon: UtensilsCrossed,
      show: hasPermission('canteen:view'),
    },
    {
      name: 'Roles & RBAC',
      path: '/rbac',
      icon: Shield,
      show: hasRole(['SUPER_ADMIN', 'ADMINISTRATOR']),
    },
    {
      name: 'Notices & Circulars',
      path: '/notices',
      icon: Megaphone,
      show: true,
    },
    {
      name: 'Student Portal',
      path: '/portal/student',
      icon: UserCircle,
      show: true,
    },
    {
      name: 'Parent Portal',
      path: '/portal/parent',
      icon: Home,
      show: true,
    },
    {
      name: 'Audit Logs',
      path: '/audit-logs',
      icon: FileText,
      show: hasRole(['SUPER_ADMIN', 'PRINCIPAL']) || hasPermission('audit:view'),
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
          onClick={closeMobileSidebar}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-40 bg-slate-900 text-white flex flex-col transition-all duration-300 ease-in-out border-r border-slate-800 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'w-20' : 'w-64'}`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center shrink-0 shadow-md shadow-indigo-900/40">
              <School className="w-5 h-5 text-white" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col truncate">
                <span className="font-bold text-base tracking-tight text-white">NexSchool ERP</span>
                <span className="text-[10px] uppercase font-semibold tracking-wider text-indigo-400">
                  Enterprise
                </span>
              </div>
            )}
          </div>
          {/* Collapse toggle button on desktop */}
          <button
            onClick={toggleCollapse}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* User Snapshot Bar (Collapsed or Expanded) */}
        {!isCollapsed && (
          <div className="p-3 mx-3 my-3 bg-slate-800/60 rounded-xl border border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-semibold flex items-center justify-center text-sm">
              {user?.username?.substring(0, 2).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 truncate">
              <p className="text-xs font-semibold text-slate-200 truncate">{user?.username || 'User'}</p>
              <p className="text-[10px] text-indigo-400 uppercase tracking-wider font-mono">
                {user?.role?.displayName || user?.role?.name || 'Authorized'}
              </p>
            </div>
          </div>
        )}

        {/* Navigation Items Scroll Area */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {navigationItems
            .filter((item) => item.show)
            .map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);

              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  onClick={closeMobileSidebar}
                  title={isCollapsed ? item.name : undefined}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-900/40'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70'
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {!isCollapsed && <span className="truncate">{item.name}</span>}
                </NavLink>
              );
            })}
        </nav>

        {/* Footer info */}
        {!isCollapsed && (
          <div className="p-4 border-t border-slate-800 text-[11px] text-slate-500 flex justify-between items-center">
            <span>Session: 2025-2026</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live
            </span>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;
