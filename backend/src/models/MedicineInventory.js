import mongoose from 'mongoose';

const medicineInventorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Medicine or supply name is required'],
      unique: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['Analgesic', 'Antiseptic', 'Antibiotic', 'Bandage/Dressings', 'Ointment', 'Equipment', 'Other'],
      default: 'Other',
    },
    quantityAvailable: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    unit: {
      type: String,
      required: true,
      default: 'Units', // Tablets, Bottles, Strips, Rolls
    },
    expiryDate: {
      type: Date,
      required: true,
      index: true,
    },
    lowStockThreshold: {
      type: Number,
      default: 10,
    },
    location: {
      type: String,
      trim: true,
      default: 'Infirmary Cabinet A',
    },
  },
  { timestamps: true }
);

export default mongoose.model('MedicineInventory', medicineInventorySchema);
