import mongoose from 'mongoose';

const periodSchema = new mongoose.Schema(
  {
    periodNumber: {
      type: Number,
      required: true,
    },
    startTime: {
      type: String,
      required: true, // "08:30"
    },
    endTime: {
      type: String,
      required: true, // "09:15"
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      default: null,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
    },
    roomNumber: {
      type: String,
      trim: true,
    },
    isBreak: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true }
);

const timetableSchema = new mongoose.Schema(
  {
    academicSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicSession',
      required: true,
      index: true,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SchoolClass',
      required: true,
      index: true,
    },
    sectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Section',
      required: true,
      index: true,
    },
    dayOfWeek: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      required: true,
    },
    periods: [periodSchema],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// One timetable per class, section, day, and session
timetableSchema.index(
  { classId: 1, sectionId: 1, dayOfWeek: 1, academicSessionId: 1 },
  { unique: true }
);

export default mongoose.model('Timetable', timetableSchema);
