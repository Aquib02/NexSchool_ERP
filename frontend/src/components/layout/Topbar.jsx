import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  Bell,
  Search,
  User,
  KeyRound,
  LogOut,
  Calendar,
  ChevronDown,
  X,
  Loader2,
  GraduationCap,
  Briefcase,
  FileText,
  BookOpen,
  Receipt,
  Wrench,
  ArrowRight,
  Compass,
  Laptop,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import notificationService from '../../services/notificationService.js';
import searchService from '../../services/searchService.js';
import adminService from '../../services/adminService.js';

const QUICK_NAV = [
  { label: 'Students Directory', path: '/students', keywords: 'student enrollment pupils class roll' },
  { label: 'Staff & HR Directory', path: '/staff', keywords: 'staff teacher employee payroll leave hr faculty' },
  { label: 'Academic Sessions & School Setup', path: '/admin?tab=sessions', keywords: 'academic session year setup classes 2024 2023 history past records' },
  { label: 'Admissions & Enquiries', path: '/admissions', keywords: 'admission candidate application enquiry applicant' },
  { label: 'Accounts & Fee Management', path: '/finance', keywords: 'fee invoice payment accounts expense finance money' },
  { label: 'Academics & Timetable', path: '/academics', keywords: 'academics class section subject syllabus timetable schedule' },
  { label: 'Library Management', path: '/library', keywords: 'library books issue return author catalog isbn' },
  { label: 'Transport & Fleet', path: '/transport', keywords: 'transport bus vehicle route driver fleet' },
  { label: 'IT Assets & Helpdesk', path: '/it', keywords: 'it asset hardware ticket computer laptop support helpdesk' },
  { label: 'Housekeeping & Facilities', path: '/housekeeping', keywords: 'housekeeping facility cleaning room maintenance supplies' },
  { label: 'Canteen & Meal Point', path: '/canteen', keywords: 'canteen meal food lunch menu dishes pos order' },
  { label: 'Medical Room & Clinic', path: '/medical', keywords: 'medical clinic health doctor nurse visit record allergy' },
  { label: 'Security & Campus Gates', path: '/security', keywords: 'security gatepass visitor guard incident pass checkpoint' },
  { label: 'Notices & Circulars', path: '/notices', keywords: 'notice circular bulletin board announcement broadcast' },
  { label: 'Audit Trail & Logs', path: '/audit', keywords: 'audit logs trail activity security history' },
  { label: 'User Roles & Permissions (RBAC)', path: '/rbac', keywords: 'rbac roles permissions access control security users' },
];

