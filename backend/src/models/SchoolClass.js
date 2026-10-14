import mongoose from 'mongoose';

const bookItemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Book title is required'],
      trim: true,
    },
    subject: {
      type: String,
      trim: true,
      default: '',
    },
    author: {
      type: String,
      trim: true,
      default: '',
    },
    publisher: {
      type: String,
      trim: true,
      default: '',
    },
    isbn: {
      type: String,
      trim: true,
      default: '',
    },
    isRequired: {
      type: Boolean,
      default: true,
    },
  },
  { _id: true }
);

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
    floorNumber: {
      type: String,
      trim: true,
      default: '',
    },
    building: {
      type: String,
      trim: true,
      default: '',
    },
    roomNumber: {
      type: String,
      trim: true,
      default: '',
    },
    classTeacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
    },
    books: [bookItemSchema],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model('SchoolClass', schoolClassSchema);
