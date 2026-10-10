import mongoose from 'mongoose';

const medicalRecordSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student reference is required'],
      unique: true, // Exactly one medical health record per student
      index: true,
    },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'],
      default: 'Unknown',
    },
    heightCm: {
      type: Number,
      min: 30,
      max: 250,
    },
    weightKg: {
      type: Number,
      min: 5,
      max: 200,
    },
    allergies: [
      {
        allergen: { type: String, required: true, trim: true },
        severity: { type: String, enum: ['Mild', 'Moderate', 'Severe', 'Critical'], default: 'Moderate' },
        reaction: { type: String, trim: true },
      },
    ],
    chronicConditions: [
      {
        type: String,
        trim: true,
      },
    ],
    regularMedications: [
      {
        medicineName: { type: String, trim: true },
        dosage: { type: String, trim: true },
        timing: { type: String, trim: true },
      },
    ],
    immunizations: [
      {
        vaccineName: { type: String, trim: true },
        dateAdministered: { type: Date },
      },
    ],
    vision: {
      leftEye: { type: String, default: '6/6' },
      rightEye: { type: String, default: '6/6' },
    },
    emergencyHospital: {
      hospitalName: { type: String, trim: true },
      phone: { type: String, trim: true },
      address: { type: String, trim: true },
    },
    familyPhysician: {
      doctorName: { type: String, trim: true },
      phone: { type: String, trim: true },
    },
  },
  { timestamps: true }
);

export default mongoose.model('MedicalRecord', medicalRecordSchema);
