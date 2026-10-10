import mongoose from 'mongoose';

const parentSchema = new mongoose.Schema(
  {
    parentId: {
      type: String,
      required: [true, 'Parent ID is required'],
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
    // Primary Father / Guardian
    fatherName: {
      type: String,
      trim: true,
    },
    fatherPhone: {
      type: String,
      trim: true,
    },
    fatherEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    fatherOccupation: {
      type: String,
      trim: true,
    },
    // Mother Details
    motherName: {
      type: String,
      trim: true,
    },
    motherPhone: {
      type: String,
      trim: true,
    },
    motherEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    motherOccupation: {
      type: String,
      trim: true,
    },
    // Guardian (if applicable)
    guardianName: {
      type: String,
      trim: true,
    },
    guardianRelation: {
      type: String,
      trim: true,
    },
    guardianPhone: {
      type: String,
      trim: true,
    },
    guardianEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    guardianOccupation: {
      type: String,
      trim: true,
    },
    // General contact
    primaryContactNumber: {
      type: String,
      required: [true, 'Primary contact number is required'],
      trim: true,
      index: true,
    },
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      postalCode: { type: String, trim: true },
      country: { type: String, trim: true, default: 'India' },
    },
    // Associated children (enables one parent to have multiple student accounts)
    studentIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Parent', parentSchema);
