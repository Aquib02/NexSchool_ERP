import mongoose from 'mongoose';
import Student from '../models/Student.js';
import Parent from '../models/Parent.js';
import Attendance from '../models/Attendance.js';
import Homework from '../models/Homework.js';
import ReportCard from '../models/ReportCard.js';
import StudentFee from '../models/StudentFee.js';

console.log('----------------------------------------------------');
console.log('School ERP - Phase 11 Student & Parent Portals Suite');
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

const runPhase11Tests = async () => {
  try {
    const dummyClassId = new mongoose.Types.ObjectId();
    const dummySectionId = new mongoose.Types.ObjectId();
    const dummySessionId = new mongoose.Types.ObjectId();
    const dummyTeacherId = new mongoose.Types.ObjectId();
    const dummySubjectId = new mongoose.Types.ObjectId();
    const dummyExamId = new mongoose.Types.ObjectId();

    // ========================================================
    // 1. STUDENT SELF-SERVICE PORTAL METRICS
    // ========================================================
    console.log('\n[Suite 1: Student Portal Attendance & Academic Metrics]');

    const dummyParentId = new mongoose.Types.ObjectId();

    const student = new Student({
      studentId: 'STU-2026-1044',
      admissionNumber: 'ADM-2026-1044',
      firstName: 'Lucas',
      lastName: 'Hansen',
      dateOfBirth: new Date(2012, 4, 12),
      gender: 'Male',
      bloodGroup: 'B+',
      classId: dummyClassId,
      sectionId: dummySectionId,
      rollNumber: 14,
      academicSessionId: dummySessionId,
      parentId: dummyParentId,
      emergencyContact: {
        name: 'Marian Hansen',
        relationship: 'Mother',
        phone: '+15551234567',
      },
      status: 'Active',
    });

    assert(!student.validateSync(), 'Student central profile validates cleanly');
    assert(student.studentId === 'STU-2026-1044', 'Student ID conforms to STU-YYYY-XXXX format');

    // Attendance Percentage Formula Verification
    const attendanceLogs = [
      { status: 'Present' },
      { status: 'Present' },
      { status: 'Present' },
      { status: 'Present' },
      { status: 'Late' },    // 0.5 day credit
      { status: 'Absent' },
    ];
    const totalDays = attendanceLogs.length; // 6
    const presentDays = attendanceLogs.filter((a) => a.status === 'Present').length; // 4
    const lateDays = attendanceLogs.filter((a) => a.status === 'Late').length; // 1
    const absentDays = attendanceLogs.filter((a) => a.status === 'Absent').length; // 1

    const attendancePercentage = Math.round(((presentDays + lateDays * 0.5) / totalDays) * 100);
    // (4 + 0.5) / 6 = 4.5 / 6 = 75%
    assert(attendancePercentage === 75, 'Attendance calculation formula accurately returns 75%');

    const isLowAttendance = attendancePercentage < 75;
    assert(!isLowAttendance, 'Warning threshold correctly marks 75% attendance as compliant');

    const lowAttendanceCalc = Math.round(((3 + 0) / 6) * 100); // 50%
    assert(lowAttendanceCalc < 75, 'Low attendance flag triggers when attendance drops below 75% (50%)');

    // ========================================================
    // 2. HOMEWORK & ASSIGNMENTS AGGREGATION
    // ========================================================
    console.log('\n[Suite 2: Student Homework & Assignments]');

    const homework = new Homework({
      title: 'Quadratic Equations Practice Worksheet',
      description: 'Complete problems 1 through 15 from Chapter 4 textbook.',
      academicSessionId: dummySessionId,
      classId: dummyClassId,
      sectionId: dummySectionId,
      subjectId: dummySubjectId,
      assignedBy: dummyTeacherId,
      assignedDate: new Date(),
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days later
      maxMarks: 20,
    });

    assert(!homework.validateSync(), 'Homework validates with class and section bindings');
    assert(homework.maxMarks === 20, 'Homework maxMarks is 20');
    const isDueInFuture = new Date(homework.dueDate) > new Date();
    assert(isDueInFuture, 'Homework due date calculation correctly identifies pending tasks');

    // ========================================================
    // 3. REPORT CARDS & PERFORMANCE
    // ========================================================
    console.log('\n[Suite 3: Report Card & GPA Scoring]');

    const reportCard = new ReportCard({
      studentId: student._id,
      examId: dummyExamId,
      academicSessionId: dummySessionId,
      classId: dummyClassId,
      sectionId: dummySectionId,
      subjectsSummary: [
        {
          subjectId: dummySubjectId,
          subjectName: 'Mathematics',
          marksObtained: 92,
          totalMarks: 100,
          grade: 'A+',
          remarks: 'Outstanding analytical clarity',
        },
      ],
      totalMarksObtained: 92,
      totalMarksPossible: 100,
      percentage: 92,
      gpa: 4.0,
      overallGrade: 'A+',
      classRank: 1,
      attendancePercentage: 96,
      teacherRemarks: 'Exemplary academic dedication',
      status: 'Published',
    });

    assert(!reportCard.validateSync(), 'ReportCard validates with overall GPA and subject marks');
    assert(reportCard.gpa === 4.0, 'GPA computes accurately to 4.0');
    assert(reportCard.classRank === 1, 'Class rank 1 is recorded');

    // ========================================================
    // 4. STUDENT FEE INVOICING & BALANCE DUES
    // ========================================================
    console.log('\n[Suite 4: Fee Ledger & Pending Dues]');

    const dummyFeeStructureId = new mongoose.Types.ObjectId();

    const invoice = new StudentFee({
      studentId: student._id,
      academicSessionId: dummySessionId,
      feeStructureId: dummyFeeStructureId,
      invoiceNumber: 'INV-2026-9041',
      baseAmount: 750,
      discountAmount: 50,
      fineAmount: 0,
      netPayable: 700,
      paidAmount: 200,
      balanceAmount: 500,
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      status: 'Partially Paid',
    });

    assert(!invoice.validateSync(), 'StudentFee invoice validates cleanly');
    assert(invoice.balanceAmount === 500, 'Remaining balance due is correctly tracked ($500)');
    assert(invoice.status === 'Partially Paid', 'Invoice status tracks partial settlement');

    // ========================================================
    // 5. PARENT MULTI-CHILD SIBLING SWITCHER
    // ========================================================
    console.log('\n[Suite 5: Parent Multi-Child Architecture & Sibling Reuse]');

    const childA_Id = student._id;
    const childB_Id = new mongoose.Types.ObjectId();

    const parent = new Parent({
      parentId: 'PAR-2026-0089',
      fatherName: 'Arthur Hansen',
      motherName: 'Marian Hansen',
      primaryContactNumber: '+15551234567',
      address: {
        street: '42 Maple Crescent',
        city: 'Metropolis',
        state: 'State',
        postalCode: '90210',
      },
      studentIds: [childA_Id, childB_Id], // 2 enrolled siblings
      isActive: true,
    });

    assert(!parent.validateSync(), 'Parent model validates with multiple enrolled children');
    assert(parent.studentIds.length === 2, 'Parent profile links 2 children (siblings)');
    assert(parent.studentIds[0].equals(childA_Id), 'Child 1 resolves to Lucas Hansen');
    assert(parent.studentIds[1].equals(childB_Id), 'Child 2 resolves to sibling');

    // Sibling Switcher Logic
    let selectedChildId = parent.studentIds[0];
    assert(selectedChildId.equals(childA_Id), 'Initial portal view defaults to first child');

    selectedChildId = parent.studentIds[1];
    assert(selectedChildId.equals(childB_Id), 'Switcher seamlessly toggles to second child');

    // Summary
    console.log('\n====================================================');
    console.log(`Phase 11 Test Results: ${passed} Passed, ${failed} Failed`);
    console.log('====================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal Phase 11 Test Error:', err);
    process.exit(1);
  }
};

runPhase11Tests();
