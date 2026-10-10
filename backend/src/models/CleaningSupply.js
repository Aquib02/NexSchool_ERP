import mongoose from 'mongoose';

const cleaningSupplySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Supply item name is required'],
      unique: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['Detergent/Chemical', 'Sanitary Paper', 'Trash Management', 'Tool/Mop/Brush', 'Safety Gear', 'Other'],
      default: 'Detergent/Chemical',
    },
    quantityInStock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    unit: {
      type: String,
      required: true,
      default: 'Liters', // Liters, Packets, Rolls, Pieces
    },
    minimumAlertLevel: {
      type: Number,
      default: 5,
    },
    storageLocation: {
      type: String,
      trim: true,
      default: 'Janitorial Closet 1',
    },
  },
  { timestamps: true }
);

export default mongoose.model('CleaningSupply', cleaningSupplySchema);
