import mongoose from 'mongoose';

const atRiskStudentSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      unique: true,
      index: true,
    },
    riskLevel: {
      type: String,
      enum: ['Critical', 'Moderate', 'Low', 'Safe'],
      required: true,
      default: 'Safe',
      index: true,
    },
    riskScore: {
      type: Number, // 0 to 100 (higher means higher risk)
      required: true,
      default: 0,
    },
    attendanceRate: {
      type: Number, // e.g. 68%
      default: 100,
    },
    academicAverageScore: {
      type: Number, // e.g. 52%
      default: 100,
    },
    pendingHomeworkCount: {
      type: Number,
      default: 0,
    },
    identifiedFactors: [
      {
        factor: String, // e.g. "Attendance below 75%", "Failing Science exam"
        severity: String, // 'High', 'Medium', 'Low'
      },
    ],
    recommendedInterventions: [
      {
        type: String,
        trim: true,
      },
    ],
    lastEvaluatedAt: {
      type: Date,
      default: Date.now,
    },
    counselingStatus: {
      type: String,
      enum: ['Not_Required', 'Scheduled', 'In_Progress', 'Resolved'],
      default: 'Not_Required',
    },
    counselingNotes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

const AtRiskStudent = mongoose.model('AtRiskStudent', atRiskStudentSchema);
export default AtRiskStudent;
