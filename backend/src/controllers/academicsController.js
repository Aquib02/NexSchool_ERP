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
import Subject from '../models/Subject.js';
import Employee from '../models/Employee.js';
import SchoolClass from '../models/SchoolClass.js';
import Section from '../models/Section.js';
import fs from 'fs';
import path from 'path';

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
  if (req.user?.role?.name === 'STUDENT') {
    throw ApiError.forbidden('Students are not authorized to modify timetable schedules.');
  }

  const { academicSessionId, classId, sectionId, dayOfWeek, days, periods } = req.body;

  let targetSessionId = academicSessionId;
  if (!targetSessionId) {
    const currentSession = await AcademicSession.findOne({ isCurrent: true });
    if (!currentSession) throw ApiError.badRequest('No active session found.');
    targetSessionId = currentSession._id;
  }

  // Support single day or multiple target days for bulk routine replication
  const targetDays = Array.isArray(days) && days.length > 0 ? days : (dayOfWeek ? [dayOfWeek] : ['Monday']);

  const formattedPeriods = (periods || []).map((p, idx) => ({
    periodNumber: Number(p.periodNumber) || (idx + 1),
    startTime: p.startTime || '08:30 AM',
    endTime: p.endTime || '09:15 AM',
    subjectId: p.isBreak ? null : (p.subjectId || null),
    subjectName: p.isBreak ? 'Break Time' : (p.subjectName || ''),
    teacherId: p.isBreak ? null : (p.teacherId || null),
    teacherName: p.isBreak ? 'N/A' : (p.teacherName || ''),
    roomNumber: p.roomNumber || (p.isBreak ? 'Cafeteria / Courtyard' : 'Room 204'),
    isBreak: !!p.isBreak,
  }));

  // Clash Detection across each target day
  for (const day of targetDays) {
    for (const p of formattedPeriods) {
      if (p.teacherId && !p.isBreak) {
        const clash = await Timetable.findOne({
          academicSessionId: targetSessionId,
          dayOfWeek: day,
          $or: [{ classId: { $ne: classId } }, { sectionId: { $ne: sectionId } }],
          'periods.periodNumber': p.periodNumber,
          'periods.teacherId': p.teacherId,
        }).populate('classId', 'name').populate('sectionId', 'name');

        if (clash) {
          throw ApiError.conflict(
            `Teacher conflict detected! Assigned faculty is already booked in ${clash.classId?.name} Section ${clash.sectionId?.name} for Period ${p.periodNumber} on ${day}.`
          );
        }
      }
    }
  }

  const savedList = [];
  for (const day of targetDays) {
    const updated = await Timetable.findOneAndUpdate(
      { academicSessionId: targetSessionId, classId, sectionId, dayOfWeek: day },
      {
        academicSessionId: targetSessionId,
        classId,
        sectionId,
        dayOfWeek: day,
        periods: formattedPeriods,
        isActive: true,
      },
      { upsert: true, new: true, runValidators: true }
    )
      .populate('periods.subjectId', 'name code')
      .populate('periods.teacherId', 'firstName lastName');
    savedList.push(updated);
  }

  const daysLabel = targetDays.join(', ');
  return ApiResponse.ok(
    res,
    { savedDays: savedList, count: savedList.length, targetDays },
    `Timetable schedule successfully saved and applied to ${daysLabel}`
  );
});

export const getTeachers = asyncHandler(async (req, res) => {
  const teachers = await Employee.find({ status: 'Active' })
    .select('_id firstName lastName employeeId email phone')
    .sort({ firstName: 1 });
  return ApiResponse.ok(res, teachers, 'Active faculty list retrieved');
});

