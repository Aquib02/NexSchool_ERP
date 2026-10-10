import { Router } from 'express';
import * as academicsController from '../controllers/academicsController.js';
import { authenticate, checkPermission } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

// Timetable
router.get('/timetable', academicsController.getTimetable);
router.post('/timetable', checkPermission('academics:update'), academicsController.saveTimetableDay);

// Attendance
router.get('/attendance/register', checkPermission('attendance:view'), academicsController.getClassAttendanceRegister);
router.post('/attendance/save', checkPermission('attendance:create'), academicsController.saveClassAttendance);

// Homework
router.get('/homework', checkPermission('homework:view'), academicsController.getHomeworkList);
router.post('/homework', checkPermission('homework:create'), academicsController.createHomework);
router.post('/homework/:id/submit', academicsController.submitHomework);
router.put('/homework/:id/grade/:submissionStudentId', checkPermission('homework:update'), academicsController.gradeHomeworkSubmission);

// Exams & Marks
router.get('/exams', checkPermission('exams:view'), academicsController.getExams);
router.post('/exams', checkPermission('exams:create'), academicsController.createExam);
router.get('/marks', checkPermission('exams:view'), academicsController.getExamMarks);
router.post('/marks/save', checkPermission('exams:create'), academicsController.saveExamMarks);

// Report Cards
router.post('/report-cards/generate', checkPermission('exams:approve'), academicsController.generateStudentReportCard);
router.get('/report-cards', checkPermission('exams:view'), academicsController.getReportCards);

export default router;
