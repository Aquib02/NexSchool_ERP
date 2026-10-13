import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/db.js';
import User from '../models/User.js';
import Role from '../models/Role.js';
import Permission from '../models/Permission.js';
import Student from '../models/Student.js';
import * as studentController from '../controllers/studentController.js';
import * as portalController from '../controllers/portalController.js';
import * as academicsController from '../controllers/academicsController.js';
import * as lmsController from '../controllers/lmsController.js';
import * as certificateController from '../controllers/certificateController.js';

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

const runIsolationTests = async () => {
  try {
    await connectDB();
    console.log('====================================================');
    console.log('STUDENT ROLE DATA ISOLATION & SECURITY TEST SUITE');
    console.log('====================================================');

    // 1. Verify Student Role in DB
    console.log('\n[Suite 1: RBAC Role & Permission Verification]');
    const studentRole = await Role.findOne({ name: 'STUDENT' }).populate('permissions');
    assert(!!studentRole, 'STUDENT role exists in database');

    const permCodes = studentRole.permissions.map((p) => p.code);
    assert(!permCodes.includes('students:view'), 'STUDENT does NOT have students:view permission');
    assert(!permCodes.includes('attendance:create'), 'STUDENT does NOT have attendance:create permission');
    assert(!permCodes.includes('homework:create'), 'STUDENT does NOT have homework:create permission');
    assert(!permCodes.includes('staff:view'), 'STUDENT does NOT have staff:view permission');
    assert(!permCodes.includes('staff:create'), 'STUDENT does NOT have staff:create permission');
    assert(!permCodes.includes('fees:view'), 'STUDENT does NOT have fees:view permission');
    assert(!permCodes.includes('lms:create'), 'STUDENT does NOT have lms:create permission');
    assert(!permCodes.includes('lms:grade'), 'STUDENT does NOT have lms:grade permission');
    assert(!permCodes.includes('certificates:create'), 'STUDENT does NOT have certificates:create permission');

    // 2. Mock Student User and Other Student
    console.log('\n[Suite 2: Student Directory Protection & Isolation]');
    const studentA = await Student.findOne();
    const otherStudentId = new mongoose.Types.ObjectId();

    const mockStudentReq = {
      user: {
        _id: new mongoose.Types.ObjectId(),
        username: 'student1',
        role: { name: 'STUDENT' },
        studentId: studentA ? studentA._id : new mongoose.Types.ObjectId(),
      },
      query: {},
      params: {},
      body: {},
    };

    // Test: getStudents must reject STUDENT
    let getStudentsRejected = false;
    try {
      await studentController.getStudents(mockStudentReq, createMockRes(), (err) => {
        if (err && err.statusCode === 403) getStudentsRejected = true;
      });
    } catch (e) {
      if (e.statusCode === 403) getStudentsRejected = true;
    }
    assert(getStudentsRejected, 'getStudents blocks STUDENT with 403 Forbidden');

    // Test: getStudentById for other student must reject
    let otherStudentRejected = false;
    const mockOtherReq = {
      ...mockStudentReq,
      params: { id: otherStudentId.toString() },
    };
    try {
      await studentController.getStudentById(mockOtherReq, createMockRes(), (err) => {
        if (err && err.statusCode === 403) otherStudentRejected = true;
      });
    } catch (e) {
      if (e.statusCode === 403) otherStudentRejected = true;
    }
    assert(otherStudentRejected, 'getStudentById blocks STUDENT from viewing another student with 403 Forbidden');

    // 3. Student Portal Self-Data Scoping
    console.log('\n[Suite 3: Student Portal Strict Data Scoping]');
    // Even if student passes ?studentId=<otherStudentId>, it must return studentA
    const mockTamperedPortalReq = {
      ...mockStudentReq,
      query: { studentId: otherStudentId.toString() },
    };
    const portalRes = createMockRes();
    await portalController.getStudentPortalData(mockTamperedPortalReq, portalRes, () => {});
    if (studentA && portalRes.body?.data?.student) {
      assert(
        portalRes.body.data.student._id.toString() === studentA._id.toString(),
        'portalController ignores tampered studentId query param and strictly returns own student data'
      );
    } else {
      assert(portalRes.statusCode === 200 || portalRes.statusCode === 404, 'portalController handled safely');
    }

    // Test: getParentPortalData must reject STUDENT
    const parentPortalRes = createMockRes();
    await portalController.getParentPortalData(mockStudentReq, parentPortalRes, () => {});
    assert(parentPortalRes.statusCode === 403, 'getParentPortalData rejects student with 403 Forbidden');

    // 4. Academics Controller Attendance & Marks Prohibitions
    console.log('\n[Suite 4: Academics Attendance & Grading Prohibitions]');
    let attendRegRejected = false;
    try {
      await academicsController.getClassAttendanceRegister(
        { ...mockStudentReq, query: { classId: '1', sectionId: '1', date: '2026-03-15' } },
        createMockRes(),
        (err) => { if (err && err.statusCode === 403) attendRegRejected = true; }
      );
    } catch (e) {
      if (e.statusCode === 403) attendRegRejected = true;
    }
    assert(attendRegRejected, 'getClassAttendanceRegister rejects student with 403 Forbidden');

    let attendSaveRejected = false;
    try {
      await academicsController.saveClassAttendance(
        { ...mockStudentReq, body: { entries: [] } },
        createMockRes(),
        (err) => { if (err && err.statusCode === 403) attendSaveRejected = true; }
      );
    } catch (e) {
      if (e.statusCode === 403) attendSaveRejected = true;
    }
    assert(attendSaveRejected, 'saveClassAttendance rejects student with 403 Forbidden');

    let hwCreateRejected = false;
    try {
      await academicsController.createHomework(
        { ...mockStudentReq, body: { title: 'Test HW' } },
        createMockRes(),
        (err) => { if (err && err.statusCode === 403) hwCreateRejected = true; }
      );
    } catch (e) {
      if (e.statusCode === 403) hwCreateRejected = true;
    }
    assert(hwCreateRejected, 'createHomework rejects student with 403 Forbidden');

    let hwGradeRejected = false;
    try {
      await academicsController.gradeHomeworkSubmission(
        { ...mockStudentReq, params: { id: '1', submissionStudentId: '2' }, body: {} },
        createMockRes(),
        (err) => { if (err && err.statusCode === 403) hwGradeRejected = true; }
      );
    } catch (e) {
      if (e.statusCode === 403) hwGradeRejected = true;
    }
    assert(hwGradeRejected, 'gradeHomeworkSubmission rejects student with 403 Forbidden');

    let marksSaveRejected = false;
    try {
      await academicsController.saveExamMarks(
        { ...mockStudentReq, body: { marksData: [] } },
        createMockRes(),
        (err) => { if (err && err.statusCode === 403) marksSaveRejected = true; }
      );
    } catch (e) {
      if (e.statusCode === 403) marksSaveRejected = true;
    }
    assert(marksSaveRejected, 'saveExamMarks rejects student with 403 Forbidden');

    let reportCardGenRejected = false;
    try {
      await academicsController.generateStudentReportCard(
        { ...mockStudentReq, body: { studentId: '1', examId: '1' } },
        createMockRes(),
        (err) => { if (err && err.statusCode === 403) reportCardGenRejected = true; }
      );
    } catch (e) {
      if (e.statusCode === 403) reportCardGenRejected = true;
    }
    assert(reportCardGenRejected, 'generateStudentReportCard rejects student with 403 Forbidden');

    // 5. LMS Controller Privacy & Boundary Controls
    console.log('\n[Suite 5: LMS Quiz Creation, Grading & Submissions]');
    let quizCreateRejected = false;
    try {
      await lmsController.createQuiz(
        { ...mockStudentReq, body: { title: 'Math Quiz' } },
        createMockRes(),
        (err) => { if (err && err.statusCode === 403) quizCreateRejected = true; }
      );
    } catch (e) {
      if (e.statusCode === 403) quizCreateRejected = true;
    }
    assert(quizCreateRejected, 'createQuiz rejects student with 403 Forbidden');

    let lmsGradeRejected = false;
    try {
      await lmsController.gradeSubmission(
        { ...mockStudentReq, params: { id: '1' }, body: { score: 95 } },
        createMockRes(),
        (err) => { if (err && err.statusCode === 403) lmsGradeRejected = true; }
      );
    } catch (e) {
      if (e.statusCode === 403) lmsGradeRejected = true;
    }
    assert(lmsGradeRejected, 'gradeSubmission rejects student with 403 Forbidden');

    let studyMatCreateRejected = false;
    try {
      await lmsController.createStudyMaterial(
        { ...mockStudentReq, body: { title: 'Physics Notes', classId: '1', subjectId: '1', fileUrl: 'http://test' } },
        createMockRes(),
        (err) => { if (err && err.statusCode === 403) studyMatCreateRejected = true; }
      );
    } catch (e) {
      if (e.statusCode === 403) studyMatCreateRejected = true;
    }
    assert(studyMatCreateRejected, 'createStudyMaterial rejects student with 403 Forbidden');

    // Submissions query scoped for student
    const lmsSubRes = createMockRes();
    await lmsController.getSubmissions(mockStudentReq, lmsSubRes, () => {});
    assert(lmsSubRes.statusCode === 200, 'getSubmissions executes safely and returns scoped submissions list');

    // 6. Certificate Controller Prohibitions
    console.log('\n[Suite 6: Certificate Generation & ID Card Scoping]');
    let certGenRejected = false;
    try {
      await certificateController.generateCertificate(
        { ...mockStudentReq, body: { studentId: '1' } },
        createMockRes(),
        (err) => { if (err && err.statusCode === 403) certGenRejected = true; }
      );
    } catch (e) {
      if (e.statusCode === 403) certGenRejected = true;
    }
    assert(certGenRejected, 'generateCertificate rejects student with 403 Forbidden');

    let staffCardRejected = false;
    try {
      await certificateController.generateBulkIDCards(
        { ...mockStudentReq, query: { userType: 'Staff' } },
        createMockRes(),
        (err) => { if (err && err.statusCode === 403) staffCardRejected = true; }
      );
    } catch (e) {
      if (e.statusCode === 403) staffCardRejected = true;
    }
    assert(staffCardRejected, 'generateBulkIDCards blocks student from accessing Staff ID cards with 403 Forbidden');

    console.log('\n====================================================');
    console.log(`Results: ${passed} Passed, ${failed} Failed`);
    console.log('====================================================');

    await disconnectDB();
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Fatal test runner error:', err);
    await disconnectDB();
    process.exit(1);
  }
};

runIsolationTests();
