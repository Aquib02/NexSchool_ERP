import mongoose from 'mongoose';

const bookSchema = new mongoose.Schema(
  {
    isbn: {
      type: String,
      trim: true,
      uppercase: true,
      sparse: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Book title is required'],
      trim: true,
      index: true,
    },
    author: {
      type: String,
      required: [true, 'Author name is required'],
      trim: true,
      index: true,
    },
    publisher: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      index: true,
    },
    edition: {
      type: String,
      trim: true,
    },
    rackLocation: {
      rackNumber: { type: String, trim: true },
      shelfNumber: { type: String, trim: true },
    },
    totalCopies: {
      type: Number,
      required: true,
      min: 0,
      default: 1,
    },
    availableCopies: {
      type: Number,
      required: true,
      min: 0,
      default: 1,
    },
    issuedCopies: {
      type: Number,
      default: 0,
      min: 0,
    },
    lostCopies: {
      type: Number,
      default: 0,
      min: 0,
    },
    price: {
      type: Number,
      default: 0,
    },
    coverImageUrl: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

bookSchema.index({ title: 'text', author: 'text', category: 'text', isbn: 'text' });

export default mongoose.model('Book', bookSchema);
