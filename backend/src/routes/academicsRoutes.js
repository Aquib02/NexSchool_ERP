import { Router } from 'express';
import * as academicsController from '../controllers/academicsController.js';
import { authenticate, checkPermission } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

// Timetable
router.get('/timetable', academicsController.getTimetable);
router.post('/timetable', checkPermission('academics:view'), academicsController.saveTimetableDay);
router.get('/teachers', checkPermission('academics:view'), academicsController.getTeachers);
router.post('/timetable/extract-pdf', checkPermission('academics:view'), academicsController.extractTimetableFromPdf);

// Attendance
router.get('/attendance/register', checkPermission('attendance:view'), academicsController.getClassAttendanceRegister);
router.post('/attendance/save', checkPermission('attendance:create'), academicsController.saveClassAttendance);

// Homework
router.get('/homework', checkPermission('homework:view'), academicsController.getHomeworkList);
router.post('/homework', checkPermission('homework:create'), academicsController.createHomework);
router.put('/homework/:id', checkPermission('homework:update'), academicsController.updateHomework);
router.delete('/homework/:id', checkPermission('homework:delete'), academicsController.deleteHomework);
router.post('/homework/:id/submit', academicsController.submitHomework);
router.put('/homework/:id/grade/:submissionStudentId', checkPermission('homework:update'), academicsController.gradeHomeworkSubmission);

// Exams & Marks
router.get('/exams', checkPermission('exams:view'), academicsController.getExams);
router.post('/exams', checkPermission('exams:create'), academicsController.createExam);
router.get('/marks', checkPermission('exams:view'), academicsController.getExamMarks);
router.post('/marks/save', checkPermission('exams:create'), academicsController.saveExamMarks);

// Report Cards & Consolidated Class Results
router.get('/consolidated-results', checkPermission('exams:view'), academicsController.getConsolidatedClassResults);
router.post('/report-cards/compile-class', checkPermission('exams:create'), academicsController.compileClassResults);
router.post('/report-cards/generate', checkPermission('exams:create'), academicsController.generateStudentReportCard);
router.get('/report-cards', checkPermission('exams:view'), academicsController.getReportCards);
router.get('/report-cards/student/:studentId', checkPermission('exams:view'), academicsController.getStudentComprehensiveReport);
router.put('/report-cards/:id/remarks', checkPermission('exams:create'), academicsController.updateReportCardRemarks);

export default router;
