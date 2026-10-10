import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      required: [true, 'Student ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    admissionNumber: {
      type: String,
      required: [true, 'Admission number is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    dateOfBirth: {
      type: Date,
      required: [true, 'Date of birth is required'],
    },
    gender: {
      type: String,
      required: [true, 'Gender is required'],
      enum: ['Male', 'Female', 'Other'],
    },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'],
      default: 'Unknown',
    },
    // Academic placement
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SchoolClass',
      required: [true, 'Class assignment is required'],
      index: true,
    },
    sectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Section',
      required: [true, 'Section assignment is required'],
      index: true,
    },
    rollNumber: {
      type: Number,
      required: [true, 'Roll number is required'],
    },
    academicSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicSession',
      required: [true, 'Academic session reference is required'],
      index: true,
    },
    photo: {
      type: String,
      default: null, // Cloudinary or S3 secure URL
    },
    contact: {
      phone: { type: String, trim: true },
      email: { type: String, trim: true, lowercase: true },
    },
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      postalCode: { type: String, trim: true },
      country: { type: String, trim: true, default: 'India' },
    },
    // Single parent profile linkage
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Parent',
      required: [true, 'Parent/Guardian profile reference is required'],
      index: true,
    },
    previousSchool: {
      schoolName: { type: String, trim: true },
      classPassed: { type: String, trim: true },
      yearOfPassing: { type: Number },
      tcNumber: { type: String, trim: true },
    },
    admissionDetails: {
      admissionDate: { type: Date, default: Date.now },
      applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'AdmissionApplication', default: null },
      category: { type: String, default: 'General' },
      remarks: { type: String, trim: true },
    },
    emergencyContact: {
      name: { type: String, trim: true, required: true },
      relationship: { type: String, trim: true, required: true },
      phone: { type: String, trim: true, required: true },
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'Transferred', 'Graduated', 'Withdrawn'],
      default: 'Active',
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for full name
studentSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual compatibility aliases for currentClass and currentSection
studentSchema.virtual('currentClass', {
  ref: 'SchoolClass',
  localField: 'classId',
  foreignField: '_id',
  justOne: true,
});

studentSchema.virtual('currentSection', {
  ref: 'Section',
  localField: 'sectionId',
  foreignField: '_id',
  justOne: true,
});

// Prevent duplicate roll numbers inside the same section and academic session
studentSchema.index(
  { classId: 1, sectionId: 1, rollNumber: 1, academicSessionId: 1 },
  { unique: true, partialFilterExpression: { status: 'Active' } }
);

// Text index for fast multi-field search
studentSchema.index({
  firstName: 'text',
  lastName: 'text',
  studentId: 'text',
  admissionNumber: 'text',
});

export default mongoose.model('Student', studentSchema);
