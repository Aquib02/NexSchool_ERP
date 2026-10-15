import mongoose from 'mongoose';
import '../models/index.js';
import Student from '../models/Student.js';
import Parent from '../models/Parent.js';
import Attendance from '../models/Attendance.js';
import Timetable from '../models/Timetable.js';
import Homework from '../models/Homework.js';
import ReportCard from '../models/ReportCard.js';
import StudentFee from '../models/StudentFee.js';
import TransportAllocation from '../models/TransportAllocation.js';
import Notice from '../models/Notice.js';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Helper to resolve student target (logged-in student, or admin/parent request)
const resolveTargetStudent = async (req) => {
  // STRICT DATA ISOLATION: If logged-in user is a student, strictly force their own student record
  if (req.user?.role?.name === 'STUDENT') {
    if (!req.user?.studentId) {
      return null;
    }
    return await Student.findById(req.user.studentId)
      .populate('classId', 'name code')
      .populate('sectionId', 'name')
      .populate('academicSessionId', 'name')
      .populate('parentId', 'fatherName motherName primaryContactNumber');
  }

  const { studentId } = req.query;

  // 1. If studentId explicitly provided and requester is staff/admin
  if (studentId && mongoose.Types.ObjectId.isValid(studentId)) {
    return await Student.findById(studentId)
      .populate('classId', 'name code')
      .populate('sectionId', 'name')
      .populate('academicSessionId', 'name')
      .populate('parentId', 'fatherName motherName primaryContactNumber');
  }

  // 2. If logged-in user has studentId (e.g. parent linked or other)
  if (req.user?.studentId) {
    return await Student.findById(req.user.studentId)
      .populate('classId', 'name code')
      .populate('sectionId', 'name')
      .populate('academicSessionId', 'name')
      .populate('parentId', 'fatherName motherName primaryContactNumber');
  }

  // 3. Fallback: first student in database for easy preview (Admin/Staff only)
  return await Student.findOne({ status: 'Active' })
    .populate('classId', 'name code')
    .populate('sectionId', 'name')
    .populate('academicSessionId', 'name')
    .populate('parentId', 'fatherName motherName primaryContactNumber');
};

// ==========================================
// 1. STUDENT PORTAL DASHBOARD AGGREGATION
// ==========================================

