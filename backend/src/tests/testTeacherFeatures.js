import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/db.js';
import '../models/index.js'; // Registers all 60 models

import User from '../models/User.js';
import Role from '../models/Role.js';
import SchoolClass from '../models/SchoolClass.js';
import Section from '../models/Section.js';
import Subject from '../models/Subject.js';
import Student from '../models/Student.js';
import Exam from '../models/Exam.js';
import AssignmentSubmission from '../models/AssignmentSubmission.js';

import * as academicsController from '../controllers/academicsController.js';
import * as lmsController from '../controllers/lmsController.js';
import * as commController from '../controllers/communicationController.js';
import * as certController from '../controllers/certificateController.js';

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

const createMockRes = () => {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
  };
  return res;
};

const callHandler = (handler, req, res) => {
  return new Promise((resolve, reject) => {
    const next = (err) => {
      if (err) reject(err);
      else resolve(res);
    };
    const origJson = res.json.bind(res);
    res.json = (data) => {
      origJson(data);
      resolve(res);
      return res;
    };
    Promise.resolve(handler(req, res, next)).catch(reject);
  });
};

const runTests = async () => {
  console.log('===============================================================');
  console.log('  TEACHER PORTAL & ROLE CAPABILITIES VERIFICATION TEST SUITE');
  console.log('===============================================================\n');

  await connectDB();

  // 1. Fetch Teacher User & Role
  const teacherUser = await User.findOne({ username: 'teacher' }).populate({
    path: 'role',
    populate: { path: 'permissions' },
  });
  if (!teacherUser) {
    console.error('Teacher user not found');
    process.exit(1);
  }

  const teacherRole = teacherUser.role;
  const teacherPermNames = new Set(teacherRole.permissions.map((p) => p.code));

  console.log(`[Identity] User: ${teacherUser.username} | Role: ${teacherRole.name}`);
  console.log(`[Identity] Active Permissions: ${teacherPermNames.size}\n`);

  // Shared metadata
  const schoolClass = await SchoolClass.findOne({ code: 'G10' });
  const sectionA = await Section.findOne({ classId: schoolClass._id, name: 'A' });
  const mathSubject = await Subject.findOne({ code: 'MTH-101' });
  const students = await Student.find({ classId: schoolClass._id, sectionId: sectionA._id });

  // =========================================================================
  // SECTION A: WHAT TEACHERS CAN DO (Core Academic, LMS & Communication)
  // =========================================================================
  console.log('--- SECTION A: WHAT TEACHERS CAN DO ---');

  // Test 1: View Timetable
  try {
    const req = {
      user: teacherUser,
      query: { classId: schoolClass._id.toString(), sectionId: sectionA._id.toString(), dayOfWeek: 'Monday' },
    };
    const res = createMockRes();
    await callHandler(academicsController.getTimetable, req, res);
    assert(res.statusCode === 200 && res.body?.data?.length > 0, 'Can fetch Monday timetable for Grade 10-A');
    const periods = res.body?.data[0]?.periods || [];
    assert(periods.some((p) => p.subjectId?.name === 'Mathematics'), 'Timetable displays assigned Mathematics period');
  } catch (err) {
    assert(false, `Timetable retrieval failed: ${err.message}`);
  }

  // Test 2: View Class Attendance Register
  try {
    const today = new Date().toISOString().split('T')[0];
    const req = {
      user: teacherUser,
      query: { classId: schoolClass._id.toString(), sectionId: sectionA._id.toString(), date: today },
    };
    const res = createMockRes();
    await callHandler(academicsController.getClassAttendanceRegister, req, res);
    assert(res.statusCode === 200 && res.body?.data?.roster?.length >= 3, 'Can load full student roster for daily attendance');
  } catch (err) {
    assert(false, `Attendance register failed: ${err.message}`);
  }

  // Test 3: Record / Save Class Attendance
  try {
    const today = new Date().toISOString().split('T')[0];
    const req = {
      user: teacherUser,
      body: {
        classId: schoolClass._id.toString(),
        sectionId: sectionA._id.toString(),
        date: today,
        entries: students.map((s, idx) => ({
          studentId: s._id.toString(),
          status: idx === 2 ? 'Absent' : 'Present',
          remarks: idx === 2 ? 'Absent with parent note' : 'Present',
        })),
      },
    };
    const res = createMockRes();
    await callHandler(academicsController.saveClassAttendance, req, res);
    assert(res.statusCode === 200, 'Can save and update daily student attendance register');
  } catch (err) {
    assert(false, `Save attendance failed: ${err.message}`);
  }

  // Test 4: View Homework assignments
  try {
    const req = {
      user: teacherUser,
      query: { classId: schoolClass._id.toString(), sectionId: sectionA._id.toString() },
    };
    const res = createMockRes();
    await callHandler(academicsController.getHomeworkList, req, res);
    assert(res.statusCode === 200 && res.body?.data?.length > 0, 'Can view class homework assignments');
  } catch (err) {
    assert(false, `Homework list failed: ${err.message}`);
  }

  // Test 5: Create / Publish new Homework assignment
  try {
    const req = {
      user: teacherUser,
      body: {
        title: 'Trigonometric Heights & Distances Problem Sheet',
        description: 'Complete questions 1 to 10 on angles of elevation and depression.',
        classId: schoolClass._id.toString(),
        sectionId: sectionA._id.toString(),
        subjectId: mathSubject._id.toString(),
        dueDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
        maxMarks: 50,
      },
    };
    const res = createMockRes();
    await callHandler(academicsController.createHomework, req, res);
    assert(res.statusCode === 201 && res.body?.data?.title.includes('Trigonometric'), 'Can create and publish new homework assignment');
  } catch (err) {
    assert(false, `Create homework failed: ${err.message}`);
  }

  // Test 6: View Scheduled Exams
  try {
    const req = { user: teacherUser, query: {} };
    const res = createMockRes();
    await callHandler(academicsController.getExams, req, res);
    assert(res.statusCode === 200 && res.body?.data?.length > 0, 'Can view list of scheduled examinations');
  } catch (err) {
    assert(false, `View exams failed: ${err.message}`);
  }

  // Test 7: View Exam Marksheet & Save Exam Marks
  try {
    const exam = await Exam.findOne({ name: 'Mid-Term Academic Examination 2026' });
    const reqGet = {
      user: teacherUser,
      query: {
        examId: exam._id.toString(),
        classId: schoolClass._id.toString(),
        sectionId: sectionA._id.toString(),
        subjectId: mathSubject._id.toString(),
      },
    };
    const resGet = createMockRes();
    await callHandler(academicsController.getExamMarks, reqGet, resGet);
    assert(resGet.statusCode === 200 && resGet.body?.data?.length >= 3, 'Can retrieve exam marksheet for all class students');

    // Save marks for Mohammad Khan
    const reqSave = {
      user: teacherUser,
      body: {
        examId: exam._id.toString(),
        classId: schoolClass._id.toString(),
        sectionId: sectionA._id.toString(),
        subjectId: mathSubject._id.toString(),
        marksData: [
          { studentId: students[2]._id.toString(), marksObtained: 85, totalMarks: 100 },
        ],
      },
    };
    const resSave = createMockRes();
    await callHandler(academicsController.saveExamMarks, reqSave, resSave);
    assert(resSave.statusCode === 200, 'Can record and update student exam marks in marksheet');
  } catch (err) {
    assert(false, `Exam marks failed: ${err.message}`);
  }

  // Test 8: LMS Digital Submissions & Grading
  try {
    const reqSub = { user: teacherUser, query: {} };
    const resSub = createMockRes();
    await callHandler(lmsController.getSubmissions, reqSub, resSub);
    assert(resSub.statusCode === 200 && resSub.body?.data?.length > 0, 'Can view all student homework submissions across class');

    const pendingSub = await AssignmentSubmission.findOne({ status: 'Submitted' }) || await AssignmentSubmission.findOne();
    assert(!!pendingSub, 'Found student submission awaiting grading');

    if (pendingSub) {
      const reqGrade = {
        user: teacherUser,
        params: { id: pendingSub._id.toString() },
        body: { score: 94, maxScore: 100, teacherFeedback: 'Excellent free-body diagram clarity and accurate equations.' },
      };
      const resGrade = createMockRes();
      await callHandler(lmsController.gradeSubmission, reqGrade, resGrade);
      assert(resGrade.statusCode === 200 && resGrade.body?.data?.status === 'Graded', 'Can evaluate submission, assign score (94/100) and post feedback');
      assert(resGrade.body?.data?.grade === 'A+', 'Grade letter "A+" automatically computed accurately');
    }
  } catch (err) {
    assert(false, `LMS submissions failed: ${err.message}`);
  }

  // Test 9: LMS CBT Quizzes & Assessments
  try {
    const reqQ = { user: teacherUser, query: {} };
    const resQ = createMockRes();
    await callHandler(lmsController.getQuizzes, reqQ, resQ);
    assert(resQ.statusCode === 200 && resQ.body?.data?.length > 0, 'Can view LMS CBT quizzes');

    const reqCreateQ = {
      user: teacherUser,
      body: {
        title: 'Coordinate Geometry Quick Quiz',
        description: 'Slope, distance, and midpoint formulas test.',
        classId: schoolClass._id.toString(),
        subjectId: mathSubject._id.toString(),
        durationMinutes: 15,
        totalMarks: 5,
        passMarks: 2,
        questions: [
          {
            questionText: 'What is the distance between (0, 0) and (3, 4)?',
            options: ['3', '4', '5', '7'],
            correctOptionIndex: 2,
            marks: 5,
            explanation: 'sqrt(3^2 + 4^2) = sqrt(25) = 5.',
          },
        ],
      },
    };
    const resCreateQ = createMockRes();
    await callHandler(lmsController.createQuiz, reqCreateQ, resCreateQ);
    assert(resCreateQ.statusCode === 201, 'Can create and configure CBT quiz with questions & pass criteria');
  } catch (err) {
    assert(false, `CBT Quiz failed: ${err.message}`);
  }

  // Test 10: Study Material Vault
  try {
    const reqMat = { user: teacherUser, query: {} };
    const resMat = createMockRes();
    await callHandler(lmsController.getStudyMaterials, reqMat, resMat);
    assert(resMat.statusCode === 200 && resMat.body?.data?.length > 0, 'Can view published study resources in Vault');

    const reqUpload = {
      user: teacherUser,
      body: {
        title: 'Coordinate Geometry Reference Guide',
        description: 'Formulas and solved examples for slopes and lines.',
        classId: schoolClass._id.toString(),
        subjectId: mathSubject._id.toString(),
        resourceType: 'PDF',
        fileUrl: 'https://cdn.example.com/materials/coordinate_geometry.pdf',
        fileName: 'coordinate_geometry.pdf',
      },
    };
    const resUpload = createMockRes();
    await callHandler(lmsController.createStudyMaterial, reqUpload, resUpload);
    assert(resUpload.statusCode === 201, 'Can upload and share syllabus study materials for students');
  } catch (err) {
    assert(false, `Study material failed: ${err.message}`);
  }

  // Test 11: Parent-Teacher Meeting (PTM) Sessions
  try {
    const reqPtm = { user: teacherUser, query: {} };
    const resPtm = createMockRes();
    await callHandler(commController.getPTMSlots, reqPtm, resPtm);
    assert(resPtm.statusCode === 200 && resPtm.body?.data?.length > 0, 'Can view PTM sessions and booked parent meetings');

    const reqCreatePtm = {
      user: teacherUser,
      body: {
        title: 'Mid-Term Pre-Exam Student Counseling Slot',
        date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        startTime: '10:00 AM',
        endTime: '01:00 PM',
        slotDurationMinutes: 15,
        meetingMode: 'In-Person',
      },
    };
    const resCreatePtm = createMockRes();
    await callHandler(commController.createPTMSlot, reqCreatePtm, resCreatePtm);
    assert(resCreatePtm.statusCode === 201, 'Can schedule conference slots for parent consultations');
  } catch (err) {
    assert(false, `PTM sessions failed: ${err.message}`);
  }

  // Test 12: Certificates & Hall Tickets
  try {
    const reqCert = { user: teacherUser, query: {} };
    const resCert = createMockRes();
    await callHandler(certController.getCertificates, reqCert, resCert);
    assert(resCert.statusCode === 200, 'Can view issued certificates registry');

    const reqTickets = {
      user: teacherUser,
      query: { classId: schoolClass._id.toString(), examName: 'Mid-Term Academic Examination 2026' },
    };
    const resTickets = createMockRes();
    await callHandler(certController.generateExamHallTickets, reqTickets, resTickets);
    assert(resTickets.statusCode === 200 && resTickets.body?.data?.length >= 3, 'Can generate exam hall tickets for all students in class');
  } catch (err) {
    assert(false, `Certificates failed: ${err.message}`);
  }

  // =========================================================================
  // SECTION B: WHAT TEACHERS CANNOT DO (Strict Security & Administrative Barriers)
  // =========================================================================
  console.log('\n--- SECTION B: WHAT TEACHERS CANNOT DO (Security Barriers) ---');

  // Boundary 1: Cannot modify/save master timetable schedules (academics:update)
  assert(!teacherPermNames.has('academics:update'), 'Security: Teacher does NOT have "academics:update" (Timetable editing locked)');

  // Boundary 2: Cannot issue official academic certificates (certificates:create)
  assert(!teacherPermNames.has('certificates:create'), 'Security: Teacher does NOT have "certificates:create" (Official certification reserved for Principal/Admin)');

  // Boundary 3: Cannot delete study materials (lms:manage)
  assert(!teacherPermNames.has('lms:manage'), 'Security: Teacher does NOT have "lms:manage" (Resource deletion reserved for Academic Coordinator)');

  // Boundary 4: Cannot broadcast campus-wide SMS/WhatsApp blasts (communication:broadcast)
  assert(!teacherPermNames.has('communication:broadcast'), 'Security: Teacher does NOT have "communication:broadcast" (Bulk messaging locked)');

  // Boundary 5: Cannot view or collect school fees (fees:view, fees:create)
  assert(!teacherPermNames.has('fees:view') && !teacherPermNames.has('fees:create'), 'Security: Teacher does NOT have fee permissions (Financial accounts locked)');

  // Boundary 6: Cannot view or run staff payroll (payroll:view, payroll:create)
  assert(!teacherPermNames.has('payroll:view') && !teacherPermNames.has('payroll:create'), 'Security: Teacher does NOT have payroll permissions (HR Payroll locked)');

  // Boundary 7: Cannot approve admissions (admissions:approve)
  assert(!teacherPermNames.has('admissions:approve'), 'Security: Teacher does NOT have admission approval permissions (Admissions locked)');

  // Boundary 8: Cannot view system audit logs (audit:view)
  assert(!teacherPermNames.has('audit:view'), 'Security: Teacher does NOT have "audit:view" (Audit Logs locked)');

  // Boundary 9: Cannot configure roles and RBAC (rbac:manage)
  assert(!teacherPermNames.has('rbac:manage'), 'Security: Teacher does NOT have "rbac:manage" (System RBAC security locked)');

  // Boundary 10: Cannot configure institutional school setup (settings:update)
  assert(!teacherPermNames.has('settings:update'), 'Security: Teacher does NOT have "settings:update" (School settings locked)');

  console.log('\n===============================================================');
  console.log(`  RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('===============================================================');

  await disconnectDB();
  process.exit(failed > 0 ? 1 : 0);
};

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
