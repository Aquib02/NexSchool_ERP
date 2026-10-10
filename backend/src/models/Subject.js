import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Subject name is required'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Subject code is required (e.g. MTH-101)'],
      trim: true,
      uppercase: true,
    },
    type: {
      type: String,
      enum: ['Core', 'Elective', 'Practical', 'Vocational', 'Language'],
      default: 'Core',
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SchoolClass',
      required: [true, 'Class reference is required'],
      index: true,
    },
    totalMarks: {
      type: Number,
      default: 100,
    },
    passMarks: {
      type: Number,
      default: 40,
    },
    assignedTeacherIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

subjectSchema.index({ code: 1, classId: 1 }, { unique: true });

export default mongoose.model('Subject', subjectSchema);
