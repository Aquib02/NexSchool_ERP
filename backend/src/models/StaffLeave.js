import mongoose from 'mongoose';

const staffLeaveSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee reference is required'],
      index: true,
    },
    leaveType: {
      type: String,
      enum: ['Casual', 'Sick', 'Earned', 'Maternity', 'Paternity', 'Unpaid'],
      required: [true, 'Leave type is required'],
    },
    startDate: {
      type: Date,
      required: [true, 'Leave start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'Leave end date is required'],
    },
    totalDays: {
      type: Number,
      required: [true, 'Total number of days is required'],
      min: [0.5, 'Minimum leave is 0.5 days'],
    },
    reason: {
      type: String,
      required: [true, 'Reason for leave is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected', 'Cancelled'],
      default: 'Pending',
      index: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
    },
    reviewRemarks: {
      type: String,
      trim: true,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

staffLeaveSchema.index({ employeeId: 1, startDate: 1, endDate: 1 });

export default mongoose.model('StaffLeave', staffLeaveSchema);
