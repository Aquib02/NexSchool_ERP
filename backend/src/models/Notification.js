import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipientType: {
      type: String,
      enum: ['Individual', 'Role', 'Class', 'BroadcastAll'],
      required: true,
      default: 'Individual',
    },
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    roleTarget: {
      type: String, // e.g. 'TEACHER', 'PARENT', 'ACCOUNTANT'
      default: null,
    },
    classTarget: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SchoolClass',
      default: null,
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['Academic', 'Fee', 'Attendance', 'Transport', 'Medical', 'Exam', 'Notice', 'Emergency', 'System'],
      default: 'General',
      index: true,
    },
    actionUrl: {
      type: String,
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
    channelDelivery: [
      {
        channel: { type: String, enum: ['InApp', 'Email', 'SMS', 'WhatsApp'], default: 'InApp' },
        status: { type: String, enum: ['Pending', 'Sent', 'Delivered', 'Failed'], default: 'Pending' },
        deliveredAt: { type: Date },
        errorMessage: { type: String },
      },
    ],
  },
  { timestamps: true }
);

notificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);
