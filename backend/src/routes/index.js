import { Router } from 'express';
import authRoutes from './authRoutes.js';
import rbacRoutes from './rbacRoutes.js';
import adminRoutes from './adminRoutes.js';
import studentRoutes from './studentRoutes.js';
import parentRoutes from './parentRoutes.js';
import academicsRoutes from './academicsRoutes.js';
import financeRoutes from './financeRoutes.js';
import admissionsRoutes from './admissionsRoutes.js';
import staffRoutes from './staffRoutes.js';
import libraryRoutes from './libraryRoutes.js';
import transportRoutes from './transportRoutes.js';
import medicalRoutes from './medicalRoutes.js';
import itRoutes from './itRoutes.js';
import facilityRoutes from './facilityRoutes.js';
import securityRoutes from './securityRoutes.js';
import canteenRoutes from './canteenRoutes.js';
import auditRoutes from './auditRoutes.js';
import noticeRoutes from './noticeRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import portalRoutes from './portalRoutes.js';
import searchRoutes from './searchRoutes.js';
import communicationRoutes from './communicationRoutes.js';
import lmsRoutes from './lmsRoutes.js';
import liveTrackingRoutes from './liveTrackingRoutes.js';
import certificateRoutes from './certificateRoutes.js';
import aiAnalyticsRoutes from './aiAnalyticsRoutes.js';
import ApiResponse from '../utils/ApiResponse.js';

const router = Router();

// Health Check Endpoint
router.get('/health', (req, res) => {
  return ApiResponse.ok(
    res,
    {
      status: 'UP',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    },
    'School ERP API is healthy and operational'
  );
});

// Domain Routes
router.use('/auth', authRoutes);
router.use('/rbac', rbacRoutes);
router.use('/admin', adminRoutes);
router.use('/students', studentRoutes);
router.use('/parents', parentRoutes);
router.use('/academics', academicsRoutes);
router.use('/finance', financeRoutes);
router.use('/admissions', admissionsRoutes);
router.use('/staff', staffRoutes);
router.use('/library', libraryRoutes);
router.use('/transport', transportRoutes);
router.use('/medical', medicalRoutes);
router.use('/it', itRoutes);
router.use('/facilities', facilityRoutes);
router.use('/security', securityRoutes);
router.use('/canteen', canteenRoutes);
router.use('/audit-logs', auditRoutes);
router.use('/notices', noticeRoutes);
router.use('/notifications', notificationRoutes);
router.use('/portal', portalRoutes);
router.use('/search', searchRoutes);
router.use('/communication', communicationRoutes);
router.use('/lms', lmsRoutes);
router.use('/live-tracking', liveTrackingRoutes);
router.use('/certificates', certificateRoutes);
router.use('/ai-analytics', aiAnalyticsRoutes);

export default router;
