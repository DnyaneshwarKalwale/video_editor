import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  userId: {
    type: String, // Changed from ObjectId to String for now since there's no auth
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  platform: {
    type: String,
    required: true,
  },
  trackItems: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  size: {
    width: Number,
    height: Number,
  },
  metadata: {
    duration: Number,
    fps: Number,
  },
}, {
  timestamps: true,
});

export default mongoose.models.Project || mongoose.model('Project', projectSchema);
