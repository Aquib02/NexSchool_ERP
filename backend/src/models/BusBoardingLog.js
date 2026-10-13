import mongoose from 'mongoose';

const busBoardingLogSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    routeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Route',
      required: true,
      index: true,
    },
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    tripType: {
      type: String,
      enum: ['Morning_Pickup', 'Afternoon_Drop'],
      required: true,
      default: 'Morning_Pickup',
    },
    boardingStatus: {
      type: String,
      enum: ['Boarded', 'Alighted', 'Absent_Not_At_Stop', 'Parent_Drop'],
      required: true,
      default: 'Boarded',
    },
    stopName: {
      type: String,
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

const BusBoardingLog = mongoose.model('BusBoardingLog', busBoardingLogSchema);
export default BusBoardingLog;
