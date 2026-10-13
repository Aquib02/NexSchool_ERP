import { Router } from 'express';
import * as lmsController from '../controllers/lmsController.js';
import { authenticate, checkPermission } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

// Homework & Submissions
router.get('/submissions', checkPermission('lms:view'), lmsController.getSubmissions);
router.post('/submissions', checkPermission('lms:view'), lmsController.submitAssignment);
router.put('/submissions/:id/grade', checkPermission('lms:grade'), lmsController.gradeSubmission);

// CBT Quizzes
router.get('/quizzes', checkPermission('lms:view'), lmsController.getQuizzes);
router.get('/quizzes/:id', checkPermission('lms:view'), lmsController.getQuizById);
router.post('/quizzes', checkPermission('lms:create'), lmsController.createQuiz);
router.post('/quizzes/attempt', checkPermission('lms:view'), lmsController.attemptQuiz);
router.get('/quizzes/:quizId/leaderboard', checkPermission('lms:view'), lmsController.getQuizLeaderboard);

// Study Materials
router.get('/materials', checkPermission('lms:view'), lmsController.getStudyMaterials);
router.post('/materials', checkPermission('lms:create'), lmsController.createStudyMaterial);
router.delete('/materials/:id', checkPermission('lms:manage'), lmsController.deleteStudyMaterial);

export default router;
