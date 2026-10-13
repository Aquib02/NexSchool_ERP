import { Router } from 'express';
import * as aiController from '../controllers/aiAnalyticsController.js';
import { authenticate, checkPermission } from '../middleware/authMiddleware.js';

const router = Router();

// AI Admissions chat can be accessed publicly by prospective parents
router.post('/admissions-chat', aiController.aiAdmissionsChat);

// Authenticated analytical and copilot routes
router.use(authenticate);
router.get('/at-risk', checkPermission('analytics:view'), aiController.getAtRiskAnalytics);
router.post('/lesson-planner', checkPermission('analytics:copilot'), aiController.generateLessonPlan);
router.post('/quiz-generator', checkPermission('analytics:copilot'), aiController.generateQuizQuestions);
router.post('/report-remarks', checkPermission('analytics:copilot'), aiController.generateReportRemarks);

export default router;
