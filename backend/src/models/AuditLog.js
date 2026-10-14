import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      index: true,
    },
    actorName: {
      type: String,
      required: true,
      default: 'System',
    },
    actorEmail: {
      type: String,
      trim: true,
      default: '',
    },
    actorRole: {
      type: String,
      required: true,
      default: 'SYSTEM',
      index: true,
    },
    action: {
      type: String,
      required: true, // e.g., 'STUDENT_CREATE', 'FEE_PAYMENT_COLLECTED', 'ATTENDANCE_MODIFIED'
      index: true,
    },
    resource: {
      type: String,
      required: true, // e.g., 'Student', 'StudentFee', 'Attendance'
      index: true,
    },
    resourceId: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
      index: true,
    },
    description: {
      type: String,
      default: '',
    },
    ipAddress: {
      type: String,
      trim: true,
    },
    userAgent: {
      type: String,
      trim: true,
    },
    diff: {
      before: { type: mongoose.Schema.Types.Mixed },
      after: { type: mongoose.Schema.Types.Mixed },
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
    },
    status: {
      type: String,
      enum: ['SUCCESS', 'FAILURE'],
      default: 'SUCCESS',
      index: true,
    },
    failureReason: {
      type: String,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Audit logs are immutable records
  }
);

// Prevent modifications or deletions at schema layer
auditLogSchema.pre(['updateOne', 'updateMany', 'findOneAndUpdate', 'findOneAndReplace'], function () {
  throw new Error('AuditLog records are strictly immutable and cannot be updated.');
});

auditLogSchema.index({ createdAt: -1 });

export default mongoose.model('AuditLog', auditLogSchema);
