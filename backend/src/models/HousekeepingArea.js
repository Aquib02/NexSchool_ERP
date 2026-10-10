import mongoose from 'mongoose';

const housekeepingAreaSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Area name is required (e.g. Main Science Block Restrooms)'],
      unique: true,
      trim: true,
    },
    building: {
      type: String,
      required: true,
      trim: true,
    },
    floor: {
      type: String,
      required: true,
      trim: true,
    },
    cleaningFrequency: {
      type: String,
      enum: ['Hourly', 'Twice Daily', 'Daily', 'Alternate Days', 'Weekly'],
      default: 'Daily',
    },
    supervisorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model('HousekeepingArea', housekeepingAreaSchema);
