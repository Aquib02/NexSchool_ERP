import mongoose from 'mongoose';

const checklistItemSchema = new mongoose.Schema(
  {
    item: {
      type: String,
      required: true,
      trim: true,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const housekeepingTaskSchema = new mongoose.Schema(
  {
    taskCode: {
      type: String,
      required: [true, 'Task code is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
    },
    areaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HousekeepingArea',
      required: [true, 'Area reference is required'],
      index: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Assigned staff member is required'],
      index: true,
    },
    scheduledDate: {
      type: Date,
      required: true,
      index: true,
    },
    shift: {
      type: String,
      enum: ['Morning', 'Afternoon', 'Evening'],
      default: 'Morning',
    },
    checklist: [checklistItemSchema],
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Completed', 'Verified', 'Missed'],
      default: 'Pending',
      index: true,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    remarks: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

housekeepingTaskSchema.index({ areaId: 1, scheduledDate: 1 });

export default mongoose.model('HousekeepingTask', housekeepingTaskSchema);