export const extractTimetableFromPdf = asyncHandler(async (req, res) => {
  const { fileBase64, filePath, fileUrl, classId, sectionId, dayOfWeek, days, saveToDatabase } = req.body;

  let buffer = null;

  if (fileBase64) {
    const cleanedBase64 = fileBase64.replace(/^data:application\/pdf;base64,/, '').replace(/\s/g, '');
    buffer = Buffer.from(cleanedBase64, 'base64');
  } else {
    const targetFile = filePath || fileUrl || 'Grade10_Academic_Master_Timetable.pdf';
    const cleanFileName = path.basename(targetFile);

    const candidates = [
      targetFile,
      path.resolve(process.cwd(), targetFile.replace(/^\//, '')),
      path.resolve(process.cwd(), 'uploads/documents', cleanFileName),
      path.resolve(process.cwd(), '../frontend/public/documents', cleanFileName),
      path.resolve(process.cwd(), 'frontend/public/documents', cleanFileName),
    ];

    for (const cand of candidates) {
      if (fs.existsSync(cand)) {
        buffer = fs.readFileSync(cand);
        break;
      }
    }
  }

  if (!buffer || buffer.length === 0) {
    throw ApiError.badRequest('Unable to read PDF file for timetable data extraction.');
  }

  let text = '';
  try {
    const { PDFParse } = await import('pdf-parse');
    const parser = new PDFParse(new Uint8Array(buffer));
    const parseRes = await parser.getText();
    text = parseRes?.text || '';
  } catch (err) {
    throw ApiError.badRequest(`Failed to parse PDF document: ${err.message}`);
  }

  const [dbSubjects, dbEmployees] = await Promise.all([
    Subject.find(),
    Employee.find({ status: 'Active' }),
  ]);

  const lines = text.split('\n');
  const periods = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    const m = line.match(/^Period\s+(\d+)\s*\(([^)]+)\)\s*:\s*(.+)$/i);
    if (m) {
      const periodNumber = parseInt(m[1], 10);
      const timePart = m[2].split('-').map((t) => t.trim());
      const startTime = timePart[0] || '08:30 AM';
      const endTime = timePart[1] || '09:15 AM';
      let rest = m[3].trim();
      let roomNumber = '';
      const roomMatch = rest.match(/\[([^\]]+)\]$/);
      if (roomMatch) {
        roomNumber = roomMatch[1].trim();
        rest = rest.replace(/\s*\[([^\]]+)\]$/, '').trim();
      }
      let teacherName = '';
      const teacherMatch = rest.match(/-\s*(?:Teacher:\s*)?([^-]+)$/i);
      if (teacherMatch) {
        teacherName = teacherMatch[1].trim();
        rest = rest.substring(0, teacherMatch.index).trim();
      }
      const isBreak = /break|recess|lunch/i.test(rest);

      let subjectId = null;
      let teacherId = null;

      if (!isBreak) {
        const matchedSub = dbSubjects.find(
          (s) =>
            rest.toLowerCase().includes(s.name.toLowerCase()) ||
            s.name.toLowerCase().includes(rest.toLowerCase()) ||
            (s.code && rest.includes(s.code))
        );
        if (matchedSub) {
          subjectId = matchedSub._id;
        }

        const matchedEmp = dbEmployees.find(
          (e) =>
            teacherName.toLowerCase().includes(e.firstName.toLowerCase()) ||
            teacherName.toLowerCase().includes(e.lastName.toLowerCase())
        );
        if (matchedEmp) {
          teacherId = matchedEmp._id;
          teacherName = `${matchedEmp.firstName} ${matchedEmp.lastName}`;
        }
      }

      periods.push({
        periodNumber,
        startTime,
        endTime,
        subjectName: isBreak ? 'Break Time' : rest,
        subjectId,
        teacherName: isBreak ? 'N/A' : teacherName || 'Faculty Assigned',
        teacherId,
        roomNumber: roomNumber || (isBreak ? 'Cafeteria / Courtyard' : 'Room 204'),
        isBreak,
      });
    }
  }

  // If saveToDatabase requested and classId, sectionId, dayOfWeek/days provided
  let savedTimetable = null;
  const targetDays = Array.isArray(days) && days.length > 0 ? days : (dayOfWeek ? [dayOfWeek] : ['Monday']);
  if (saveToDatabase && classId && sectionId) {
    let currentSession = await AcademicSession.findOne({ isCurrent: true });
    if (!currentSession) currentSession = await AcademicSession.findOne();

    for (const d of targetDays) {
      savedTimetable = await Timetable.findOneAndUpdate(
        {
          academicSessionId: currentSession?._id,
          classId,
          sectionId,
          dayOfWeek: d,
        },
        {
          academicSessionId: currentSession?._id,
          classId,
          sectionId,
          dayOfWeek: d,
          periods,
          isActive: true,
        },
        { upsert: true, new: true, runValidators: true }
      )
        .populate('periods.subjectId', 'name code')
        .populate('periods.teacherId', 'firstName lastName');
    }
  }

  return ApiResponse.ok(
    res,
    {
      periods,
      totalExtracted: periods.length,
      savedTimetable,
      source: 'PDF_EXTRACTED',
      previewText: text.substring(0, 400),
    },
    `Extracted ${periods.length} periods from Timetable PDF successfully`
  );
});

