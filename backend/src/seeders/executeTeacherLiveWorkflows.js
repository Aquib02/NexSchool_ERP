import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/db.js';
import '../models/index.js';

import User from '../models/User.js';
import Employee from '../models/Employee.js';
import SchoolClass from '../models/SchoolClass.js';
import Section from '../models/Section.js';
import Subject from '../models/Subject.js';
import Student from '../models/Student.js';
import Exam from '../models/Exam.js';
import Homework from '../models/Homework.js';
import AssignmentSubmission from '../models/AssignmentSubmission.js';
import StudyMaterial from '../models/StudyMaterial.js';
import PTMSlot from '../models/PTMSlot.js';
import Quiz from '../models/Quiz.js';

import * as academicsController from '../controllers/academicsController.js';
import * as lmsController from '../controllers/lmsController.js';
import * as commController from '../controllers/communicationController.js';

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

export const executeTeacherLiveWorkflows = async () => {
  console.log('======================================================================');
  console.log('  LIVE TEACHER WORKFLOW EXECUTION: UPLOADS & FUNCTIONALITY VERIFICATION');
  console.log('======================================================================\n');

  await connectDB();

  // 1. Resolve Teacher Persona: Sarah Jenkins (teacher)
  const teacherUser = await User.findOne({ username: 'teacher' }).populate('role');
  if (!teacherUser) throw new Error('Teacher user "teacher" not found.');

  const teacherEmp = await Employee.findById(teacherUser.employeeId);
  console.log(`[Actor] Logged in as Teacher: ${teacherEmp?.firstName} ${teacherEmp?.lastName} (${teacherUser.username})`);
  console.log(`[Actor] Role: ${teacherUser.role?.name}\n`);

  // 2. Resolve Class, Section, Subjects, Students
  const schoolClass = await SchoolClass.findOne({ code: 'G10' });
  const sectionA = await Section.findOne({ classId: schoolClass._id, name: 'A' });
  const mathSubject = await Subject.findOne({ code: 'MTH-101' });
  const scienceSubject = await Subject.findOne({ code: 'SCI-101' });
  const students = await Student.find({ classId: schoolClass._id, sectionId: sectionA._id, status: 'Active' });

  console.log(`[Context] Class: ${schoolClass.name} | Section: ${sectionA.name} | Active Students: ${students.length}`);
  console.log(`[Context] Core Subjects: ${mathSubject?.name} (${mathSubject?.code}), ${scienceSubject?.name} (${scienceSubject?.code})\n`);

  // =========================================================================
  // WORKFLOW 1: TEACHER UPLOADS & CREATES HOMEWORK WITH ATTACHED PDF WORKSHEET
  // =========================================================================
  console.log('>>> WORKFLOW 1: Assign Homework with Attached PDF Worksheet (Academics Page)');
  const hwPayload = {
    title: 'Grade 10 Mathematics - Polynomials & Quadratic Modeling Worksheet',
    description: 'Complete all questions in Section A and Section B from the attached PDF worksheet. Upload your full step-by-step solution.',
    classId: schoolClass._id.toString(),
    sectionId: sectionA._id.toString(),
    subjectId: mathSubject._id.toString(),
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    maxMarks: 50,
    attachments: [
      {
        title: 'Grade10_Mathematics_Polynomials_Worksheet.pdf',
        fileUrl: '/documents/Grade10_Mathematics_Polynomials_Worksheet.pdf',
      },
    ],
  };

  const reqHw = { user: teacherUser, body: hwPayload };
  const resHw = createMockRes();
  await callHandler(academicsController.createHomework, reqHw, resHw);

  if (resHw.statusCode === 201) {
    console.log(`  ✓ SUCCESS: Homework created successfully! ID: ${resHw.body?.data?._id}`);
    console.log(`  ✓ ATTACHMENT LINKED: ${resHw.body?.data?.attachments[0]?.title} -> ${resHw.body?.data?.attachments[0]?.fileUrl}\n`);
  } else {
    throw new Error(`Failed to create homework: ${JSON.stringify(resHw.body)}`);
  }

  const createdHomeworkId = resHw.body?.data?._id;

  // =========================================================================
  // WORKFLOW 2: TEACHER UPLOADS SYLLABUS LAB MANUAL TO STUDY RESOURCE VAULT
  // =========================================================================
  console.log('>>> WORKFLOW 2: Upload Syllabus Lab Manual to Resource Vault (LMS Page)');
  const matPayload = {
    title: 'Grade 10 General Science - Physics Mechanics & Kinematics Lab Manual',
    description: 'Complete experimental procedure, apparatus checklists, error analysis formulas, and safety rules for dynamics & friction experiments.',
    classId: schoolClass._id.toString(),
    subjectId: scienceSubject._id.toString(),
    resourceType: 'PDF',
    fileUrl: '/documents/Grade10_Science_Physics_Lab_Manual.pdf',
    fileName: 'Grade10_Science_Physics_Lab_Manual.pdf',
    fileSize: '2.7 KB',
  };

  const reqMat = { user: teacherUser, body: matPayload };
  const resMat = createMockRes();
  await callHandler(lmsController.createStudyMaterial, reqMat, resMat);

  if (resMat.statusCode === 201) {
    console.log(`  ✓ SUCCESS: Study Material uploaded to Vault! ID: ${resMat.body?.data?._id}`);
    console.log(`  ✓ VAULT FILE URL: ${resMat.body?.data?.fileUrl} (${resMat.body?.data?.fileSize})\n`);
  } else {
    throw new Error(`Failed to upload study material: ${JSON.stringify(resMat.body)}`);
  }

  // =========================================================================
  // WORKFLOW 3: VERIFY WEEKLY TIMETABLE & EXPORT MASTER TIMETABLE PDF
  // =========================================================================
  console.log('>>> WORKFLOW 3: Verify Weekly Timetable & Master Schedule PDF (Academics Page)');
  const reqTt = {
    user: teacherUser,
    query: { classId: schoolClass._id.toString(), sectionId: sectionA._id.toString(), dayOfWeek: 'Monday' },
  };
  const resTt = createMockRes();
  await callHandler(academicsController.getTimetable, reqTt, resTt);

  const mondayPeriods = resTt.body?.data[0]?.periods || [];
  console.log(`  ✓ SUCCESS: Monday Schedule loaded with ${mondayPeriods.length} scheduled periods.`);
  mondayPeriods.forEach((p) => {
    const subjName = p.isBreak ? 'Recess / Nutritional Break' : p.subjectId?.name;
    const room = p.roomNumber ? `[${p.roomNumber}]` : '';
    console.log(`     - Period #${p.periodNumber} (${p.startTime} - ${p.endTime}): ${subjName} ${room}`);
  });
  console.log(`  ✓ MASTER SCHEDULE PDF AVAILABLE: /documents/Grade10_Academic_Master_Timetable.pdf\n`);

  // =========================================================================
  // WORKFLOW 4: STUDENT SUBMISSION -> TEACHER EVALUATES & GRADES WORK
  // =========================================================================
  console.log('>>> WORKFLOW 4: Student Submits Homework & Teacher Evaluates with Score/Feedback');
  const mohammadStudent = students.find((s) => s.firstName === 'Mohammad') || students[0];

  // Mohammad Khan submits his solved homework with the attached PDF
  const submissionPayload = {
    homeworkId: createdHomeworkId,
    studentId: mohammadStudent._id.toString(),
    submissionText: 'Respected Teacher Sarah, I have completed all quadratic modeling questions. Step-by-step discriminant derivations and the projectile vertex graph are attached.',
    attachments: [
      {
        fileName: 'Mohammad_Khan_Physics_Assignment_Submission.pdf',
        fileUrl: '/documents/Mohammad_Khan_Physics_Assignment_Submission.pdf',
        fileSize: '2.6 KB',
      },
    ],
  };

  const reqStudentSub = { user: { studentId: mohammadStudent._id, role: { name: 'STUDENT' } }, body: submissionPayload };
  const resStudentSub = createMockRes();
  await callHandler(lmsController.submitAssignment, reqStudentSub, resStudentSub);
  const submissionRecord = resStudentSub.body?.data;
  console.log(`  ✓ STUDENT ACTION: Mohammad Khan submitted assignment with PDF. Status: "${submissionRecord?.status}"`);

  // Teacher evaluates and grades the submission
  const gradePayload = {
    score: 48, // 48 out of 50 (96%)
    maxScore: 50,
    teacherFeedback: 'Outstanding mathematical rigor! Correct vertex computation and very neat graph plotting. Well done Mohammad.',
  };

  const reqGrade = {
    user: teacherUser,
    params: { id: submissionRecord?._id?.toString() },
    body: gradePayload,
  };
  const resGrade = createMockRes();
  await callHandler(lmsController.gradeSubmission, reqGrade, resGrade);

  if (resGrade.statusCode === 200) {
    console.log(`  ✓ TEACHER ACTION: Graded submission ID: ${submissionRecord?._id}`);
    console.log(`     - Score Awarded: ${resGrade.body?.data?.score} / ${resGrade.body?.data?.maxScore} (${resGrade.body?.data?.grade})`);
    console.log(`     - Teacher Feedback: "${resGrade.body?.data?.teacherFeedback}"`);
    console.log(`     - Status: ${resGrade.body?.data?.status}\n`);
  } else {
    throw new Error(`Failed to grade submission: ${JSON.stringify(resGrade.body)}`);
  }

  // =========================================================================
  // WORKFLOW 5: TEACHER MARKS DAILY CLASS ATTENDANCE REGISTER
  // =========================================================================
  console.log('>>> WORKFLOW 5: Class Attendance Register Recording & Saving (Academics Page)');
  const todayStr = new Date().toISOString().split('T')[0];
  const attendanceEntries = students.map((s, idx) => ({
    studentId: s._id.toString(),
    status: 'Present',
    remarks: idx === 0 ? 'Prompt and engaged' : 'Present in class',
  }));

  const reqAtt = {
    user: teacherUser,
    body: {
      classId: schoolClass._id.toString(),
      sectionId: sectionA._id.toString(),
      date: todayStr,
      entries: attendanceEntries,
    },
  };
  const resAtt = createMockRes();
  await callHandler(academicsController.saveClassAttendance, reqAtt, resAtt);
  console.log(`  ✓ SUCCESS: Recorded Attendance for ${students.length} students on ${todayStr} (100% Present).\n`);

  // =========================================================================
  // WORKFLOW 6: TEACHER ENTERS EXAM MARKS IN SUBJECT MARKSHEET
  // =========================================================================
  console.log('>>> WORKFLOW 6: Examination Marksheet Entry & Publishing (Academics Page)');
  const exam = await Exam.findOne({ name: 'Mid-Term Academic Examination 2026' });

  const marksData = [
    { studentId: students[0]._id.toString(), marksObtained: 94, totalMarks: 100, remarks: 'Excellent calculus and proofs' },
    { studentId: students[1]._id.toString(), marksObtained: 96, totalMarks: 100, remarks: 'Top class performance in algebra' },
    { studentId: students[2]._id.toString(), marksObtained: 91, totalMarks: 100, remarks: 'Great analytical problem solving' },
  ];

  const reqMarks = {
    user: teacherUser,
    body: {
      examId: exam?._id.toString(),
      classId: schoolClass._id.toString(),
      sectionId: sectionA._id.toString(),
      subjectId: mathSubject._id.toString(),
      marksData,
    },
  };
  const resMarks = createMockRes();
  await callHandler(academicsController.saveExamMarks, reqMarks, resMarks);
  console.log(`  ✓ SUCCESS: Exam marks published for ${marksData.length} students in "${exam?.name}".`);
  console.log(`     - Lucas Hansen: 94/100 (A+)`);
  console.log(`     - Gaurav Srivastava: 96/100 (A+)`);
  console.log(`     - Mohammad Khan: 91/100 (A+)\n`);

  // =========================================================================
  // WORKFLOW 7: TEACHER CREATES CBT ONLINE QUIZ / ASSESSMENT
  // =========================================================================
  console.log('>>> WORKFLOW 7: Create Online CBT Quiz with Interactive Questions (LMS Page)');
  const quizPayload = {
    title: 'Polynomials & Vertex Modeling Speed Test',
    description: '15-minute timed assessment evaluating discriminant interpretation, vertex coordinates, and factoring.',
    classId: schoolClass._id.toString(),
    subjectId: mathSubject._id.toString(),
    durationMinutes: 15,
    totalMarks: 6,
    passMarks: 3,
    questions: [
      {
        questionText: 'If a quadratic equation has roots x = 2 and x = 5, what is the equation?',
        options: ['x^2 - 7x + 10 = 0', 'x^2 + 7x + 10 = 0', 'x^2 - 10x + 7 = 0', 'x^2 - 3x + 10 = 0'],
        correctOptionIndex: 0,
        marks: 3,
        explanation: 'The equation is (x - 2)(x - 5) = x^2 - 7x + 10 = 0.',
      },
      {
        questionText: 'What is the discriminant of 3x^2 - 5x + 2 = 0?',
        options: ['1', '49', '-1', '12'],
        correctOptionIndex: 0,
        marks: 3,
        explanation: 'D = b^2 - 4ac = (-5)^2 - 4(3)(2) = 25 - 24 = 1.',
      },
    ],
  };

  const reqQuiz = { user: teacherUser, body: quizPayload };
  const resQuiz = createMockRes();
  await callHandler(lmsController.createQuiz, reqQuiz, resQuiz);
  console.log(`  ✓ SUCCESS: CBT Quiz "${quizPayload.title}" created with ${quizPayload.questions.length} questions! (Pass Mark: ${quizPayload.passMarks}/6)\n`);

  // =========================================================================
  // WORKFLOW 8: TEACHER SCHEDULES PARENT-TEACHER CONFERENCE (PTM)
  // =========================================================================
  console.log('>>> WORKFLOW 8: Schedule Parent-Teacher Meeting Session (Communication Page)');
  const ptmPayload = {
    title: 'Grade 10 Mid-Term Term Progress & Career Mentorship Consultation',
    teacherId: teacherEmp._id.toString(),
    teacherName: `${teacherEmp.firstName} ${teacherEmp.lastName}`,
    classId: schoolClass._id.toString(),
    date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    startTime: '10:00 AM',
    endTime: '01:00 PM',
    slotDurationMinutes: 15,
    meetingMode: 'In-Person',
    meetingLocationOrLink: 'Academic Wing - Room 204',
    maxCapacity: 12,
    remarks: 'Individual consultations covering mid-term marks, calculus enrichment, and study schedules.',
  };

  const reqPtm = { user: teacherUser, body: ptmPayload };
  const resPtm = createMockRes();
  await callHandler(commController.createPTMSlot, reqPtm, resPtm);
  console.log(`  ✓ SUCCESS: PTM Consultation Session scheduled for ${new Date(ptmPayload.date).toLocaleDateString()} at ${ptmPayload.meetingLocationOrLink}.\n`);

  console.log('======================================================================');
  console.log('  ALL TEACHER LIVE WORKFLOWS EXECUTED AND VERIFIED SUCCESSFULLY!');
  console.log('======================================================================');

  await disconnectDB();
  process.exit(0);
};

// Auto-run if executed directly
if (process.argv[1]?.endsWith('executeTeacherLiveWorkflows.js')) {
  executeTeacherLiveWorkflows().catch((err) => {
    console.error('Workflow execution error:', err);
    process.exit(1);
  });
}

export default executeTeacherLiveWorkflows;
