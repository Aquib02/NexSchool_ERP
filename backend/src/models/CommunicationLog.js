import mongoose from 'mongoose';

const communicationLogSchema = new mongoose.Schema(
  {
    channel: {
      type: String,
      enum: ['WhatsApp', 'SMS', 'InApp', 'Email'],
      required: true,
      default: 'WhatsApp',
      index: true,
    },
    recipientType: {
      type: String,
      enum: ['Parent', 'Student', 'Staff', 'All_Parents', 'Class_Section', 'Fee_Defaulters'],
      required: true,
      default: 'Parent',
    },
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'recipientModel',
      default: null,
    },
    recipientModel: {
      type: String,
      enum: ['User', 'Student', 'Parent', 'Employee'],
      default: 'User',
    },
    recipientPhone: {
      type: String,
      trim: true,
    },
    recipientName: {
      type: String,
      trim: true,
    },
    triggerEvent: {
      type: String,
      enum: [
        'ATTENDANCE_ABSENT',
        'FEE_REMINDER',
        'EMERGENCY_BROADCAST',
        'EXAM_SCHEDULE',
        'REPORT_CARD_PUBLISHED',
        'BUS_DELAY',
        'GENERAL_CIRCULAR',
      ],
      required: true,
      default: 'GENERAL_CIRCULAR',
      index: true,
    },
    messageTemplate: {
      type: String,
      trim: true,
    },
    messageBody: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['Delivered', 'Sent', 'Failed', 'Queued'],
      default: 'Delivered',
      index: true,
    },
    gatewayReference: {
      type: String,
      trim: true,
    },
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    metadata: {
      type: Map,
      of: String,
      default: {},
    },
  },
  { timestamps: true }
);

const CommunicationLog = mongoose.model('CommunicationLog', communicationLogSchema);
export default CommunicationLog;