// ==================== ATTENDANCE ====================
export const getClassAttendanceRegister = asyncHandler(async (req, res) => {
  if (req.user?.role?.name === 'STUDENT') {
    throw ApiError.forbidden('Students are not authorized to access class-wide attendance registers.');
  }

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
  if (req.user?.role?.name === 'STUDENT') {
    throw ApiError.forbidden('Students are strictly forbidden from recording or modifying attendance.');
  }
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
  if (req.user?.role?.name === 'STUDENT') {
    throw ApiError.forbidden('Students are not authorized to create or assign homework.');
  }

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

export const updateHomework = asyncHandler(async (req, res) => {
  if (req.user?.role?.name === 'STUDENT') {
    throw ApiError.forbidden('Students are not authorized to modify homework assignments.');
  }

  const { id } = req.params;
  const {
    title,
    description,
    classId,
    sectionId,
    subjectId,
    dueDate,
    maxMarks,
    attachments,
  } = req.body;

  const hw = await Homework.findById(id);
  if (!hw) throw ApiError.notFound('Homework assignment not found');

  if (title !== undefined) hw.title = title;
  if (description !== undefined) hw.description = description;
  if (classId !== undefined) hw.classId = classId;
  if (sectionId !== undefined) hw.sectionId = sectionId;
  if (subjectId !== undefined) hw.subjectId = subjectId;
  if (dueDate !== undefined) hw.dueDate = dueDate;
  if (maxMarks !== undefined) hw.maxMarks = maxMarks;
  if (attachments !== undefined) hw.attachments = attachments;

  await hw.save();

  const populated = await Homework.findById(hw._id)
    .populate('classId', 'name code')
    .populate('sectionId', 'name')
    .populate('subjectId', 'name code')
    .populate('assignedBy', 'firstName lastName');

  return ApiResponse.ok(res, populated, 'Homework assignment updated successfully');
});

export const deleteHomework = asyncHandler(async (req, res) => {
  if (req.user?.role?.name === 'STUDENT') {
    throw ApiError.forbidden('Students are not authorized to delete homework assignments.');
  }

  const { id } = req.params;
  const hw = await Homework.findById(id);
  if (!hw) throw ApiError.notFound('Homework assignment not found');

  await Homework.findByIdAndDelete(id);

  return ApiResponse.ok(res, { id }, 'Homework assignment deleted successfully');
});

export const submitHomework = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { content, fileUrl } = req.body;

  const hw = await Homework.findById(id);
  if (!hw) throw ApiError.notFound('Homework assignment not found');

  let studentId = req.user.studentId;
  if (req.user?.role?.name !== 'STUDENT') {
    studentId = studentId || req.body.studentId;
  }
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
  if (req.user?.role?.name === 'STUDENT') {
    throw ApiError.forbidden('Students are not authorized to grade homework submissions.');
  }

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
  if (req.user?.role?.name === 'STUDENT') {
    throw ApiError.forbidden('Students are not authorized to create or schedule examinations.');
  }

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
  if (req.user?.role?.name === 'STUDENT') {
    throw ApiError.forbidden('Students are not authorized to view the class-wide marks register.');
  }

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
  if (req.user?.role?.name === 'STUDENT') {
    throw ApiError.forbidden('Students are strictly forbidden from entering or altering exam marks.');
  }

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
  if (req.user?.role?.name === 'STUDENT') {
    throw ApiError.forbidden('Students are not authorized to compile or publish report cards.');
  }

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

  // STRICT PRIVACY SCOPING: Students only see their own report card
  if (req.user?.role?.name === 'STUDENT') {
    if (!req.user.studentId) {
      return ApiResponse.ok(res, [], 'Report cards retrieved');
    }
    filter.studentId = req.user.studentId;
  }

  const reportCards = await ReportCard.find(filter)
    .populate('studentId', 'firstName lastName studentId rollNumber')
    .populate('examId', 'name examType')
    .populate('classId', 'name code')
    .populate('sectionId', 'name')
    .sort({ percentage: -1 });

  return ApiResponse.ok(res, reportCards, 'Report cards retrieved');
});

