import mongoose from 'mongoose';

const homeworkSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Homework title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Homework description is required'],
      trim: true,
    },
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
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
      index: true,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    assignedDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    maxMarks: {
      type: Number,
      default: 10,
    },
    attachments: [
      {
        title: { type: String, trim: true },
        fileUrl: { type: String, required: true },
      },
    ],
    // Embed student submissions
    submissions: [
      {
        studentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Student',
          required: true,
        },
        submittedAt: {
          type: Date,
          default: Date.now,
        },
        fileUrl: {
          type: String,
        },
        content: {
          type: String,
          trim: true,
        },
        status: {
          type: String,
          enum: ['Submitted', 'Graded', 'Late', 'Resubmission Requested'],
          default: 'Submitted',
        },
        marksAwarded: {
          type: Number,
        },
        teacherFeedback: {
          type: String,
          trim: true,
        },
      },
    ],
  },
  { timestamps: true }
);

homeworkSchema.index({ classId: 1, sectionId: 1, dueDate: -1 });

export default mongoose.model('Homework', homeworkSchema);
