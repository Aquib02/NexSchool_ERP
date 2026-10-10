import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema(
  {
    vehicleNumber: {
      type: String,
      required: [true, 'Vehicle registration number is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    model: {
      type: String,
      required: [true, 'Vehicle model is required'],
      trim: true,
    },
    seatingCapacity: {
      type: Number,
      required: [true, 'Seating capacity is required'],
      min: 1,
    },
    driver: {
      name: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      licenseNumber: { type: String, trim: true },
    },
    conductor: {
      name: { type: String, trim: true },
      phone: { type: String, trim: true },
    },
    insuranceExpiry: {
      type: Date,
      index: true,
    },
    fitnessExpiry: {
      type: Date,
      index: true,
    },
    pollutionExpiry: {
      type: Date,
    },
    gpsDeviceId: {
      type: String,
      trim: true,
      sparse: true, // Prepared for future IoT / GPS telematics
    },
    status: {
      type: String,
      enum: ['Active', 'In Maintenance', 'Decommissioned'],
      default: 'Active',
      index: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Vehicle', vehicleSchema);