// ==================== CONSOLIDATED RESULTS & BROAD SHEET ====================
export const getConsolidatedClassResults = asyncHandler(async (req, res) => {
  if (req.user?.role?.name === 'STUDENT') {
    throw ApiError.forbidden('Students are not authorized to view the consolidated class result gazette.');
  }

  const { examId, classId, sectionId } = req.query;
  if (!examId || !classId || !sectionId) {
    throw ApiError.badRequest('Exam ID, Class ID, and Section ID are required.');
  }

  const [exam, schoolClass, section, subjects, students, marks, reportCards] = await Promise.all([
    Exam.findById(examId),
    SchoolClass.findById(classId),
    Section.findById(sectionId),
    Subject.find({ classId }).select('name code totalMarks passMarks').sort({ name: 1 }),
    Student.find({ classId, sectionId, status: 'Active' })
      .select('studentId firstName lastName rollNumber')
      .sort({ rollNumber: 1 }),
    Mark.find({ examId, classId, sectionId }).populate('subjectId', 'name code'),
    ReportCard.find({ examId, classId, sectionId }),
  ]);

  if (!exam) throw ApiError.notFound('Exam not found');

  // Mark indexing: `${studentId}_${subjectId}` => Mark
  const markMap = new Map();
  marks.forEach((m) => {
    const sId = m.studentId?.toString();
    const subId = (m.subjectId?._id || m.subjectId)?.toString();
    if (sId && subId) {
      markMap.set(`${sId}_${subId}`, m);
    }
  });

  // Report card indexing: studentId => ReportCard
  const rcMap = new Map();
  reportCards.forEach((rc) => {
    rcMap.set(rc.studentId.toString(), rc);
  });

  // Build matrix for each student
  let rawStudentResults = students.map((student) => {
    const sId = student._id.toString();
    let totalObtained = 0;
    let totalPossible = 0;
    let anyFail = false;
    let allSubjectsGraded = true;
    let absentCount = 0;

    const subjectsMarks = {};

    subjects.forEach((subj) => {
      const subId = subj._id.toString();
      const mark = markMap.get(`${sId}_${subId}`);
      const maxMarks = subj.totalMarks || 100;
      totalPossible += maxMarks;

      if (mark) {
        const marksObtained = mark.isAbsent ? 0 : Number(mark.marksObtained);
        if (mark.isAbsent) absentCount++;
        totalObtained += marksObtained;
        const subPass = !mark.isAbsent && marksObtained >= 40;
        if (!subPass) anyFail = true;

        subjectsMarks[subId] = {
          marksObtained: mark.isAbsent ? 'ABS' : marksObtained,
          totalMarks: maxMarks,
          grade: mark.grade || (mark.isAbsent ? 'ABS' : calculateGrade((marksObtained / maxMarks) * 100).grade),
          isAbsent: mark.isAbsent,
          remarks: mark.remarks || '',
          status: mark.isAbsent ? 'Absent' : subPass ? 'PASS' : 'FAIL',
        };
      } else {
        allSubjectsGraded = false;
        subjectsMarks[subId] = {
          marksObtained: '',
          totalMarks: maxMarks,
          grade: '—',
          isAbsent: false,
          remarks: '',
          status: 'Pending',
        };
      }
    });

    const percentage = totalPossible > 0 ? (totalObtained / totalPossible) * 100 : 0;
    const { grade: overallGrade, gpa } = calculateGrade(percentage);

    const existingRc = rcMap.get(sId);
    let defaultRemark = 'Satisfactory academic progress.';
    if (percentage >= 90) defaultRemark = 'Outstanding academic performance with exceptional dedication.';
    else if (percentage >= 80) defaultRemark = 'Excellent performance with strong conceptual clarity.';
    else if (percentage >= 70) defaultRemark = 'Good understanding and consistent participation in class.';
    else if (percentage >= 60) defaultRemark = 'Above average performance; has good potential to excel.';
    else if (percentage >= 50) defaultRemark = 'Average performance; needs more regular practice.';
    else if (percentage >= 40) defaultRemark = 'Marginally passed; recommended remedial reinforcement.';
    else defaultRemark = 'Needs intensive remedial support and close academic monitoring.';

    let passStatus = 'PASS';
    if (anyFail || percentage < 40) passStatus = 'FAIL';
    if (!allSubjectsGraded && totalObtained === 0) passStatus = 'Pending';

    return {
      student: {
        _id: student._id,
        studentId: student.studentId,
        firstName: student.firstName,
        lastName: student.lastName,
        rollNumber: student.rollNumber,
      },
      subjectsMarks,
      totalMarksObtained: totalObtained,
      totalMarksPossible: totalPossible,
      percentage: Number(percentage.toFixed(1)),
      overallGrade,
      gpa,
      passStatus,
      teacherRemarks: existingRc?.teacherRemarks || defaultRemark,
      attendancePercentage: existingRc?.attendancePercentage || 95,
      reportCardId: existingRc?._id || null,
      isPublished: existingRc?.status === 'Published',
    };
  });

  // Calculate Class Ranks based on total marks obtained (descending)
  const sortedRanks = [...rawStudentResults].sort(
    (a, b) => b.totalMarksObtained - a.totalMarksObtained
  );
  const rankMap = new Map();
  sortedRanks.forEach((item, idx) => {
    rankMap.set(item.student._id.toString(), idx + 1);
  });

  const studentsWithRank = rawStudentResults.map((item) => ({
    ...item,
    classRank: rankMap.get(item.student._id.toString()) || 1,
  }));

  // Class Summary Statistics
  const totalStudents = studentsWithRank.length;
  const passedStudents = studentsWithRank.filter((s) => s.passStatus === 'PASS').length;
  const failedStudents = studentsWithRank.filter((s) => s.passStatus === 'FAIL').length;
  const passRate = totalStudents > 0 ? Math.round((passedStudents / totalStudents) * 100) : 0;
  const totalScoresSum = studentsWithRank.reduce((acc, curr) => acc + curr.percentage, 0);
  const classAverage = totalStudents > 0 ? (totalScoresSum / totalStudents).toFixed(1) : 0;
  const highestScore = Math.max(...studentsWithRank.map((s) => s.totalMarksObtained), 0);

  return ApiResponse.ok(res, {
    exam: { _id: exam._id, name: exam.name, examType: exam.examType },
    schoolClass: { _id: schoolClass?._id, name: schoolClass?.name, code: schoolClass?.code },
    section: { _id: section?._id, name: section?.name },
    subjects,
    students: studentsWithRank,
    classStats: {
      totalStudents,
      passedStudents,
      failedStudents,
      passRate,
      classAverage,
      highestScore,
    },
  }, 'Consolidated class results retrieved');
});