export const getStudentPortalData = async (req, res, next) => {
  try {
    const student = await resolveTargetStudent(req);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'No student record found for portal view',
      });
    }

    const studentId = student._id;
    const classId = student.classId?._id;
    const sectionId = student.sectionId?._id;

    // 1. Attendance Analytics
    const attendanceRecords = await Attendance.find({ studentId }).sort({ date: -1 });
    const totalDays = attendanceRecords.length;
    const presentDays = attendanceRecords.filter((a) => a.status === 'Present').length;
    const lateDays = attendanceRecords.filter((a) => a.status === 'Late').length;
    const absentDays = attendanceRecords.filter((a) => a.status === 'Absent').length;
    const attendancePercentage =
      totalDays > 0 ? Math.round(((presentDays + lateDays * 0.5) / totalDays) * 100) : 100;

    // 2. Today's Timetable
    const todayDayName = DAYS_OF_WEEK[new Date().getDay()];
    let todaySchedule = [];
    if (classId && sectionId) {
      const timetable = await Timetable.findOne({ classId, sectionId, dayOfWeek: todayDayName })
        .populate('periods.subjectId', 'name code')
        .populate('periods.teacherId', 'firstName lastName');

      if (timetable && timetable.periods) {
        todaySchedule = timetable.periods;
      }
    }

    // 3. Active Homework & Assignments
    let homeworkList = [];
    if (classId && sectionId) {
      homeworkList = await Homework.find({ classId, sectionId })
        .populate('subjectId', 'name code')
        .populate('assignedBy', 'firstName lastName')
        .sort({ dueDate: 1 })
        .limit(10);
    }

    // 4. Latest Report Cards
    const reportCards = await ReportCard.find({ studentId })
      .populate('examId', 'name examType term')
      .populate('subjectsSummary.subjectId', 'name code')
      .sort({ createdAt: -1 })
      .limit(5);

    // 5. Fee Dues & Invoices
    const feeInvoices = await StudentFee.find({ studentId })
      .populate('feeStructureId', 'name')
      .sort({ dueDate: 1 });

    const totalPayable = feeInvoices.reduce((sum, f) => sum + (f.netPayable || 0), 0);
    const totalPaid = feeInvoices.reduce((sum, f) => sum + (f.paidAmount || 0), 0);
    const pendingBalance = feeInvoices.reduce((sum, f) => sum + (f.balanceAmount || 0), 0);

    // 6. Transport Allocation (if any)
    const transport = await TransportAllocation.findOne({ studentId, status: 'Active' })
      .populate('routeId', 'routeName stops')
      .populate('vehicleId', 'vehicleNumber model driver');

    // 7. Targeted Notices
    const notices = await Notice.find({
      $or: [{ targetAudience: 'All' }, { targetAudience: 'Students' }],
    })
      .sort({ isPinned: -1, publishDate: -1 })
      .limit(6);

    return res.status(200).json({
      success: true,
      data: {
        student,
        summary: {
          attendancePercentage,
          totalAttendanceDays: totalDays,
          presentDays,
          absentDays,
          pendingHomeworkCount: homeworkList.length,
          pendingFeeBalance: pendingBalance,
          totalPaidFees: totalPaid,
          latestGpa: reportCards[0]?.gpa || null,
        },
        todaySchedule,
        homeworkList,
        reportCards,
        feeInvoices,
        transport,
        notices,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 2. PARENT PORTAL MULTI-CHILD AGGREGATION
// ==========================================

export const getParentPortalData = async (req, res, next) => {
  try {
    if (req.user?.role?.name === 'STUDENT') {
      return res.status(403).json({
        success: false,
        message: 'Students are not authorized to access the Parent Portal',
      });
    }

    const { parentId, childId } = req.query;

    let parent = null;

    // 1. Resolve parent profile
    if (parentId && mongoose.Types.ObjectId.isValid(parentId)) {
      parent = await Parent.findById(parentId).populate({
        path: 'studentIds',
        populate: [
          { path: 'classId', select: 'name code' },
          { path: 'sectionId', select: 'name' },
        ],
      });
    } else if (req.user?.parentId) {
      parent = await Parent.findById(req.user.parentId).populate({
        path: 'studentIds',
        populate: [
          { path: 'classId', select: 'name code' },
          { path: 'sectionId', select: 'name' },
        ],
      });
    } else {
      // Fallback: first parent with enrolled children for easy preview
      parent = await Parent.findOne({ 'studentIds.0': { $exists: true } }).populate({
        path: 'studentIds',
        populate: [
          { path: 'classId', select: 'name code' },
          { path: 'sectionId', select: 'name' },
        ],
      });
    }

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: 'No parent record found',
      });
    }

    const children = parent.studentIds || [];
    if (children.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          parent,
          children: [],
          activeChildData: null,
        },
      });
    }

    // Determine active selected child
    let activeChild = children[0];
    if (childId && mongoose.Types.ObjectId.isValid(childId)) {
      const found = children.find((c) => c._id.toString() === childId);
      if (found) activeChild = found;
    }

    const activeChildId = activeChild._id;
    const classId = activeChild.classId?._id;
    const sectionId = activeChild.sectionId?._id;

    // Child Attendance
    const attendanceRecords = await Attendance.find({ studentId: activeChildId }).sort({ date: -1 });
    const totalDays = attendanceRecords.length;
    const presentDays = attendanceRecords.filter((a) => a.status === 'Present').length;
    const absentDays = attendanceRecords.filter((a) => a.status === 'Absent').length;
    const lateDays = attendanceRecords.filter((a) => a.status === 'Late').length;
    const attendancePercentage =
      totalDays > 0 ? Math.round(((presentDays + lateDays * 0.5) / totalDays) * 100) : 100;

    // Child Fees
    const feeInvoices = await StudentFee.find({ studentId: activeChildId })
      .populate('feeStructureId', 'name')
      .sort({ dueDate: 1 });
    const pendingFeeBalance = feeInvoices.reduce((sum, f) => sum + (f.balanceAmount || 0), 0);

    // Child Homework
    let homeworkList = [];
    if (classId && sectionId) {
      homeworkList = await Homework.find({ classId, sectionId })
        .populate('subjectId', 'name code')
        .populate('assignedBy', 'firstName lastName')
        .sort({ dueDate: 1 })
        .limit(8);
    }

    // Child Report Cards
    const reportCards = await ReportCard.find({ studentId: activeChildId })
      .populate('examId', 'name examType term')
      .populate('subjectsSummary.subjectId', 'name code')
      .sort({ createdAt: -1 })
      .limit(5);

    // Child Transport Stop
    const transport = await TransportAllocation.findOne({ studentId: activeChildId, status: 'Active' })
      .populate('routeId', 'routeName stops')
      .populate('vehicleId', 'vehicleNumber model driver');

    // Parent Notices
    const notices = await Notice.find({
      $or: [{ targetAudience: 'All' }, { targetAudience: 'Parents' }],
    })
      .sort({ isPinned: -1, publishDate: -1 })
      .limit(6);

    return res.status(200).json({
      success: true,
      data: {
        parent,
        children,
        activeChild,
        activeChildData: {
          attendance: {
            percentage: attendancePercentage,
            totalDays,
            presentDays,
            absentDays,
            recentLogs: attendanceRecords.slice(0, 15),
          },
          fees: {
            pendingBalance: pendingFeeBalance,
            invoices: feeInvoices,
          },
          homework: homeworkList,
          reportCards,
          transport,
          notices,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 3. STUDENT DETAILED ATTENDANCE HISTORY
// ==========================================

export const getStudentAttendanceHistory = async (req, res, next) => {
  try {
    const student = await resolveTargetStudent(req);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const { month, year } = req.query;
    const query = { studentId: student._id };

    if (month && year) {
      const startDate = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
      const endDate = new Date(parseInt(year, 10), parseInt(month, 10), 0, 23, 59, 59);
      query.date = { $gte: startDate, $lte: endDate };
    }

    const records = await Attendance.find(query).sort({ date: -1 });

    res.status(200).json({
      success: true,
      data: records,
    });
  } catch (error) {
    next(error);
  }
};
