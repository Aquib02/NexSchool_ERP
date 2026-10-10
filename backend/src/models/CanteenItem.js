import mongoose from 'mongoose';

const canteenItemSchema = new mongoose.Schema(
  {
    itemCode: {
      type: String,
      required: [true, 'Item code is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Food item name is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['Breakfast', 'Meals / Lunch', 'Snacks', 'Beverages', 'Bakery', 'Fruit / Healthy', 'Packaged'],
      required: true,
      index: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: 0,
    },
    costPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    quantityInStock: {
      type: Number,
      default: 0,
      min: 0,
    },
    isVegetarian: {
      type: Boolean,
      default: true,
    },
    allergens: [
      {
        type: String,
        trim: true,
      },
    ],
    isAvailable: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model('CanteenItem', canteenItemSchema);
