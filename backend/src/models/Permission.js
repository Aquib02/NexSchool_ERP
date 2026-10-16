import mongoose from 'mongoose';

const permissionSchema = new mongoose.Schema(
  {
    resource: {
      type: String,
      required: [true, 'Permission resource is required'],
      trim: true,
      lowercase: true,
    },
    action: {
      type: String,
      required: [true, 'Permission action is required'],
      trim: true,
      lowercase: true,
    },
    code: {
      type: String,
      required: [true, 'Permission unique code is required'],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
      default: 'General',
    },
  },
  { timestamps: true }
);

permissionSchema.index({ resource: 1, action: 1 }, { unique: true });

export default mongoose.model('Permission', permissionSchema);
