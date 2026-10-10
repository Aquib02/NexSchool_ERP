import mongoose from 'mongoose';

const schoolClassSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Class name is required (e.g. Class 10, Grade 1)'],
      unique: true,
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Class code is required (e.g. C10, G1)'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    numericOrder: {
      type: Number,
      required: [true, 'Numeric order is required for sorting classes'],
      unique: true,
    },
    description: {
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

export default mongoose.model('SchoolClass', schoolClassSchema);
