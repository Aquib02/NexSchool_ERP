import mongoose from 'mongoose';

const transportAllocationSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student reference is required'],
      index: true,
    },
    academicSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicSession',
      required: true,
      index: true,
    },
    routeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Route',
      required: [true, 'Route reference is required'],
      index: true,
    },
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: [true, 'Vehicle reference is required'],
    },
    stopName: {
      type: String,
      required: [true, 'Designated bus stop is required'],
      trim: true,
    },
    pickupTime: {
      type: String,
    },
    dropTime: {
      type: String,
    },
    monthlyCharge: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['Active', 'Suspended', 'Cancelled'],
      default: 'Active',
      index: true,
    },
  },
  { timestamps: true }
);

// Prevent duplicate active transport allocations for a student in a session
transportAllocationSchema.index(
  { studentId: 1, academicSessionId: 1 },
  { unique: true, partialFilterExpression: { status: 'Active' } }
);

export default mongoose.model('TransportAllocation', transportAllocationSchema);
