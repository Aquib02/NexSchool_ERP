import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Role name is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    displayName: {
      type: String,
      required: [true, 'Role display name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    permissions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Permission',
      },
    ],
    isSystem: {
      type: Boolean,
      default: false, // Prevents deletion of core roles like SUPER_ADMIN
    },
    hierarchyLevel: {
      type: Number,
      required: true,
      default: 10, // 0 = Super Admin, 1 = Principal, 2 = Admin, etc.
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Role', roleSchema);
