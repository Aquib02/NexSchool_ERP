import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import Timetable from '../models/Timetable.js';
import Attendance from '../models/Attendance.js';
import Homework from '../models/Homework.js';
import Exam from '../models/Exam.js';
import Mark from '../models/Mark.js';
import ReportCard from '../models/ReportCard.js';
import Student from '../models/Student.js';
import AcademicSession from '../models/AcademicSession.js';

// Grade calculation helper
export const calculateGrade = (percentage) => {
  if (percentage >= 90) return { grade: 'A+', gpa: 4.0 };
  if (percentage >= 80) return { grade: 'A', gpa: 3.7 };
  if (percentage >= 70) return { grade: 'B+', gpa: 3.3 };
  if (percentage >= 60) return { grade: 'B', gpa: 3.0 };
  if (percentage >= 50) return { grade: 'C', gpa: 2.0 };
  if (percentage >= 40) return { grade: 'D', gpa: 1.0 };
  return { grade: 'F', gpa: 0.0 };
};

// ==================== TIMETABLE ====================
export const getTimetable = asyncHandler(async (req, res) => {
  const { classId, sectionId, dayOfWeek } = req.query;
  const filter = {};
  if (classId) filter.classId = classId;
  if (sectionId) filter.sectionId = sectionId;
  if (dayOfWeek) filter.dayOfWeek = dayOfWeek;

  const timetable = await Timetable.find(filter)
    .populate('classId', 'name code')
    .populate('sectionId', 'name')
    .populate('periods.subjectId', 'name code')
    .populate('periods.teacherId', 'firstName lastName employeeId')
    .sort({ dayOfWeek: 1 });

  return ApiResponse.ok(res, timetable, 'Timetable schedule retrieved');
});

export const saveTimetableDay = asyncHandler(async (req, res) => {
  const { academicSessionId, classId, sectionId, dayOfWeek, periods } = req.body;

  let targetSessionId = academicSessionId;
  if (!targetSessionId) {
    const currentSession = await AcademicSession.findOne({ isCurrent: true });
    if (!currentSession) throw ApiError.badRequest('No active session found.');
    targetSessionId = currentSession._id;
  }

  // Clash Detection: Check if any assigned teacher is already booked in another class for the same day & period
  for (const p of periods || []) {
    if (p.teacherId && !p.isBreak) {
      const clash = await Timetable.findOne({
        academicSessionId: targetSessionId,
        dayOfWeek,
        $or: [{ classId: { $ne: classId } }, { sectionId: { $ne: sectionId } }],
        'periods.periodNumber': p.periodNumber,
        'periods.teacherId': p.teacherId,
      }).populate('classId', 'name').populate('sectionId', 'name');

      if (clash) {
        throw ApiError.conflict(
          `Teacher conflict detected! Assigned faculty is already booked in ${clash.classId?.name} Section ${clash.sectionId?.name} for Period ${p.periodNumber} on ${dayOfWeek}.`
        );
      }
    }
  }

  const updated = await Timetable.findOneAndUpdate(
    { academicSessionId: targetSessionId, classId, sectionId, dayOfWeek },
    { academicSessionId: targetSessionId, classId, sectionId, dayOfWeek, periods },
    { upsert: true, new: true, runValidators: true }
  )
    .populate('periods.subjectId', 'name code')
    .populate('periods.teacherId', 'firstName lastName');

  return ApiResponse.ok(res, updated, `Timetable for ${dayOfWeek} saved successfully`);
});

// ==================== ATTENDANCE ====================
export const getClassAttendanceRegister = asyncHandler(async (req, res) => {
  const { classId, sectionId, date } = req.query;
  if (!classId || !sectionId || !date) {
    throw ApiError.badRequest('Class ID, Section ID, and Date are required.');
  }

  const queryDate = new Date(date);
  queryDate.setHours(0, 0, 0, 0);

  // 1. Get all active students in section
  const students = await Student.find({
    classId,
    sectionId,
    status: 'Active',
  })
    .select('studentId firstName lastName rollNumber photo')
    .sort({ rollNumber: 1 });

  // 2. Get attendance records marked on that date
  const records = await Attendance.find({
    classId,
    sectionId,
    date: queryDate,
    attendanceType: 'Student',
  });

  const recordMap = new Map();
  records.forEach((r) => recordMap.set(r.studentId.toString(), r));

  // Merge students with their attendance status
  const roster = students.map((s) => {
    const existing = recordMap.get(s._id.toString());
    return {
      student: s,
      status: existing ? existing.status : 'Present', // Default to present
      remarks: existing ? existing.remarks : '',
      attendanceId: existing ? existing._id : null,
    };
  });

  return ApiResponse.ok(
    res,
    {
      date: queryDate,
      totalStudents: students.length,
      markedCount: records.length,
      roster,
    },
    'Attendance register loaded'
  );
});

