import mongoose from 'mongoose';

const sectionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Section name is required (e.g. A, B, Blue)'],
      trim: true,
      uppercase: true,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SchoolClass',
      required: [true, 'Class reference is required'],
      index: true,
    },
    capacity: {
      type: Number,
      default: 40,
    },
    classTeacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
    },
    roomNumber: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// A section name must be unique within a class (e.g. Class 10 can have only one 'A')
sectionSchema.index({ name: 1, classId: 1 }, { unique: true });

export default mongoose.model('Section', sectionSchema);
