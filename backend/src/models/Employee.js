import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: [true, 'Employee ID is required'],
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
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    gender: {
      type: String,
      required: [true, 'Gender is required'],
      enum: ['Male', 'Female', 'Other'],
    },
    dateOfBirth: {
      type: Date,
    },
    age: {
      type: Number,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department is required'],
      index: true,
    },
    designationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Designation',
      required: [true, 'Designation is required'],
      index: true,
    },
    joiningDate: {
      type: Date,
      required: [true, 'Joining date is required'],
    },
    qualification: {
      type: String,
      trim: true,
    },
    experienceYears: {
      type: Number,
      default: 0,
    },
    employmentType: {
      type: String,
      enum: ['Full-Time', 'Part-Time', 'Contract', 'Probation'],
      default: 'Full-Time',
    },
    salaryStructure: {
      basicSalary: { type: Number, default: 0 },
      allowances: [
        {
          name: { type: String, trim: true },
          amount: { type: Number, default: 0 },
        },
      ],
      deductions: [
        {
          name: { type: String, trim: true },
          amount: { type: Number, default: 0 },
        },
      ],
    },
    bankDetails: {
      accountHolderName: { type: String, trim: true },
      accountNumber: { type: String, trim: true },
      bankName: { type: String, trim: true },
      ifscCode: { type: String, trim: true, uppercase: true },
      branch: { type: String, trim: true },
    },
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      postalCode: { type: String, trim: true },
      country: { type: String, trim: true, default: 'India' },
    },
    emergencyContact: {
      name: { type: String, trim: true },
      relationship: { type: String, trim: true },
      phone: { type: String, trim: true },
    },
    photo: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['Active', 'On Leave', 'Suspended', 'Terminated', 'Resigned'],
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

employeeSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

employeeSchema.index({ firstName: 'text', lastName: 'text', employeeId: 'text', email: 'text' });

export default mongoose.model('Employee', employeeSchema);
