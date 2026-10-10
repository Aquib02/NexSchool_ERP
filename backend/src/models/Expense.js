import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Expense title is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: [
        'Utilities',
        'Maintenance',
        'Salaries',
        'Supplies',
        'Lab Equipment',
        'Sports',
        'Transport Fuel',
        'Events',
        'IT & Software',
        'Other',
      ],
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Expense amount is required'],
      min: [0.01, 'Amount must be greater than zero'],
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'Bank Transfer', 'Cheque', 'Corporate Card', 'UPI'],
      default: 'Bank Transfer',
    },
    vendorName: {
      type: String,
      trim: true,
    },
    vendorInvoiceNumber: {
      type: String,
      trim: true,
    },
    receiptAttachment: {
      type: String,
      default: null,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Paid', 'Rejected'],
      default: 'Approved',
      index: true,
    },
    remarks: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Expense', expenseSchema);
