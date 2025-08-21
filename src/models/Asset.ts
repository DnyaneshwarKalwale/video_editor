import mongoose from 'mongoose';

const assetSchema = new mongoose.Schema({
  userId: {
    type: String, // Changed from ObjectId to String for now since there's no auth
    required: true,
  },
  projectId: {
    type: String, // Changed from ObjectId to String for now since there's no auth
  },
  fileName: {
    type: String,
    required: true,
  },
  fileType: {
    type: String,
    required: true,
  },
  fileSize: {
    type: Number,
    required: true,
  },
  cloudinaryUrl: {
    type: String,
    required: true,
  },
  cloudinaryPublicId: {
    type: String,
    required: true,
  },
  isVariation: {
    type: Boolean,
    default: false,
  },
  metadata: {
    duration: Number,
    width: Number,
    height: Number,
    format: String,
  },
  status: {
    type: String,
    enum: ['active', 'deleted'],
    default: 'active',
  },
}, {
  timestamps: true,
});

export default mongoose.models.Asset || mongoose.model('Asset', assetSchema);