// ==================== COMPILE CLASS RESULTS (COORDINATOR / CLASS TEACHER) ====================
export const compileClassResults = asyncHandler(async (req, res) => {
  if (req.user?.role?.name === 'STUDENT') {
    throw ApiError.forbidden('Students are strictly forbidden from compiling class examination results.');
  }

  const { examId, classId, sectionId, reviews } = req.body;
  if (!examId || !classId || !sectionId) {
    throw ApiError.badRequest('Exam ID, Class ID, and Section ID are required.');
  }

  const exam = await Exam.findById(examId);
  if (!exam) throw ApiError.notFound('Exam not found');

  const [subjects, students, marks] = await Promise.all([
    Subject.find({ classId }).select('name code totalMarks passMarks'),
    Student.find({ classId, sectionId, status: 'Active' }).sort({ rollNumber: 1 }),
    Mark.find({ examId, classId, sectionId }).populate('subjectId', 'name code totalMarks'),
  ]);

  const markMap = new Map();
  marks.forEach((m) => {
    const sId = m.studentId?.toString();
    const subId = (m.subjectId?._id || m.subjectId)?.toString();
    if (sId && subId) markMap.set(`${sId}_${subId}`, m);
  });

  // Calculate attendance for all students in bulk
  const attendanceMap = new Map();
  await Promise.all(
    students.map(async (student) => {
      const sId = student._id.toString();
      const totalDays = await Attendance.countDocuments({ studentId: sId, attendanceType: 'Student' });
      const presentDays = await Attendance.countDocuments({
        studentId: sId,
        attendanceType: 'Student',
        status: { $in: ['Present', 'Late'] },
      });
      const attPct = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 95;
      attendanceMap.set(sId, attPct);
    })
  );

  // Compile individual totals to determine rank
  const studentTotals = students.map((student) => {
    const sId = student._id.toString();
    let totalObt = 0;
    subjects.forEach((subj) => {
      const mk = markMap.get(`${sId}_${subj._id.toString()}`);
      if (mk && !mk.isAbsent) totalObt += Number(mk.marksObtained);
    });
    return { studentId: sId, totalObt };
  });

  studentTotals.sort((a, b) => b.totalObt - a.totalObt);
  const rankMap = new Map();
  studentTotals.forEach((st, idx) => rankMap.set(st.studentId, idx + 1));

  // Upsert ReportCard for each student
  const savedReportCards = [];
  for (const student of students) {
    const sId = student._id.toString();
    let totalPossible = 0;
    let totalObtained = 0;

    const subjectsSummary = subjects.map((subj) => {
      const subId = subj._id.toString();
      const mk = markMap.get(`${sId}_${subId}`);
      const maxMarks = subj.totalMarks || 100;
      totalPossible += maxMarks;

      let marksObtained = 0;
      let grade = 'F';
      let remarks = '';
      if (mk) {
        marksObtained = mk.isAbsent ? 0 : Number(mk.marksObtained);
        grade = mk.grade || calculateGrade((marksObtained / maxMarks) * 100).grade;
        remarks = mk.remarks || '';
      }
      totalObtained += marksObtained;

      return {
        subjectId: subj._id,
        subjectName: subj.name,
        marksObtained,
        totalMarks: maxMarks,
        grade,
        remarks,
      };
    });

    const percentage = totalPossible > 0 ? (totalObtained / totalPossible) * 100 : 0;
    const { grade: overallGrade, gpa } = calculateGrade(percentage);

    const userReview = reviews && reviews[sId] ? reviews[sId].trim() : '';
    let teacherRemarks = userReview;
    if (!teacherRemarks) {
      if (percentage >= 90) teacherRemarks = 'Outstanding performance with exceptional academic dedication.';
      else if (percentage >= 80) teacherRemarks = 'Very good academic progress with consistent classroom engagement.';
      else if (percentage >= 60) teacherRemarks = 'Satisfactory overall performance; has good potential.';
      else teacherRemarks = 'Needs improvement and regular revision across core subjects.';
    }

    const rc = await ReportCard.findOneAndUpdate(
      { studentId: student._id, examId, academicSessionId: exam.academicSessionId },
      {
        studentId: student._id,
        examId,
        academicSessionId: exam.academicSessionId,
        classId,
        sectionId,
        subjectsSummary,
        totalMarksPossible: totalPossible,
        totalMarksObtained: totalObtained,
        percentage: Number(percentage.toFixed(2)),
        gpa,
        overallGrade,
        classRank: rankMap.get(sId) || 1,
        attendancePercentage: attendanceMap.get(sId) || 95,
        teacherRemarks,
        status: 'Published',
      },
      { upsert: true, new: true, runValidators: true }
    );
    savedReportCards.push(rc);
  }

  return ApiResponse.ok(res, {
    count: savedReportCards.length,
    message: `Successfully compiled and published complete results for all ${savedReportCards.length} students.`,
  }, 'Class results compiled and published successfully');
});

