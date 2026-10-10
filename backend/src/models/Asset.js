import mongoose from 'mongoose';

const assetSchema = new mongoose.Schema(
  {
    assetTag: {
      type: String,
      required: [true, 'Asset tag is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Asset name is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: [
        'Desktop',
        'Laptop',
        'Printer',
        'Projector',
        'Interactive Whiteboard',
        'Server',
        'Router/Switch',
        'Software License',
        'Audio/Visual',
        'Other',
      ],
      required: true,
      index: true,
    },
    serialNumber: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    specifications: {
      type: String,
      trim: true,
    },
    purchaseDate: {
      type: Date,
    },
    purchasePrice: {
      type: Number,
      min: 0,
    },
    warrantyExpiry: {
      type: Date,
      index: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
      index: true,
    },
    location: {
      type: String,
      required: true,
      trim: true, // e.g. "Computer Lab 1", "Accountant Desk"
    },
    status: {
      type: String,
      enum: ['In Use', 'In Stock', 'Under Repair', 'Damaged', 'Retired'],
      default: 'In Stock',
      index: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Asset', assetSchema);
