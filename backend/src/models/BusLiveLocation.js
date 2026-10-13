import mongoose from 'mongoose';

const busLiveLocationSchema = new mongoose.Schema(
  {
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
      unique: true,
      index: true,
    },
    routeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Route',
      required: true,
      index: true,
    },
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    speedKmH: {
      type: Number,
      default: 35,
    },
    heading: {
      type: String, // e.g. "NE", "SW", "N"
      default: 'NE',
    },
    currentStopIndex: {
      type: Number,
      default: 0,
    },
    currentStopName: {
      type: String,
      default: 'Campus Gate 1',
    },
    nextStopName: {
      type: String,
      default: 'Oakwood Crossing',
    },
    etaNextStopMinutes: {
      type: Number,
      default: 4,
    },
    status: {
      type: String,
      enum: ['On Route', 'Idling', 'Delayed', 'Finished', 'Emergency SOS'],
      default: 'On Route',
    },
    fuelPercent: {
      type: Number,
      default: 82,
      min: 0,
      max: 100,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const BusLiveLocation = mongoose.model('BusLiveLocation', busLiveLocationSchema);
export default BusLiveLocation;