export const saveClassAttendance = asyncHandler(async (req, res) => {
  const { classId, sectionId, date, academicSessionId, entries } = req.body;
  if (!entries || !Array.isArray(entries)) {
    throw ApiError.badRequest('Attendance entries array is required.');
  }

  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  let targetSessionId = academicSessionId;
  if (!targetSessionId) {
    const current = await AcademicSession.findOne({ isCurrent: true });
    targetSessionId = current?._id;
  }

  const operations = entries.map((entry) => ({
    updateOne: {
      filter: {
        studentId: entry.studentId,
        date: targetDate,
      },
      update: {
        $set: {
          attendanceType: 'Student',
          studentId: entry.studentId,
          classId,
          sectionId,
          academicSessionId: targetSessionId,
          date: targetDate,
          status: entry.status || 'Present',
          remarks: entry.remarks || '',
          markedBy: req.user._id,
        },
      },
      upsert: true,
    },
  }));

  await Attendance.bulkWrite(operations);

  return ApiResponse.ok(res, null, `Attendance for ${entries.length} students recorded successfully`);
});

// ==================== HOMEWORK ====================
export const getHomeworkList = asyncHandler(async (req, res) => {
  const { classId, sectionId, subjectId } = req.query;
  const filter = {};
  if (classId) filter.classId = classId;
  if (sectionId) filter.sectionId = sectionId;
  if (subjectId) filter.subjectId = subjectId;

  const homework = await Homework.find(filter)
    .populate('classId', 'name code')
    .populate('sectionId', 'name')
    .populate('subjectId', 'name code')
    .populate('assignedBy', 'firstName lastName')
    .sort({ dueDate: -1 });

  return ApiResponse.ok(res, homework, 'Homework assignments retrieved');
});

export const createHomework = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    classId,
    sectionId,
    subjectId,
    academicSessionId,
    dueDate,
    maxMarks,
    attachments,
  } = req.body;

  let targetSessionId = academicSessionId;
  if (!targetSessionId) {
    const current = await AcademicSession.findOne({ isCurrent: true });
    targetSessionId = current?._id;
  }

  const hw = await Homework.create({
    title,
    description,
    classId,
    sectionId,
    subjectId,
    academicSessionId: targetSessionId,
    assignedBy: req.user.employeeId || req.user._id,
    dueDate,
    maxMarks: maxMarks || 10,
    attachments: attachments || [],
  });

  return ApiResponse.created(res, hw, 'Homework assignment created and published');
});

export const submitHomework = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { content, fileUrl } = req.body;

  const hw = await Homework.findById(id);
  if (!hw) throw ApiError.notFound('Homework assignment not found');

  const studentId = req.user.studentId || req.body.studentId;
  if (!studentId) throw ApiError.badRequest('Student identification is required to submit homework.');

  // Find existing submission or push new
  const existingSubIdx = hw.submissions.findIndex(
    (s) => s.studentId.toString() === studentId.toString()
  );

  const submissionItem = {
    studentId,
    submittedAt: new Date(),
    fileUrl: fileUrl || null,
    content: content || '',
    status: new Date() > new Date(hw.dueDate) ? 'Late' : 'Submitted',
  };

  if (existingSubIdx >= 0) {
    hw.submissions[existingSubIdx] = submissionItem;
  } else {
    hw.submissions.push(submissionItem);
  }

  await hw.save();
  return ApiResponse.ok(res, hw, 'Homework submitted successfully');
});

export const gradeHomeworkSubmission = asyncHandler(async (req, res) => {
  const { id, submissionStudentId } = req.params;
  const { marksAwarded, teacherFeedback } = req.body;

  const hw = await Homework.findById(id);
  if (!hw) throw ApiError.notFound('Homework not found');

  const sub = hw.submissions.find(
    (s) => s.studentId.toString() === submissionStudentId.toString()
  );
  if (!sub) throw ApiError.notFound('Submission not found for this student');

  sub.marksAwarded = marksAwarded;
  sub.teacherFeedback = teacherFeedback;
  sub.status = 'Graded';

  await hw.save();
  return ApiResponse.ok(res, sub, 'Homework graded successfully');
});

// ==================== EXAMINATION & MARKS ====================
export const getExams = asyncHandler(async (req, res) => {
  const exams = await Exam.find()
    .populate('classes', 'name code')
    .populate('schedule.subjectId', 'name code')
    .sort({ startDate: -1 });

  return ApiResponse.ok(res, exams, 'Examinations list retrieved');
});

export const createExam = asyncHandler(async (req, res) => {
  const { name, examType, academicSessionId, classes, startDate, endDate, schedule } = req.body;

  let targetSessionId = academicSessionId;
  if (!targetSessionId) {
    const current = await AcademicSession.findOne({ isCurrent: true });
    targetSessionId = current?._id;
  }

  const exam = await Exam.create({
    name,
    examType,
    academicSessionId: targetSessionId,
    classes: classes || [],
    startDate,
    endDate,
    schedule: schedule || [],
    status: 'Scheduled',
  });

  return ApiResponse.created(res, exam, 'Examination created and scheduled');
});

