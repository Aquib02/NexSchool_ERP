import mongoose from 'mongoose';

const routeStopSchema = new mongoose.Schema(
  {
    stopName: {
      type: String,
      required: true,
      trim: true,
    },
    pickupTime: {
      type: String, // "07:20 AM"
      required: true,
    },
    dropTime: {
      type: String, // "03:40 PM"
      required: true,
    },
    fare: {
      type: Number,
      default: 0,
      min: 0,
    },
    coordinates: {
      latitude: { type: Number },
      longitude: { type: Number },
    },
  },
  { _id: true }
);

const routeSchema = new mongoose.Schema(
  {
    routeName: {
      type: String,
      required: [true, 'Route name is required'],
      unique: true,
      trim: true,
    },
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      default: null,
    },
    startLocation: {
      type: String,
      required: true,
      trim: true,
    },
    endLocation: {
      type: String,
      required: true,
      trim: true,
    },
    stops: [routeStopSchema],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Route', routeSchema);
