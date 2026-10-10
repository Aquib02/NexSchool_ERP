import mongoose from 'mongoose';

const academicSessionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Session name is required (e.g. 2025-2026)'],
      unique: true,
      trim: true,
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    isCurrent: {
      type: Boolean,
      default: false,
      index: true,
    },
    status: {
      type: String,
      enum: ['upcoming', 'active', 'completed'],
      default: 'upcoming',
    },
  },
  { timestamps: true }
);

// Ensure only one session is marked as current at a time
academicSessionSchema.pre('save', async function () {
  if (this.isCurrent) {
    await this.constructor.updateMany(
      { _id: { $ne: this._id } },
      { $set: { isCurrent: false } }
    );
  }
});

export default mongoose.model('AcademicSession', academicSessionSchema);