export const getExamMarks = asyncHandler(async (req, res) => {
  const { examId, classId, sectionId, subjectId } = req.query;
  if (!examId || !classId || !sectionId || !subjectId) {
    throw ApiError.badRequest('Exam ID, Class ID, Section ID, and Subject ID are required.');
  }

  const [students, existingMarks] = await Promise.all([
    Student.find({ classId, sectionId, status: 'Active' })
      .select('studentId firstName lastName rollNumber')
      .sort({ rollNumber: 1 }),
    Mark.find({ examId, classId, sectionId, subjectId }),
  ]);

  const markMap = new Map();
  existingMarks.forEach((m) => markMap.set(m.studentId.toString(), m));

  const marksheet = students.map((s) => {
    const m = markMap.get(s._id.toString());
    return {
      student: s,
      marksObtained: m ? m.marksObtained : '',
      totalMarks: m ? m.totalMarks : 100,
      grade: m ? m.grade : '',
      isAbsent: m ? m.isAbsent : false,
      remarks: m ? m.remarks : '',
      markId: m ? m._id : null,
    };
  });

  return ApiResponse.ok(res, marksheet, 'Exam marksheet loaded');
});

export const saveExamMarks = asyncHandler(async (req, res) => {
  const { examId, classId, sectionId, subjectId, academicSessionId, marksData } = req.body;

  let targetSessionId = academicSessionId;
  if (!targetSessionId) {
    const current = await AcademicSession.findOne({ isCurrent: true });
    targetSessionId = current?._id;
  }

  const operations = marksData.map((item) => {
    const marksObtained = item.isAbsent ? 0 : Number(item.marksObtained);
    const totalMarks = Number(item.totalMarks) || 100;
    const percentage = totalMarks > 0 ? (marksObtained / totalMarks) * 100 : 0;
    const { grade } = calculateGrade(percentage);

    return {
      updateOne: {
        filter: {
          examId,
          studentId: item.studentId,
          subjectId,
        },
        update: {
          $set: {
            examId,
            studentId: item.studentId,
            classId,
            sectionId,
            subjectId,
            academicSessionId: targetSessionId,
            marksObtained,
            totalMarks,
            grade: item.isAbsent ? 'ABS' : grade,
            isAbsent: !!item.isAbsent,
            remarks: item.remarks || '',
            enteredBy: req.user._id,
          },
        },
        upsert: true,
      },
    };
  });

  await Mark.bulkWrite(operations);
  return ApiResponse.ok(res, null, `Marks for ${marksData.length} students recorded`);
});

// ==================== REPORT CARDS ====================
export const generateStudentReportCard = asyncHandler(async (req, res) => {
  const { studentId, examId } = req.body;

  const [student, exam, marks] = await Promise.all([
    Student.findById(studentId).populate('classId').populate('sectionId'),
    Exam.findById(examId),
    Mark.find({ studentId, examId }).populate('subjectId', 'name code totalMarks passMarks'),
  ]);

  if (!student) throw ApiError.notFound('Student not found');
  if (!exam) throw ApiError.notFound('Exam not found');
  if (marks.length === 0) {
    throw ApiError.badRequest('No subject marks have been recorded for this student in this exam.');
  }

  let totalPossible = 0;
  let totalObtained = 0;

  const subjectsSummary = marks.map((m) => {
    totalPossible += m.totalMarks;
    totalObtained += m.marksObtained;
    return {
      subjectId: m.subjectId._id,
      subjectName: m.subjectId.name,
      marksObtained: m.marksObtained,
      totalMarks: m.totalMarks,
      grade: m.grade,
      remarks: m.remarks,
    };
  });

  const percentage = totalPossible > 0 ? (totalObtained / totalPossible) * 100 : 0;
  const { grade: overallGrade, gpa } = calculateGrade(percentage);

  // Compute attendance percentage
  const totalDays = await Attendance.countDocuments({
    studentId,
    attendanceType: 'Student',
  });
  const presentDays = await Attendance.countDocuments({
    studentId,
    attendanceType: 'Student',
    status: { $in: ['Present', 'Late'] },
  });
  const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100;

  const reportCard = await ReportCard.findOneAndUpdate(
    { studentId, examId, academicSessionId: exam.academicSessionId },
    {
      studentId,
      examId,
      academicSessionId: exam.academicSessionId,
      classId: student.classId._id,
      sectionId: student.sectionId._id,
      subjectsSummary,
      totalMarksPossible: totalPossible,
      totalMarksObtained: totalObtained,
      percentage: Number(percentage.toFixed(2)),
      gpa,
      overallGrade,
      attendancePercentage,
      status: 'Published',
    },
    { upsert: true, new: true, runValidators: true }
  );

  return ApiResponse.ok(res, reportCard, 'Report card compiled and published');
});

export const getReportCards = asyncHandler(async (req, res) => {
  const { studentId, examId, classId } = req.query;
  const filter = {};
  if (studentId) filter.studentId = studentId;
  if (examId) filter.examId = examId;
  if (classId) filter.classId = classId;

  const reportCards = await ReportCard.find(filter)
    .populate('studentId', 'firstName lastName studentId rollNumber')
    .populate('examId', 'name examType')
    .populate('classId', 'name code')
    .populate('sectionId', 'name')
    .sort({ percentage: -1 });

  return ApiResponse.ok(res, reportCards, 'Report cards retrieved');
});
