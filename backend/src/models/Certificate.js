import mongoose from 'mongoose';

const certificateSchema = new mongoose.Schema(
  {
    certificateNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    certificateType: {
      type: String,
      enum: [
        'TRANSFER_CERTIFICATE',
        'BONAFIDE_CERTIFICATE',
        'CHARACTER_CERTIFICATE',
        'MERIT_CERTIFICATE',
        'FEE_CLEARANCE_CERTIFICATE',
      ],
      required: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    studentName: {
      type: String,
      required: true,
      trim: true,
    },
    admissionNumber: {
      type: String,
      trim: true,
    },
    academicSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicSession',
      default: null,
    },
    issueDate: {
      type: Date,
      default: Date.now,
    },
    details: {
      className: String,
      sectionName: String,
      conduct: {
        type: String,
        default: 'Exemplary',
      },
      reasonForLeaving: {
        type: String,
        default: 'Relocation / Course Completion',
      },
      dateOfAdmission: Date,
      dateOfLeaving: Date,
      feeStatus: {
        type: String,
        default: 'All Dues Cleared',
      },
      customRemarks: String,
    },
    verificationHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    qrCodeString: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['Active', 'Revoked', 'Draft'],
      default: 'Active',
      index: true,
    },
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

const Certificate = mongoose.model('Certificate', certificateSchema);
export default Certificate;
