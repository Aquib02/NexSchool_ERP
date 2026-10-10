import mongoose from 'mongoose';

const payrollSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee reference is required'],
      index: true,
    },
    month: {
      type: Number,
      required: [true, 'Payroll month (1-12) is required'],
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: [true, 'Payroll year is required'],
    },
    basicSalary: {
      type: Number,
      required: true,
      min: 0,
    },
    totalAllowances: {
      type: Number,
      default: 0,
      min: 0,
    },
    allowanceBreakdown: [
      {
        name: { type: String, trim: true },
        amount: { type: Number, default: 0 },
      },
    ],
    totalDeductions: {
      type: Number,
      default: 0,
      min: 0,
    },
    deductionBreakdown: [
      {
        name: { type: String, trim: true },
        amount: { type: Number, default: 0 },
      },
    ],
    netSalary: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['Draft', 'Processed', 'Paid', 'Hold'],
      default: 'Draft',
      index: true,
    },
    paymentDate: {
      type: Date,
      default: null,
    },
    paymentMethod: {
      type: String,
      enum: ['Bank Transfer', 'Cheque', 'Cash', 'Unpaid'],
      default: 'Unpaid',
    },
    transactionReference: {
      type: String,
      trim: true,
    },
    payslipNumber: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    payslipPdfUrl: {
      type: String,
      default: null,
    },
    remarks: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// One payroll record per employee per month & year
payrollSchema.index({ employeeId: 1, month: 1, year: 1 }, { unique: true });

export default mongoose.model('Payroll', payrollSchema);