// ==================== GET COMPREHENSIVE STUDENT REPORT CARD ====================
export const getStudentComprehensiveReport = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const { examId } = req.query;

  if (!studentId || !examId) {
    throw ApiError.badRequest('Student ID and Exam ID are required.');
  }

  // Student privacy check
  if (req.user?.role?.name === 'STUDENT' && req.user.studentId?.toString() !== studentId.toString()) {
    throw ApiError.forbidden('Students may only view their own examination report card.');
  }

  const [student, exam] = await Promise.all([
    Student.findById(studentId).populate('classId').populate('sectionId').populate('parentId'),
    Exam.findById(examId),
  ]);

  if (!student) throw ApiError.notFound('Student record not found');
  if (!exam) throw ApiError.notFound('Exam record not found');

  const [subjects, marks, reportCard] = await Promise.all([
    Subject.find({ classId: student.classId._id }).sort({ name: 1 }),
    Mark.find({ studentId, examId }).populate('subjectId', 'name code totalMarks'),
    ReportCard.findOne({ studentId, examId }),
  ]);

  const markMap = new Map();
  marks.forEach((m) => {
    const subId = (m.subjectId?._id || m.subjectId)?.toString();
    if (subId) markMap.set(subId, m);
  });

  let totalObtained = 0;
  let totalPossible = 0;
  let allPass = true;

  const subjectsSummary = subjects.map((subj) => {
    const subId = subj._id.toString();
    const mk = markMap.get(subId);
    const maxMarks = subj.totalMarks || 100;
    totalPossible += maxMarks;

    let marksObtained = 0;
    let grade = 'F';
    let remarks = '';
    let isAbsent = false;

    if (mk) {
      isAbsent = !!mk.isAbsent;
      marksObtained = isAbsent ? 0 : Number(mk.marksObtained);
      grade = mk.grade || calculateGrade((marksObtained / maxMarks) * 100).grade;
      remarks = mk.remarks || '';
      if (isAbsent || marksObtained < 40) allPass = false;
    } else {
      allPass = false;
      grade = '—';
    }

    totalObtained += marksObtained;

    return {
      subjectId: subj._id,
      subjectCode: subj.code || '—',
      subjectName: subj.name,
      totalMarks: maxMarks,
      marksObtained: mk ? (isAbsent ? 'ABS' : marksObtained) : '—',
      percentage: mk && !isAbsent ? Number(((marksObtained / maxMarks) * 100).toFixed(1)) : 0,
      grade,
      remarks,
      isAbsent,
      status: isAbsent ? 'Absent' : marksObtained >= 40 ? 'PASS' : 'FAIL',
    };
  });

  const percentage = totalPossible > 0 ? (totalObtained / totalPossible) * 100 : 0;
  const { grade: overallGrade, gpa } = calculateGrade(percentage);

  // Compute attendance percentage
  const totalDays = await Attendance.countDocuments({ studentId, attendanceType: 'Student' });
  const presentDays = await Attendance.countDocuments({
    studentId,
    attendanceType: 'Student',
    status: { $in: ['Present', 'Late'] },
  });
  const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 95;

  let teacherRemarks = reportCard?.teacherRemarks;
  if (!teacherRemarks) {
    if (percentage >= 90) teacherRemarks = 'Exceptional academic dedication, critical thinking, and exemplary conduct in class.';
    else if (percentage >= 80) teacherRemarks = 'Strong analytical abilities, attentive listener, and consistently submits quality work.';
    else if (percentage >= 60) teacherRemarks = 'Good understanding of fundamental concepts; encourage more active class participation.';
    else teacherRemarks = 'Needs regular revision and focused reinforcement in challenging topics.';
  }

  const result = {
    student: {
      _id: student._id,
      studentId: student.studentId,
      admissionNumber: student.admissionNumber,
      rollNumber: student.rollNumber,
      firstName: student.firstName,
      lastName: student.lastName,
      fullName: `${student.firstName} ${student.lastName}`,
      gender: student.gender,
      dateOfBirth: student.dateOfBirth,
      class: student.classId?.name,
      section: student.sectionId?.name,
      parentName: student.parentId ? `${student.parentId.fatherName || student.parentId.guardianName || 'Guardian'}` : 'Parent/Guardian',
      contactPhone: student.contact?.phone || '—',
    },
    exam: {
      _id: exam._id,
      name: exam.name,
      examType: exam.examType,
    },
    subjectsSummary,
    totalMarksPossible: totalPossible,
    totalMarksObtained: totalObtained,
    percentage: Number(percentage.toFixed(2)),
    gpa,
    overallGrade,
    passStatus: allPass && percentage >= 40 ? 'PASS' : 'FAIL',
    classRank: reportCard?.classRank || 1,
    attendancePercentage,
    teacherRemarks,
    principalRemarks: reportCard?.principalRemarks || 'Promoted with commendable effort. Keep up the high standards!',
    publishedAt: reportCard?.updatedAt || new Date(),
    reportCardId: reportCard?._id || null,
  };

  return ApiResponse.ok(res, result, 'Student comprehensive marksheet retrieved');
});

// Update Teacher Review
export const updateReportCardRemarks = asyncHandler(async (req, res) => {
  if (req.user?.role?.name === 'STUDENT') {
    throw ApiError.forbidden('Students are not authorized to update teacher remarks.');
  }

  const { id } = req.params;
  const { teacherRemarks, principalRemarks } = req.body;

  const rc = await ReportCard.findById(id);
  if (!rc) throw ApiError.notFound('Report card not found');

  if (teacherRemarks !== undefined) rc.teacherRemarks = teacherRemarks;
  if (principalRemarks !== undefined) rc.principalRemarks = principalRemarks;

  await rc.save();
  return ApiResponse.ok(res, rc, 'Report card remarks updated');
});

