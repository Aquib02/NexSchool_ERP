import mongoose from 'mongoose';

const admissionApplicationSchema = new mongoose.Schema(
  {
    applicationNumber: {
      type: String,
      required: [true, 'Application number is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    enquiryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdmissionEnquiry',
      default: null,
    },
    academicSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicSession',
      required: true,
      index: true,
    },
    targetClassId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SchoolClass',
      required: true,
      index: true,
    },
    candidate: {
      firstName: { type: String, required: true, trim: true },
      lastName: { type: String, required: true, trim: true },
      dateOfBirth: { type: Date, required: true },
      gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
      bloodGroup: { type: String, default: 'Unknown' },
    },
    parentDetails: {
      fatherName: { type: String, trim: true },
      fatherPhone: { type: String, trim: true },
      fatherEmail: { type: String, trim: true },
      fatherOccupation: { type: String, trim: true },
      motherName: { type: String, trim: true },
      motherPhone: { type: String, trim: true },
      motherEmail: { type: String, trim: true },
      primaryPhone: { type: String, required: true },
      address: {
        street: { type: String, trim: true },
        city: { type: String, trim: true },
        state: { type: String, trim: true },
        postalCode: { type: String, trim: true },
        country: { type: String, default: 'India' },
      },
    },
    previousSchool: {
      name: { type: String, trim: true },
      lastClass: { type: String, trim: true },
      percentage: { type: Number },
    },
    entranceTest: {
      scheduledDate: { type: Date },
      totalMarks: { type: Number, default: 100 },
      marksObtained: { type: Number },
      isPassed: { type: Boolean, default: null },
      remarks: { type: String, trim: true },
    },
    status: {
      type: String,
      enum: [
        'Submitted',
        'Under Review',
        'Test Scheduled',
        'Selected',
        'Approved',
        'Rejected',
        'Converted to Student',
      ],
      default: 'Submitted',
      index: true,
    },
    approvalDetails: {
      approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      approvedAt: { type: Date },
      assignedAdmissionNumber: { type: String, trim: true },
    },
    // The central student profile created after approval
    convertedStudentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model('AdmissionApplication', admissionApplicationSchema);
