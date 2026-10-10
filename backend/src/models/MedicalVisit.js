import mongoose from 'mongoose';

const medicalVisitSchema = new mongoose.Schema(
  {
    visitNumber: {
      type: String,
      required: [true, 'Visit number is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    patronType: {
      type: String,
      enum: ['Student', 'Staff'],
      required: true,
      default: 'Student',
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
    visitDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    symptoms: {
      type: String,
      required: [true, 'Symptoms are required'],
      trim: true,
    },
    diagnosis: {
      type: String,
      trim: true,
    },
    treatmentGiven: {
      type: String,
      required: [true, 'Treatment description is required'],
      trim: true,
    },
    medicinesAdministered: [
      {
        medicineName: { type: String, required: true },
        quantity: { type: Number, required: true, default: 1 },
      },
    ],
    temperatureCelsius: {
      type: Number,
    },
    bloodPressure: {
      type: String,
      trim: true,
    },
    nurseInCharge: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    parentNotified: {
      type: Boolean,
      default: false,
    },
    referredToHospital: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['Under Observation', 'Discharged', 'Referred Out'],
      default: 'Discharged',
    },
  },
  { timestamps: true }
);

medicalVisitSchema.index({ studentId: 1, visitDate: -1 });

export default mongoose.model('MedicalVisit', medicalVisitSchema);
