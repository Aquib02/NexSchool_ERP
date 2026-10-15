import React, { useState, useEffect, useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
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
  ChevronDown,
  School,
  UserCircle,
  Home,
  MessageSquare,
  Radio,
  Award,
  Brain,
  Layers,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

export const Sidebar = ({ isOpen, isCollapsed, toggleCollapse, closeMobileSidebar }) => {
  const { user, hasPermission, hasRole } = useAuth();
  const location = useLocation();

  const isStudent = user?.role?.name === 'STUDENT';
  const isParent = user?.role?.name === 'PARENT';

  // Navigation catalog structured into Parent Modules and associated Sub-Modules
  const navigationGroups = useMemo(() => [
    {
      id: 'dashboard',
      name: isStudent ? 'Student Portal' : isParent ? 'Parent Portal' : 'Dashboard',
      icon: isStudent ? UserCircle : isParent ? Users : LayoutDashboard,
      isStandalone: true,
      path: isStudent ? '/portal/student' : isParent ? '/portal/parent' : '/dashboard',
      show: true,
    },
    {
      id: 'academics',
      name: 'Academic & Learning',
      icon: GraduationCap,
      description: 'Curriculum, LMS & certificates',
      subModules: [
        {
          name: 'Academics & Timetable',
          path: '/academics',
          icon: BookOpen,
          show: hasPermission('academics:view'),
        },
        {
          name: 'LMS & E-Learning',
          path: '/lms',
          icon: Laptop,
          show: hasPermission('lms:view'),
        },
        {
          name: 'Certificates & ID Cards',
          path: '/certificates',
          icon: Award,
          show: hasPermission('certificates:view'),
        },
      ],
    },
    {
      id: 'students',
      name: 'Students & Admissions',
      icon: Users,
      description: 'Admissions, records & student portal',
      subModules: [
        {
          name: 'Admissions Pipeline',
          path: '/admissions',
          icon: FileCheck,
          show: !isStudent && hasPermission('admissions:view'),
        },
        {
          name: 'Students Directory',
          path: '/students',
          icon: Users,
          show: !isStudent && hasPermission('students:view'),
        },
        {
          name: 'Student Portal',
          path: '/portal/student',
          icon: UserCircle,
          show: !isStudent && !isParent,
        },
        {
          name: 'Parent Portal',
          path: '/portal/parent',
          icon: Users,
          show: !isStudent && !isParent,
        },
      ],
    },
    {
      id: 'finance',
      name: 'Finance & Accounts',
      icon: CreditCard,
      description: 'Fee collection & invoices',
      subModules: [
        {
          name: 'Fee Collections & Ledgers',
          path: '/finance',
          icon: CreditCard,
          show: hasPermission('fees:view'),
        },
      ],
    },
    {
      id: 'hr',
      name: 'Human Resources',
      icon: UserCheck,
      description: 'Staff directory & leaves',
      subModules: [
        {
          name: 'Staff & Faculty',
          path: '/staff',
          icon: UserCheck,
          show: hasPermission('staff:view'),
        },
      ],
    },
    {
      id: 'transport',
      name: 'Transport & Fleet',
      icon: Bus,
      description: 'Bus logistics & live GPS tracking',
      subModules: [
        {
          name: 'Transport Management',
          path: '/transport',
          icon: Bus,
          show: hasPermission('transport:view'),
        },
        {
          name: 'Fleet Live GPS',
          path: '/tracking',
          icon: Radio,
          show: hasPermission('tracking:view'),
        },
      ],
    },
    {
      id: 'communication',
      name: 'Communication & Notices',
      icon: MessageSquare,
      description: 'Broadcasts, PTMs & circulars',
      subModules: [
        {
          name: 'Communication & PTM',
          path: '/communication',
          icon: MessageSquare,
          show: hasPermission('communication:view'),
        },
        {
          name: 'Campus Circulars',
          path: '/notices',
          icon: Megaphone,
          show: true,
        },
      ],
    },
    {
      id: 'operations',
      name: 'Campus Operations',
      icon: School,
      description: 'Library, clinic, canteen & security',
      subModules: [
        {
          name: 'Library Vault',
          path: '/library',
          icon: BookOpen,
          show: hasPermission('library:view'),
        },
        {
          name: 'Medical & Clinic',
          path: '/medical',
          icon: Stethoscope,
          show: hasPermission('medical:view'),
        },
        {
          name: 'Canteen & Cafeteria',
          path: '/canteen',
          icon: UtensilsCrossed,
          show: hasPermission('canteen:view'),
        },
        {
          name: 'Security & Campus Gate',
          path: '/security',
          icon: ShieldCheck,
          show: hasPermission('security:view'),
        },
        {
          name: 'Housekeeping & Facilities',
          path: '/housekeeping',
          icon: Sparkles,
          show: hasPermission('housekeeping:view'),
        },
        {
          name: 'IT Assets & Helpdesk',
          path: '/it',
          icon: Laptop,
          show: hasPermission('it:view'),
        },
      ],
    },
    {
      id: 'admin',
      name: 'Administration & Security',
      icon: Shield,
      description: 'System setup, RBAC, AI & logs',
      subModules: [
        {
          name: 'Institution Setup',
          path: '/admin',
          icon: Settings,
          show: hasRole(['SUPER_ADMIN', 'PRINCIPAL', 'ADMINISTRATOR']),
        },
        {
          name: 'Roles & RBAC',
          path: '/rbac',
          icon: Shield,
          show: hasRole(['SUPER_ADMIN', 'ADMINISTRATOR']),
        },
        {
          name: 'AI Analytics & Copilot',
          path: '/ai-analytics',
          icon: Brain,
          show: hasPermission('analytics:view'),
        },
        {
          name: 'System Audit Logs',
          path: '/audit-logs',
          icon: FileText,
          show: hasRole(['SUPER_ADMIN', 'ADMIN', 'PRINCIPAL']) || hasPermission('audit:view'),
        },
      ],
    },
  ], [hasPermission, hasRole, isStudent, isParent]);

  // Accordion open/close state for parent modules
  const [openModules, setOpenModules] = useState(() => {
    const initial = {};
    const current = location.pathname;
    navigationGroups.forEach((group) => {
      if (group.subModules?.some((s) => current === s.path || current.startsWith(s.path + '/'))) {
        initial[group.id] = true;
      }
    });
    return initial;
  });

  // Automatically expand parent module when URL changes to one of its submodules
  useEffect(() => {
    const current = location.pathname;
    navigationGroups.forEach((group) => {
      if (group.subModules?.some((s) => current === s.path || current.startsWith(s.path + '/'))) {
        setOpenModules((prev) => ({ ...prev, [group.id]: true }));
      }
    });
  }, [location.pathname, navigationGroups]);

  const toggleGroup = (groupId) => {
    setOpenModules((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-xs"
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
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* User Snapshot Bar */}
        {!isCollapsed && (
          <div className="p-3 mx-3 my-3 bg-slate-800/60 rounded-xl border border-slate-800/80 flex items-center gap-3">
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

        {/* Navigation Items (Modules & Sub-Modules Tree) */}
        <nav
          className={`flex-1 px-3 py-2 space-y-1 ${
            isCollapsed ? 'overflow-visible' : 'overflow-y-auto'
          }`}
        >
          {navigationGroups.map((group) => {
            // Standalone Direct Item (e.g. Dashboard)
            if (group.isStandalone) {
              if (group.show === false) return null;
              const Icon = group.icon;
              const isActive = location.pathname === group.path;

              return (
                <div key={group.id} className="relative group">
                  <NavLink
                    to={group.path}
                    onClick={closeMobileSidebar}
                    title={isCollapsed ? group.name : undefined}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-900/40 font-semibold'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70'
                    }`}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    {!isCollapsed && <span className="truncate">{group.name}</span>}
                  </NavLink>

                  {/* Compact tooltip on hover */}
                  {isCollapsed && (
                    <div className="hidden group-hover:flex absolute left-full top-1/2 -translate-y-1/2 ml-2.5 z-50 bg-slate-900 border border-slate-700 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-xl">
                      {group.name}
                    </div>
                  )}
                </div>
              );
            }

            // Group with Sub-Modules
            const visibleSubs = (group.subModules || []).filter((s) => s.show !== false);
            if (visibleSubs.length === 0) return null;

            const Icon = group.icon;
            const isGroupOpen = !!openModules[group.id];
            const hasActiveChild = visibleSubs.some(
              (s) => location.pathname === s.path || location.pathname.startsWith(s.path + '/')
            );

            return (
              <div key={group.id} className="relative group space-y-1">
                {/* Parent Module Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (isCollapsed) {
                      toggleCollapse();
                      setOpenModules((prev) => ({ ...prev, [group.id]: true }));
                    } else {
                      toggleGroup(group.id);
                    }
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    hasActiveChild
                      ? 'bg-slate-800/90 text-indigo-300 font-semibold border border-indigo-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                  title={isCollapsed ? `${group.name} (${visibleSubs.length} sub-modules)` : undefined}
                >
                  <div className="flex items-center gap-3 truncate">
                    <Icon
                      className={`w-5 h-5 shrink-0 transition-colors ${
                        hasActiveChild ? 'text-indigo-400' : 'text-slate-400'
                      }`}
                    />
                    {!isCollapsed && (
                      <span className="truncate text-left">{group.name}</span>
                    )}
                  </div>

                  {!isCollapsed && (
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400 font-mono font-medium">
                        {visibleSubs.length}
                      </span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                          isGroupOpen ? 'rotate-180 text-indigo-400' : ''
                        }`}
                      />
                    </div>
                  )}
                </button>

                {/* Sub-Modules Accordion List (Expanded Sidebar) */}
                {!isCollapsed && isGroupOpen && (
                  <div className="pl-3 pr-1 py-1 space-y-0.5 border-l-2 border-indigo-500/30 ml-5 my-1 transition-all">
                    {visibleSubs.map((sub) => {
                      const SubIcon = sub.icon;
                      const isSubActive =
                        location.pathname === sub.path || location.pathname.startsWith(sub.path + '/');

                      return (
                        <NavLink
                          key={sub.path}
                          to={sub.path}
                          onClick={closeMobileSidebar}
                          className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            isSubActive
                              ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                          }`}
                        >
                          <SubIcon className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{sub.name}</span>
                        </NavLink>
                      );
                    })}
                  </div>
                )}

                {/* Compact Mode Hover Flyout Menu */}
                {isCollapsed && (
                  <div className="hidden group-hover:block absolute left-full top-0 ml-2 w-56 bg-slate-900 border border-slate-700/90 rounded-2xl p-2.5 shadow-2xl z-50 pointer-events-auto">
                    <div className="px-2 py-1.5 border-b border-slate-800 mb-1.5">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-indigo-400" />
                        <p className="text-xs font-bold text-white truncate">{group.name}</p>
                      </div>
                      {group.description && (
                        <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                          {group.description}
                        </p>
                      )}
                    </div>

                    <div className="space-y-0.5">
                      {visibleSubs.map((sub) => {
                        const SubIcon = sub.icon;
                        const isSubActive =
                          location.pathname === sub.path || location.pathname.startsWith(sub.path + '/');

                        return (
                          <NavLink
                            key={sub.path}
                            to={sub.path}
                            onClick={closeMobileSidebar}
                            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                              isSubActive
                                ? 'bg-indigo-600 text-white font-semibold'
                                : 'text-slate-300 hover:text-white hover:bg-slate-800'
                            }`}
                          >
                            <SubIcon className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{sub.name}</span>
                          </NavLink>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer Info */}
        {!isCollapsed && (
          <div className="p-3 border-t border-slate-800 text-[11px] text-slate-500 flex justify-between items-center shrink-0">
            <span>Session: 2025-2026</span>
            <span className="text-emerald-400 flex items-center gap-1 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live
            </span>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;
