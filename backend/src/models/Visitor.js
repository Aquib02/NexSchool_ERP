import mongoose from 'mongoose';

const visitorSchema = new mongoose.Schema(
  {
    passNumber: {
      type: String,
      required: [true, 'Visitor pass number is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    visitorName: {
      type: String,
      required: [true, 'Visitor name is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      index: true,
    },
    idProofType: {
      type: String,
      enum: ['National ID / Aadhaar', 'Driver License', 'Passport', 'Voter ID', 'Employee Badge', 'Other'],
      default: 'National ID / Aadhaar',
    },
    idProofNumber: {
      type: String,
      trim: true,
    },
    purpose: {
      type: String,
      required: [true, 'Purpose of visit is required'],
      trim: true,
    },
    visitingType: {
      type: String,
      enum: ['Employee', 'Student', 'General Administration'],
      default: 'Employee',
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      default: null,
    },
    vehicleNumber: {
      type: String,
      trim: true,
      uppercase: true,
    },
    entryTime: {
      type: Date,
      default: Date.now,
      index: true,
    },
    exitTime: {
      type: Date,
      default: null,
    },
    gateNumber: {
      type: String,
      default: 'Gate 1',
    },
    securityGuardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['Inside Campus', 'Exited', 'Banned'],
      default: 'Inside Campus',
      index: true,
    },
    photoUrl: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Visitor', visitorSchema);
