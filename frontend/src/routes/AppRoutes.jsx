import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import DashboardLayout from '../layouts/DashboardLayout.jsx';
import AuthLayout from '../layouts/AuthLayout.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';

// Auth Pages
import LoginPage from '../pages/auth/LoginPage.jsx';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage.jsx';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage.jsx';
import FrontPage from '../pages/welcome/FrontPage.jsx';

// Core Pages
import DashboardPage from '../pages/dashboard/DashboardPage.jsx';
import UserProfilePage from '../pages/profile/UserProfilePage.jsx';
import UnauthorizedPage from '../pages/unauthorized/UnauthorizedPage.jsx';
import NotFoundPage from '../pages/unauthorized/NotFoundPage.jsx';

// Phase 5 Pages: Administration, Students & Parents
import AdminSetupPage from '../pages/admin/AdminSetupPage.jsx';
import StudentsPage from '../pages/students/StudentsPage.jsx';
import StudentDetailPage from '../pages/students/StudentDetailPage.jsx';
import ParentsPage from '../pages/parents/ParentsPage.jsx';

// Phase 6 Pages: Academics
import AcademicsPage from '../pages/academics/AcademicsPage.jsx';

// Phase 7 Pages: Accounts & Finance
import FinancePage from '../pages/finance/FinancePage.jsx';

// Phase 8 Pages: Operations Part 1
import AdmissionsPage from '../pages/admissions/AdmissionsPage.jsx';
import StaffPage from '../pages/staff/StaffPage.jsx';
import LibraryPage from '../pages/library/LibraryPage.jsx';
import TransportPage from '../pages/transport/TransportPage.jsx';

// Phase 9 Pages: Operations Part 2
import MedicalPage from '../pages/medical/MedicalPage.jsx';
import ITPage from '../pages/it/ITPage.jsx';
import HousekeepingPage from '../pages/housekeeping/HousekeepingPage.jsx';
import SecurityPage from '../pages/security/SecurityPage.jsx';
import CanteenPage from '../pages/canteen/CanteenPage.jsx';

// Phase 10 Pages: Communication & Security Audit
import NoticesPage from '../pages/notices/NoticesPage.jsx';
import AuditLogsPage from '../pages/audit/AuditLogsPage.jsx';

// Phase 11 Pages: Dedicated Student & Parent Portals
import StudentPortalPage from '../pages/portal/StudentPortalPage.jsx';
import ParentPortalPage from '../pages/portal/ParentPortalPage.jsx';

// Roles & RBAC Management
import RbacPage from '../pages/rbac/RbacPage.jsx';

// Placeholder module component for upcoming phases
const ModulePlaceholder = ({ title, phase, description }) => (
  <div className="space-y-4">
    <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xs text-center max-w-xl mx-auto my-12">
      <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center mx-auto mb-4">
        {phase}
      </div>
      <h2 className="text-xl font-bold text-slate-900">{title}</h2>
      <p className="text-sm text-slate-500 mt-2">{description}</p>
      <div className="mt-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-xs font-medium text-slate-600">
        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" /> Scheduled for {phase}
      </div>
    </div>
  </div>
);

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Front / Welcome Page (Visible for 2 seconds before login) */}
      <Route path="/" element={<FrontPage />} />
      <Route path="/welcome" element={<FrontPage />} />

      {/* Public Authentication Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      </Route>

      {/* Protected ERP Application Routes */}
      <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/profile" element={<UserProfilePage />} />

        {/* Phase 5: Administration Setup */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'PRINCIPAL', 'ADMINISTRATOR']}>
              <AdminSetupPage />
            </ProtectedRoute>
          }
        />

        {/* Phase 5: Student Directory & 360 Profiles */}
        <Route
          path="/students"
          element={
            <ProtectedRoute requiredPermission="students:view">
              <StudentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/students/:id"
          element={
            <ProtectedRoute requiredPermission="students:view">
              <StudentDetailPage />
            </ProtectedRoute>
          }
        />

        {/* Phase 5: Parents Directory */}
        <Route
          path="/parents"
          element={
            <ProtectedRoute requiredPermission="students:view">
              <ParentsPage />
            </ProtectedRoute>
          }
        />

        {/* Phase 6 Module: Academics */}
        <Route
          path="/academics"
          element={
            <ProtectedRoute requiredPermission="academics:view">
              <AcademicsPage />
            </ProtectedRoute>
          }
        />

        {/* Phase 7 Module: Accounts & Finance */}
        <Route
          path="/finance"
          element={
            <ProtectedRoute requiredPermission="fees:view">
              <FinancePage />
            </ProtectedRoute>
          }
        />

        {/* Phase 8 Modules: Operations Part 1 */}
        <Route
          path="/staff"
          element={
            <ProtectedRoute requiredPermission="staff:view">
              <StaffPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admissions"
          element={
            <ProtectedRoute requiredPermission="admissions:view">
              <AdmissionsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/library"
          element={
            <ProtectedRoute requiredPermission="library:view">
              <LibraryPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/transport"
          element={
            <ProtectedRoute requiredPermission="transport:view">
              <TransportPage />
            </ProtectedRoute>
          }
        />

        {/* Phase 9 Modules: Operations Part 2 */}
        <Route
          path="/medical"
          element={
            <ProtectedRoute requiredPermission="medical:view">
              <MedicalPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/it"
          element={
            <ProtectedRoute requiredPermission="it:view">
              <ITPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/housekeeping"
          element={
            <ProtectedRoute requiredPermission="housekeeping:view">
              <HousekeepingPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/security"
          element={
            <ProtectedRoute requiredPermission="security:view">
              <SecurityPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/canteen"
          element={
            <ProtectedRoute requiredPermission="canteen:view">
              <CanteenPage />
            </ProtectedRoute>
          }
        />

        {/* Super Admin & Administrative Protected System Routes */}
        <Route
          path="/rbac"
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMINISTRATOR']}>
              <RbacPage />
            </ProtectedRoute>
          }
        />

        {/* Phase 10: Campus Notices & Circulars */}
        <Route
          path="/notices"
          element={
            <ProtectedRoute>
              <NoticesPage />
            </ProtectedRoute>
          }
        />

        {/* Phase 10: Central System Audit Logs */}
        <Route
          path="/audit-logs"
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'PRINCIPAL']}>
              <AuditLogsPage />
            </ProtectedRoute>
          }
        />

        {/* Phase 11: Dedicated Student & Parent Portals */}
        <Route
          path="/portal/student"
          element={
            <ProtectedRoute>
              <StudentPortalPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/portal/parent"
          element={
            <ProtectedRoute>
              <ParentPortalPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Error Routes */}
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;
