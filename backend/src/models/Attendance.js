import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    attendanceType: {
      type: String,
      enum: ['Student', 'Staff'],
      required: true,
      default: 'Student',
      index: true,
    },
    // For Students
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      default: null,
      index: true,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SchoolClass',
      default: null,
      index: true,
    },
    sectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Section',
      default: null,
      index: true,
    },
    // For Staff
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
      index: true,
    },
    academicSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicSession',
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: [true, 'Attendance date is required'],
      index: true,
    },
    status: {
      type: String,
      enum: ['Present', 'Absent', 'Late', 'Half-Day', 'Excused Leave'],
      required: true,
      default: 'Present',
    },
    checkInTime: {
      type: String, // e.g. "08:15 AM"
    },
    checkOutTime: {
      type: String, // e.g. "03:30 PM"
    },
    remarks: {
      type: String,
      trim: true,
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// Prevent duplicate student daily attendance
attendanceSchema.index(
  { studentId: 1, date: 1 },
  {
    unique: true,
    partialFilterExpression: { attendanceType: 'Student', studentId: { $exists: true } },
  }
);

// Prevent duplicate staff daily attendance
attendanceSchema.index(
  { employeeId: 1, date: 1 },
  {
    unique: true,
    partialFilterExpression: { attendanceType: 'Staff', employeeId: { $exists: true } },
  }
);

// Fast search for class daily register
attendanceSchema.index({ classId: 1, sectionId: 1, date: 1 });

export default mongoose.model('Attendance', attendanceSchema);
