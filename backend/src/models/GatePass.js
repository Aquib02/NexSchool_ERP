import mongoose from 'mongoose';

const gatePassSchema = new mongoose.Schema(
  {
    passNumber: {
      type: String,
      required: [true, 'Gate pass number is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    passType: {
      type: String,
      enum: ['Student Early Exit', 'Staff Departure', 'Visitor Clearance'],
      required: true,
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
    reason: {
      type: String,
      required: [true, 'Reason for gate pass is required'],
      trim: true,
    },
    authorizedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    accompaniedByName: {
      type: String,
      trim: true, // e.g. Parent or Guardian picking up student early
    },
    accompaniedByPhone: {
      type: String,
      trim: true,
    },
    accompaniedByIdVerified: {
      type: Boolean,
      default: false,
    },
    departureTime: {
      type: Date,
      default: Date.now,
      index: true,
    },
    gateNumber: {
      type: String,
      default: 'Main Gate',
    },
    securityGuardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['Authorized', 'Departed', 'Cancelled'],
      default: 'Authorized',
    },
  },
  { timestamps: true }
);

export default mongoose.model('GatePass', gatePassSchema);
