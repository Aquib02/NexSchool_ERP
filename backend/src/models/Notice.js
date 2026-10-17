import mongoose from 'mongoose';

const noticeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Notice title is required'],
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Notice content is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['General', 'Academic', 'Administrative', 'Examination', 'Holiday', 'Sports', 'Event', 'Emergency'],
      default: 'General',
    },
    targetAudience: {
      type: [String],
      enum: ['All', 'Students', 'Teachers', 'Staff', 'Parents'],
      default: ['All'],
    },
    targetClasses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SchoolClass',
      },
    ],
    publishDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    expiryDate: {
      type: Date,
      default: null,
    },
    attachmentUrl: {
      type: String,
      default: null,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

noticeSchema.index({ publishDate: -1, isPinned: -1 });

export default mongoose.model('Notice', noticeSchema);
