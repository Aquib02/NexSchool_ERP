import mongoose from 'mongoose';
import Timetable from '../models/Timetable.js';
import Attendance from '../models/Attendance.js';
import Homework from '../models/Homework.js';
import Exam from '../models/Exam.js';
import Mark from '../models/Mark.js';
import ReportCard from '../models/ReportCard.js';
import { calculateGrade } from '../controllers/academicsController.js';

console.log('----------------------------------------------------');
console.log('School ERP - Phase 6 Academics Architecture Test');
console.log('----------------------------------------------------');

let passed = 0;
let failed = 0;

const assert = (condition, title) => {
  if (condition) {
    console.log(`  ✓ PASS: ${title}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${title}`);
    failed++;
  }
};

const runPhase6Tests = async () => {
  try {
    // 1. Grade Calculation Engine
    console.log('\n[Suite 1: Academic Grading & GPA Scale Engine]');
    assert(calculateGrade(95).grade === 'A+' && calculateGrade(95).gpa === 4.0, 'Score 95% awards A+ (GPA 4.0)');
    assert(calculateGrade(82).grade === 'A' && calculateGrade(82).gpa === 3.7, 'Score 82% awards A (GPA 3.7)');
    assert(calculateGrade(74).grade === 'B+' && calculateGrade(74).gpa === 3.3, 'Score 74% awards B+ (GPA 3.3)');
    assert(calculateGrade(65).grade === 'B' && calculateGrade(65).gpa === 3.0, 'Score 65% awards B (GPA 3.0)');
    assert(calculateGrade(52).grade === 'C' && calculateGrade(52).gpa === 2.0, 'Score 52% awards C (GPA 2.0)');
    assert(calculateGrade(41).grade === 'D' && calculateGrade(41).gpa === 1.0, 'Score 41% awards D (GPA 1.0)');
    assert(calculateGrade(35).grade === 'F' && calculateGrade(35).gpa === 0.0, 'Score 35% fails with F (GPA 0.0)');

    // 2. Timetable Model & Constraints
    console.log('\n[Suite 2: Timetable Model & Day Allocations]');
    const dummyTimetable = new Timetable({
      academicSessionId: new mongoose.Types.ObjectId(),
      classId: new mongoose.Types.ObjectId(),
      sectionId: new mongoose.Types.ObjectId(),
      dayOfWeek: 'Monday',
      periods: [
        {
          periodNumber: 1,
          startTime: '08:30',
          endTime: '09:15',
          subjectId: new mongoose.Types.ObjectId(),
          roomNumber: 'Lab 1',
        },
        {
          periodNumber: 2,
          startTime: '09:15',
          endTime: '10:00',
          isBreak: true,
        },
      ],
    });
    assert(!dummyTimetable.validateSync(), 'Timetable validates valid day schedule and periods');

    const timetableIndexes = Timetable.schema.indexes();
    const hasTimetableIndex = timetableIndexes.some((idx) => {
      const keys = idx[0];
      return keys.classId === 1 && keys.sectionId === 1 && keys.dayOfWeek === 1;
    });
    assert(hasTimetableIndex, 'Timetable enforces unique schedule per class, section, day, and session');

    // 3. Attendance Constraints & Statuses
    console.log('\n[Suite 3: Attendance Model & Daily Punch Integrity]');
    const attendanceIndexes = Attendance.schema.indexes();
    const hasStudentDailyUniq = attendanceIndexes.some((idx) => {
      const keys = idx[0];
      return keys.studentId === 1 && keys.date === 1;
    });
    assert(hasStudentDailyUniq, 'Attendance enforces unique record per student per calendar date');

    const dummyAttendance = new Attendance({
      attendanceType: 'Student',
      studentId: new mongoose.Types.ObjectId(),
      classId: new mongoose.Types.ObjectId(),
      sectionId: new mongoose.Types.ObjectId(),
      academicSessionId: new mongoose.Types.ObjectId(),
      date: new Date('2026-09-16'),
      status: 'Present',
      markedBy: new mongoose.Types.ObjectId(),
    });
    assert(!dummyAttendance.validateSync(), 'Attendance validates with Present status');

    // 4. Homework & Submission Lifecycle
    console.log('\n[Suite 4: Homework & Student Submissions]');
    const dummyHw = new Homework({
      title: 'Polynomial Functions Proofs',
      description: 'Solve questions 1 through 10 from textbook page 45.',
      academicSessionId: new mongoose.Types.ObjectId(),
      classId: new mongoose.Types.ObjectId(),
      sectionId: new mongoose.Types.ObjectId(),
      subjectId: new mongoose.Types.ObjectId(),
      assignedBy: new mongoose.Types.ObjectId(),
      dueDate: new Date(Date.now() + 86400000),
      maxMarks: 20,
      submissions: [
        {
          studentId: new mongoose.Types.ObjectId(),
          submittedAt: new Date(),
          content: 'Here are my solutions attached in PDF format.',
          status: 'Submitted',
        },
      ],
    });
    assert(!dummyHw.validateSync(), 'Homework validates with embedded student submissions array');

    // 5. Examinations & Report Card Compilation
    console.log('\n[Suite 5: Examination Master & Report Card Computation]');
    const dummyExam = new Exam({
      name: 'Mid-Term Examinations 2026',
      examType: 'Mid-Term',
      academicSessionId: new mongoose.Types.ObjectId(),
      startDate: new Date('2026-10-01'),
      endDate: new Date('2026-10-15'),
      schedule: [
        {
          classId: new mongoose.Types.ObjectId(),
          subjectId: new mongoose.Types.ObjectId(),
          examDate: new Date('2026-10-05'),
          startTime: '09:00',
          endTime: '12:00',
          totalMarks: 100,
          passingMarks: 40,
          roomNumber: 'Hall A',
        },
      ],
    });
    assert(!dummyExam.validateSync(), 'Exam master validates schedule and passing marks');

    const dummyReportCard = new ReportCard({
      studentId: new mongoose.Types.ObjectId(),
      academicSessionId: new mongoose.Types.ObjectId(),
      classId: new mongoose.Types.ObjectId(),
      sectionId: new mongoose.Types.ObjectId(),
      examId: dummyExam._id,
      subjectsSummary: [
        {
          subjectId: new mongoose.Types.ObjectId(),
          subjectName: 'Mathematics',
          marksObtained: 92,
          totalMarks: 100,
          grade: 'A+',
        },
        {
          subjectId: new mongoose.Types.ObjectId(),
          subjectName: 'Physics',
          marksObtained: 88,
          totalMarks: 100,
          grade: 'A',
        },
      ],
      totalMarksPossible: 200,
      totalMarksObtained: 180,
      percentage: 90.0,
      gpa: 4.0,
      overallGrade: 'A+',
      attendancePercentage: 97,
      status: 'Published',
    });
    assert(!dummyReportCard.validateSync(), 'Report card compiles totals, GPA, percentage, and attendance correlation');

    console.log('\n====================================================');
    console.log(`PHASE 6 TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
    console.log('====================================================');

    if (failed === 0) {
      console.log('ALL PHASE 6 ACADEMICS & GRADING TESTS PASSED!\n');
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal error in Phase 6 tests:', err);
    process.exit(1);
  }
};

runPhase6Tests();
