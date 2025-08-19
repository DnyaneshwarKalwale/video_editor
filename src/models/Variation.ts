import mongoose from 'mongoose';

const variationSchema = new mongoose.Schema({
  userId: {
    type: String, // Changed from ObjectId to String for now since there's no auth
    required: true,
  },
  projectId: {
    type: String, // Changed from ObjectId to String for now since there's no auth
    required: true,
  },
  originalElementId: {
    type: String,
    required: true,
  },
  originalText: {
    type: String,
    required: true,
  },
  generatedText: {
    type: String,
    required: true,
  },
  aiModel: {
    type: String,
    default: 'gpt-4',
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1,
  },
  status: {
    type: String,
    enum: ['active', 'archived'],
    default: 'active',
  },
}, {
  timestamps: true,
});

export default mongoose.models.Variation || mongoose.model('Variation', variationSchema);
