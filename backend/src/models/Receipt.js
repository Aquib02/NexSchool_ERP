import mongoose from 'mongoose';

const receiptSchema = new mongoose.Schema(
  {
    receiptNumber: {
      type: String,
      required: [true, 'Receipt number is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      required: true,
      unique: true,
    },
    studentFeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudentFee',
      required: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    amountPaid: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      required: true,
    },
    receiptDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    pdfUrl: {
      type: String,
      default: null,
    },
    // Snapshot preserves immutable historical details even if student or school records change
    snapshot: {
      schoolName: { type: String, default: 'Global International School' },
      studentName: { type: String, required: true },
      studentId: { type: String, required: true },
      admissionNumber: { type: String, required: true },
      className: { type: String, required: true },
      sectionName: { type: String, required: true },
      parentName: { type: String },
      invoiceNumber: { type: String, required: true },
      balanceRemaining: { type: Number, required: true },
    },
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Receipt', receiptSchema);