export const Topbar = ({ toggleMobileSidebar, onChangePasswordClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Dropdown states
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Academic Sessions state
  const [sessions, setSessions] = useState([]);
  const [sessionOpen, setSessionOpen] = useState(false);
  const activeSession = sessions.find((s) => s.isCurrent) || sessions[0];

  // Global Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState({
    students: [],
    staff: [],
    admissions: [],
    books: [],
    invoices: [],
    itTickets: [],
    assets: [],
  });

  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);
  const sessionRef = useRef(null);
  const searchRef = useRef(null);
  const searchInputRef = useRef(null);
  const mobileSearchInputRef = useRef(null);

  const loadNotifications = async () => {
    try {
      const res = await notificationService.getNotifications();
      if (res.data) {
        setNotifications(res.data.data || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadSessions = async () => {
    try {
      const res = await adminService.getSessions();
      if (res.data) {
        setSessions(res.data.data || res.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadNotifications();
    loadSessions();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(e.target)) {
        setNotificationOpen(false);
      }
      if (sessionRef.current && !sessionRef.current.contains(e.target)) {
        setSessionOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut: Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Debounced search query
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) {
      setSearchResults({
        students: [],
        staff: [],
        admissions: [],
        books: [],
        invoices: [],
        itTickets: [],
        assets: [],
      });
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await searchService.globalSearch(trimmed);
        const data = res.data?.data || res.data || {};
        setSearchResults({
          students: data.students || [],
          staff: data.staff || [],
          admissions: data.admissions || [],
          books: data.books || [],
          invoices: data.invoices || [],
          itTickets: data.itTickets || [],
          assets: data.assets || [],
        });
      } catch (err) {
        console.error('Global search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Quick navigation filter
  const filteredNav = searchQuery.trim()
    ? QUICK_NAV.filter((item) => {
        const q = searchQuery.toLowerCase();
        return item.label.toLowerCase().includes(q) || item.keywords.toLowerCase().includes(q);
      }).slice(0, 4)
    : [];

  const totalResults =
    filteredNav.length +
    (searchResults.students?.length || 0) +
    (searchResults.staff?.length || 0) +
    (searchResults.admissions?.length || 0) +
    (searchResults.books?.length || 0) +
    (searchResults.invoices?.length || 0) +
    (searchResults.itTickets?.length || 0) +
    (searchResults.assets?.length || 0);

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      e.preventDefault();
      setIsSearchOpen(false);
      setMobileSearchOpen(false);
      navigate(`/students?search=${encodeURIComponent(searchQuery.trim())}`);
    } else if (e.key === 'Escape') {
      setIsSearchOpen(false);
      setMobileSearchOpen(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults({
      students: [],
      staff: [],
      admissions: [],
      books: [],
      invoices: [],
      itTickets: [],
      assets: [],
    });
    if (searchInputRef.current) searchInputRef.current.focus();
  };

  const handleNavigate = (path) => {
    setIsSearchOpen(false);
    setMobileSearchOpen(false);
    navigate(path);
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = async (n) => {
    try {
      if (!n.isRead) {
        await notificationService.markAsRead(n._id);
        setUnreadCount((prev) => Math.max(0, prev - 1));
        setNotifications((prev) =>
          prev.map((item) => (item._id === n._id ? { ...item, isRead: true } : item))
        );
      }
      setNotificationOpen(false);
      if (n.actionUrl) {
        navigate(n.actionUrl);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Render search results content
  const renderSearchDropdown = () => (
    <div className="absolute left-0 mt-2 w-full min-w-[340px] md:min-w-[460px] max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200/90 py-2 z-50 animate-in fade-in zoom-in-95 duration-100 max-h-[80vh] overflow-y-auto divide-y divide-slate-100">
      {/* Header with status */}
      <div className="px-4 py-2 flex items-center justify-between text-xs text-slate-500 bg-slate-50/50">
        <span className="font-semibold text-slate-700">
          {searchQuery.trim().length >= 2
            ? `Results for "${searchQuery}" (${totalResults})`
            : 'Quick Navigation & Search'}
        </span>
        {isSearching && (
          <span className="flex items-center gap-1 text-indigo-600 font-medium text-[11px]">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Searching...
          </span>
        )}
      </div>

      {/* 1. Quick Navigation */}
      {filteredNav.length > 0 && (
        <div className="p-2">
          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Navigation Jump
          </div>
          {filteredNav.map((item) => (
            <button
              key={item.path}
              onClick={() => handleNavigate(item.path)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs hover:bg-indigo-50/60 text-slate-700 hover:text-indigo-700 transition-colors text-left group"
            >
              <div className="flex items-center gap-2.5">
                <Compass className="w-4 h-4 text-indigo-500" />
                <span className="font-medium">{item.label}</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
            </button>
          ))}
        </div>
      )}

      {/* 2. Students */}
      {searchResults.students?.length > 0 && (
        <div className="p-2">
          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Students ({searchResults.students.length})
          </div>
          {searchResults.students.map((s) => (
            <button
              key={s._id}
              onClick={() =>
                handleNavigate(`/students?search=${encodeURIComponent(s.studentId || s.firstName)}`)
              }
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs hover:bg-slate-50 text-slate-700 transition-colors text-left"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900">
                    {s.firstName} {s.lastName}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    ID: <span className="font-mono text-slate-600">{s.studentId || s.admissionNumber}</span>
                    {s.classId?.name && ` • Class: ${s.classId.name}`}
                    {s.sectionId?.name && ` (${s.sectionId.name})`}
                  </div>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-emerald-50 text-emerald-700">
                {s.status || 'Active'}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* 3. Staff / Teachers */}
      {searchResults.staff?.length > 0 && (
        <div className="p-2">
          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Staff & Faculty ({searchResults.staff.length})
          </div>
          {searchResults.staff.map((emp) => (
            <button
              key={emp._id}
              onClick={() =>
                handleNavigate(`/staff?search=${encodeURIComponent(emp.employeeId || emp.firstName)}`)
              }
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs hover:bg-slate-50 text-slate-700 transition-colors text-left"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xs">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900">
                    {emp.firstName} {emp.lastName}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {emp.designationId?.title || 'Staff'} • {emp.departmentId?.name || 'School'} • ID:{' '}
                    <span className="font-mono text-slate-600">{emp.employeeId}</span>
                  </div>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-purple-50 text-purple-700">
                {emp.status || 'Active'}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* 4. Admissions */}
      {searchResults.admissions?.length > 0 && (
        <div className="p-2">
          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Admissions ({searchResults.admissions.length})
          </div>
          {searchResults.admissions.map((adm) => (
            <button
              key={adm._id}
              onClick={() =>
                handleNavigate(
                  `/admissions?search=${encodeURIComponent(adm.applicationNumber || adm.candidateName)}`
                )
              }
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs hover:bg-slate-50 text-slate-700 transition-colors text-left"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900">{adm.candidateName}</div>
                  <div className="text-[11px] text-slate-400">
                    App #: <span className="font-mono text-slate-600">{adm.applicationNumber}</span>
                    {adm.phone && ` • ${adm.phone}`}
                  </div>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-amber-50 text-amber-700">
                {adm.status}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* 5. Library Books */}
      {searchResults.books?.length > 0 && (
        <div className="p-2">
          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Library Books ({searchResults.books.length})
          </div>
          {searchResults.books.map((b) => (
            <button
              key={b._id}
              onClick={() =>
                handleNavigate(`/library?search=${encodeURIComponent(b.title)}`)
              }
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs hover:bg-slate-50 text-slate-700 transition-colors text-left"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center font-bold text-xs">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900">{b.title}</div>
                  <div className="text-[11px] text-slate-400">
                    By {b.author} • ISBN: {b.isbn || b.accessionNumber || 'N/A'}
                  </div>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-sky-50 text-sky-700">
                {b.availableCopies} in stock
              </span>
            </button>
          ))}
        </div>
      )}

      {/* 6. Fees / Invoices */}
      {searchResults.invoices?.length > 0 && (
        <div className="p-2">
          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Invoices & Fees ({searchResults.invoices.length})
          </div>
          {searchResults.invoices.map((inv) => (
            <button
              key={inv._id}
              onClick={() =>
                handleNavigate(`/finance?tab=invoices&search=${encodeURIComponent(inv.invoiceNumber)}`)
              }
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs hover:bg-slate-50 text-slate-700 transition-colors text-left"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900 font-mono">
                    {inv.invoiceNumber}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Student: {inv.studentId?.firstName} {inv.studentId?.lastName} • Total: ${inv.totalAmount}
                  </div>
                </div>
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                  inv.status === 'Paid'
                    ? 'bg-emerald-50 text-emerald-700'
                    : inv.status === 'Partial'
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-rose-50 text-rose-700'
                }`}
              >
                {inv.status}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* 7. IT Helpdesk & Assets */}
      {(searchResults.itTickets?.length > 0 || searchResults.assets?.length > 0) && (
        <div className="p-2">
          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            IT Tickets & Assets
          </div>
          {searchResults.itTickets?.map((t) => (
            <button
              key={t._id}
              onClick={() =>
                handleNavigate(`/it?search=${encodeURIComponent(t.ticketNumber || t.title)}`)
              }
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs hover:bg-slate-50 text-slate-700 transition-colors text-left"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xs">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900">{t.title}</div>
                  <div className="text-[11px] text-slate-400">
                    Ticket: <span className="font-mono text-slate-600">{t.ticketNumber}</span> • Priority:{' '}
                    {t.priority}
                  </div>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-700">
                {t.status}
              </span>
            </button>
          ))}
          {searchResults.assets?.map((a) => (
            <button
              key={a._id}
              onClick={() =>
                handleNavigate(`/it?search=${encodeURIComponent(a.assetTag || a.assetName)}`)
              }
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs hover:bg-slate-50 text-slate-700 transition-colors text-left"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                  <Laptop className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900">{a.assetName}</div>
                  <div className="text-[11px] text-slate-400">
                    Tag: <span className="font-mono text-slate-600">{a.assetTag}</span> • Location:{' '}
                    {a.location || 'Campus'}
                  </div>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-blue-50 text-blue-700">
                {a.status}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Empty State */}
      {searchQuery.trim().length >= 2 && !isSearching && totalResults === 0 && (
        <div className="p-6 text-center text-xs text-slate-400 space-y-1">
          <p className="font-medium text-slate-600">No records found for "{searchQuery}"</p>
          <p className="text-[11px] text-slate-400">
            Press <kbd className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-[10px] text-slate-600">Enter</kbd> to search in Students directory.
          </p>
        </div>
      )}

      {/* Initial Prompt when input is focused but empty */}
      {searchQuery.trim().length < 2 && (
        <div className="p-3">
          <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Suggested Quick Links
          </div>
          <div className="grid grid-cols-2 gap-1 mt-1">
            {QUICK_NAV.slice(0, 6).map((item) => (
              <button
                key={item.path}
                onClick={() => handleNavigate(item.path)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs hover:bg-slate-50 text-slate-700 text-left transition-colors"
              >
                <Compass className="w-3.5 h-3.5 text-indigo-500" />
                <span className="truncate">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Footer shortcut tips */}
      <div className="px-4 py-2 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <span>
          Press <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono text-[10px] text-slate-600">Enter</kbd> to search
        </span>
        <span>
          <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono text-[10px] text-slate-600">Esc</kbd> to close
        </span>
      </div>
    </div>
  );

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 sticky top-0 z-30 flex items-center justify-between px-4 lg:px-8">
      {/* Left side: Hamburger button + Global Search */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleMobileSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Input (Desktop) */}
        <div className="relative hidden sm:block w-72 md:w-96 lg:w-[440px]" ref={searchRef}>
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            onFocus={() => setIsSearchOpen(true)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search students, staff, admission, books, tickets..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-16 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-xs"
          />

          {/* Clear or Keyboard Shortcut Badge */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {searchQuery ? (
              <button
                type="button"
                onClick={handleClearSearch}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/60"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <kbd className="hidden md:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white border border-slate-200 rounded-md shadow-2xs">
                Ctrl K
              </kbd>
            )}
          </div>

          {/* Search Dropdown Palette */}
          {isSearchOpen && renderSearchDropdown()}
        </div>

        {/* Mobile Search Toggle Button */}
        <button
          onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
          className="sm:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
          title="Search"
        >
          <Search className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile Search Bar Dropdown */}
      {mobileSearchOpen && (
        <div className="sm:hidden absolute top-16 left-0 w-full bg-white border-b border-slate-200 p-3 shadow-lg z-40">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              ref={mobileSearchInputRef}
              autoFocus
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search students, staff, tickets..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-9 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {isSearchOpen && renderSearchDropdown()}
        </div>
      )}

      {/* Right side: Session badge + Notifications + User Menu */}
      <div className="flex items-center gap-3">
        {/* Academic Session Switcher */}
        <div className="relative" ref={sessionRef}>
          <button
            onClick={() => setSessionOpen(!sessionOpen)}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700 transition-colors cursor-pointer shadow-2xs"
            title="Switch or view Academic Sessions"
          >
            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
            <span>AY: {activeSession?.name || '2025-2026'}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {sessionOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Academic Sessions
                  </div>
                  <div className="text-[10px] text-slate-400">Past & current operating years</div>
                </div>
                <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
                  {sessions.length} Available
                </span>
              </div>

              <div className="max-h-60 overflow-y-auto p-1.5 space-y-1">
                {sessions.map((s) => (
                  <button
                    key={s._id}
                    onClick={async () => {
                      if (!s.isCurrent) {
                        await adminService.updateSession(s._id, { isCurrent: true, status: 'active' });
                        loadSessions();
                      }
                      setSessionOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left transition-colors ${
                      s.isCurrent
                        ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200/60'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold">{s.name}</span>
                        {s.isCurrent && (
                          <span className="px-1.5 py-0.2 text-[9px] bg-indigo-600 text-white rounded-md font-bold">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                        {s.status === 'completed' ? 'Past / Archived' : s.status === 'active' ? 'Current Operational' : 'Upcoming'}
                      </div>
                    </div>
                    {s.isCurrent ? (
                      <span className="text-[10px] font-bold text-indigo-600">Selected</span>
                    ) : (
                      <span className="text-[10px] text-slate-400 hover:text-indigo-600 font-medium">
                        Set Active
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <div className="border-t border-slate-100 p-2 text-center bg-slate-50/50 rounded-b-2xl">
                <button
                  onClick={() => {
                    setSessionOpen(false);
                    navigate('/admin?tab=sessions');
                  }}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  Manage / Add Academic Years &rarr;
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Notification Center */}
        <div className="relative" ref={notificationRef}>
          <button
            title="Notifications"
            onClick={() => setNotificationOpen(!notificationOpen)}
            className="relative p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 px-1.5 py-0.2 min-w-[18px] text-[10px] font-bold bg-indigo-600 text-white rounded-full flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {notificationOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200/80 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Notifications
                  </span>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700">
                      {unreadCount} New
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold"
                  >
                    Mark all as read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No new notifications
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n._id}
                      onClick={() => handleNotificationClick(n)}
                      className={`p-3 text-xs hover:bg-slate-50 transition-colors cursor-pointer ${
                        !n.isRead ? 'bg-indigo-50/30' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-slate-900 leading-snug">{n.title}</span>
                        <span
                          className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${
                            n.category === 'Emergency'
                              ? 'bg-rose-100 text-rose-700'
                              : n.category === 'Fee'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {n.category}
                        </span>
                      </div>
                      <p className="text-slate-600 mt-1 line-clamp-2">{n.message}</p>
                      <span className="text-[10px] text-slate-400 mt-1.5 block">
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div className="border-t border-slate-100 p-2 text-center">
                <button
                  onClick={() => {
                    setNotificationOpen(false);
                    navigate('/notices');
                  }}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  View Campus Bulletin Board &rarr;
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="h-6 w-[1px] bg-slate-200 mx-1" />

        {/* User Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-semibold flex items-center justify-center text-xs shadow-xs">
              {user?.username?.substring(0, 2).toUpperCase() || 'U'}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-800 leading-tight">
                {user?.username || 'User'}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                {user?.role?.displayName || user?.role?.name}
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200/80 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-800">{user?.username}</p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email || 'No email'}</p>
                <span className="inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 text-indigo-700">
                  {user?.role?.displayName || user?.role?.name}
                </span>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    navigate('/profile');
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  My Profile
                </button>

                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    if (onChangePasswordClick) onChangePasswordClick();
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                >
                  <KeyRound className="w-4 h-4 text-slate-400" />
                  Change Password
                </button>
              </div>

              <div className="border-t border-slate-100 pt-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
