import mongoose from 'mongoose';

const exportSchema = new mongoose.Schema({
  userId: {
    type: String, // Changed from ObjectId to String for now since there's no auth
    required: true,
  },
  projectId: {
    type: String, // Changed from ObjectId to String for now since there's no auth
    required: true,
  },
  variationId: {
    type: String, // Changed from ObjectId to String for now since there's no auth
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending',
  },
  cloudinaryUrl: {
    type: String,
  },
  cloudinaryPublicId: {
    type: String,
  },
  settings: {
    width: Number,
    height: Number,
    fps: Number,
    duration: Number,
    format: String,
  },
  metadata: {
    fileSize: Number,
    renderTime: Number,
    error: String,
  },
}, {
  timestamps: true,
});

export default mongoose.models.Export || mongoose.model('Export', exportSchema);
