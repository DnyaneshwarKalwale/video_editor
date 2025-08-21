import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  projectId: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  platform: {
    type: String,
    required: true,
    enum: ['instagram-reel', 'instagram-post', 'youtube-landscape', 'facebook-feed', 'tiktok'],
  },
  aspectRatio: {
    type: String,
    required: true,
  },
  width: {
    type: Number,
    required: true,
  },
  height: {
    type: Number,
    required: true,
  },
  // Project data
  trackItems: {
    type: Array,
    default: [],
  },
  size: {
    type: Object,
    default: {},
  },
  metadata: {
    type: Object,
    default: {},
  },
  // Media assets
  assets: [{
    id: String,
    type: String, // 'video', 'image', 'audio'
    fileName: String,
    cloudinaryUrl: String,
    cloudinaryPublicId: String,
    metadata: Object,
    createdAt: Date,
  }],
  // Text variations
  textVariations: [{
    elementId: String,
    originalText: String,
    variations: [{
      id: String,
      text: String,
      language: String,
      style: Object,
    }],
    createdAt: Date,
  }],
  // Video variations
  videoVariations: [{
    elementId: String,
    originalVideo: String,
    variations: [{
      id: String,
      videoUrl: String,
      thumbnail: String,
      metadata: Object,
    }],
    createdAt: Date,
  }],
  // Project settings
  thumbnail: {
    type: String,
    default: null,
  },
  duration: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['active', 'archived', 'deleted'],
    default: 'active',
  },
  // Export history
  exports: [{
    id: String,
    type: String, // 'mp4', 'json'
    url: String,
    status: String, // 'completed', 'failed', 'processing'
    createdAt: Date,
  }],
}, {
  timestamps: true,
});

// Create indexes for better query performance
projectSchema.index({ userId: 1, status: 1 });
projectSchema.index({ userId: 1, updatedAt: -1 });

const Project = mongoose.models.Project || mongoose.model('Project', projectSchema);

export default Project;
