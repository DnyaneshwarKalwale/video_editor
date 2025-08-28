import mongoose from 'mongoose';

const userActivitySchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  userEmail: {
    type: String,
    required: true,
    index: true,
  },
  companyDomain: {
    type: String,
    required: true,
    index: true,
  },
  activityType: {
    type: String,
    enum: ['video_download', 'project_created', 'project_edited', 'asset_uploaded'],
    required: true,
  },
  projectId: {
    type: String,
    default: null,
  },
  projectName: {
    type: String,
    default: null,
  },
  videoDuration: {
    type: Number, // in milliseconds
    default: 0,
  },
  videoSize: {
    type: Number, // in bytes
    default: 0,
  },
  cost: {
    type: Number, // in USD
    default: 0,
  },
  metadata: {
    type: Object,
    default: {},
  },
  ipAddress: {
    type: String,
    default: null,
  },
  userAgent: {
    type: String,
    default: null,
  },
}, {
  timestamps: true,
});

// Create indexes for better query performance
userActivitySchema.index({ companyDomain: 1, createdAt: -1 });
userActivitySchema.index({ activityType: 1, createdAt: -1 });
userActivitySchema.index({ userId: 1, activityType: 1, createdAt: -1 });

export default mongoose.models.UserActivity || mongoose.model('UserActivity', userActivitySchema);
