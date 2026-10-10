import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Document title is required'],
      trim: true,
    },
    documentType: {
      type: String,
      required: [true, 'Document type is required (e.g. Birth Certificate, TC, National ID)'],
      trim: true,
    },
    fileUrl: {
      type: String,
      required: [true, 'File URL is required'],
    },
    storageProvider: {
      type: String,
      enum: ['cloudinary', 'aws_s3', 'local'],
      default: 'cloudinary',
    },
    storageKey: {
      type: String, // Public ID or S3 object key
      required: true,
    },
    fileFormat: {
      type: String,
      trim: true,
    },
    fileSize: {
      type: Number, // in bytes
    },
    entityType: {
      type: String,
      required: [true, 'Entity type is required'],
      enum: ['Student', 'Parent', 'Employee', 'Admission', 'Vehicle', 'Asset', 'School'],
      index: true,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Target entity ID is required'],
      index: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

documentSchema.index({ entityType: 1, entityId: 1 });

export default mongoose.model('Document', documentSchema);
