import mongoose from 'mongoose';

const feeComponentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true, // e.g. "Tuition Fee", "Lab Fee", "Transport Fee"
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    frequency: {
      type: String,
      enum: ['One-Time', 'Monthly', 'Quarterly', 'Half-Yearly', 'Annually'],
      default: 'Monthly',
    },
    isOptional: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true }
);

const feeStructureSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Fee structure name is required'],
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
    components: [feeComponentSchema],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    lateFinePerDay: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

feeStructureSchema.index({ classId: 1, academicSessionId: 1 });

export default mongoose.model('FeeStructure', feeStructureSchema);
