import mongoose from 'mongoose';

const admissionEnquirySchema = new mongoose.Schema(
  {
    enquiryNumber: {
      type: String,
      required: [true, 'Enquiry number is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    candidateName: {
      type: String,
      required: [true, 'Candidate name is required'],
      trim: true,
    },
    parentName: {
      type: String,
      required: [true, 'Parent/Guardian name is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      index: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    targetClassId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SchoolClass',
      required: true,
      index: true,
    },
    academicSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicSession',
      required: true,
      index: true,
    },
    source: {
      type: String,
      enum: ['Walk-in', 'Online', 'Referral', 'Phone Call', 'Social Media', 'Advertisement'],
      default: 'Walk-in',
    },
    status: {
      type: String,
      enum: ['Open', 'Contacted', 'Application Submitted', 'Closed - Enrolled', 'Closed - Not Interested'],
      default: 'Open',
      index: true,
    },
    followUpDate: {
      type: Date,
      index: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    handledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model('AdmissionEnquiry', admissionEnquirySchema);
