import mongoose from 'mongoose';

const assignmentSubmissionSchema = new mongoose.Schema(
  {
    homeworkId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Homework',
      required: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    submissionText: {
      type: String,
      trim: true,
    },
    attachments: [
      {
        fileName: String,
        fileUrl: String,
        fileSize: String,
      },
    ],
    submissionDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['Submitted', 'Graded', 'Late', 'Resubmission_Requested'],
      default: 'Submitted',
      index: true,
    },
    score: {
      type: Number,
      default: null,
      min: 0,
    },
    maxScore: {
      type: Number,
      default: 100,
    },
    grade: {
      type: String, // e.g., 'A+', 'B', 'Pass'
      trim: true,
    },
    teacherFeedback: {
      type: String,
      trim: true,
    },
    gradedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    gradedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// One submission per student per homework
assignmentSubmissionSchema.index({ homeworkId: 1, studentId: 1 }, { unique: true });

const AssignmentSubmission = mongoose.model('AssignmentSubmission', assignmentSubmissionSchema);
export default AssignmentSubmission;
