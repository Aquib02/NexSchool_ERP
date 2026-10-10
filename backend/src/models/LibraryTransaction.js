import mongoose from 'mongoose';

const libraryTransactionSchema = new mongoose.Schema(
  {
    transactionNumber: {
      type: String,
      required: [true, 'Transaction number is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: [true, 'Book reference is required'],
      index: true,
    },
    patronType: {
      type: String,
      enum: ['Student', 'Staff'],
      required: true,
      default: 'Student',
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      default: null,
      index: true,
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
      index: true,
    },
    issueDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
      index: true,
    },
    returnDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['Issued', 'Returned', 'Overdue', 'Lost', 'Damaged'],
      default: 'Issued',
      index: true,
    },
    fineAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    finePaid: {
      type: Boolean,
      default: false,
    },
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    remarks: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Optimize lookups for patron loan histories and pending returns
libraryTransactionSchema.index({ studentId: 1, status: 1 });
libraryTransactionSchema.index({ employeeId: 1, status: 1 });
libraryTransactionSchema.index({ dueDate: 1, status: 1 });

export default mongoose.model('LibraryTransaction', libraryTransactionSchema);
