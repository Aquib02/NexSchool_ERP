import mongoose from 'mongoose';

const examScheduleItemSchema = new mongoose.Schema(
  {
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SchoolClass',
      required: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
    },
    examDate: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    totalMarks: {
      type: Number,
      required: true,
      default: 100,
    },
    passingMarks: {
      type: Number,
      required: true,
      default: 40,
    },
    roomNumber: {
      type: String,
      trim: true,
    },
  },
  { _id: true }
);

const examSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Exam name is required (e.g. First Term Examination 2026)'],
      trim: true,
    },
    examType: {
      type: String,
      enum: ['Unit Test', 'Quarterly', 'Mid-Term', 'Final', 'Practical', 'Mock Exam'],
      required: true,
    },
    academicSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicSession',
      required: true,
      index: true,
    },
    classes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SchoolClass',
      },
    ],
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    schedule: [examScheduleItemSchema],
    status: {
      type: String,
      enum: ['Draft', 'Scheduled', 'Ongoing', 'Completed', 'Results Published', 'Cancelled'],
      default: 'Draft',
    },
  },
  { timestamps: true }
);

export default mongoose.model('Exam', examSchema);
