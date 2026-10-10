import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar.jsx';
import Topbar from '../components/layout/Topbar.jsx';
import ChangePasswordModal from '../components/common/ChangePasswordModal.jsx';

export const DashboardLayout = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true';
  });
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebar_collapsed', String(newState));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <Sidebar
        isOpen={mobileSidebarOpen}
        isCollapsed={isCollapsed}
        toggleCollapse={toggleCollapse}
        closeMobileSidebar={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          isCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        <Topbar
          toggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          onChangePasswordClick={() => setIsChangePasswordOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>

        <footer className="py-4 px-8 border-t border-slate-200/60 text-center text-xs text-slate-400 bg-white">
          <span>&copy; {new Date().getFullYear()} NexSchool ERP. Enterprise School Management Platform.</span>
        </footer>
      </div>

      {/* Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </div>
  );
};

export default DashboardLayout;
