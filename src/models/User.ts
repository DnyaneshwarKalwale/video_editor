import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    default: null,
  },
  password: {
    type: String,
    default: null,
  },
  googleId: {
    type: String,
    default: null,
  },
  // Admin fields
  isAdmin: {
    type: Boolean,
    default: false,
  },
  adminRole: {
    type: String,
    enum: ['owner', 'boss', 'developer'],
    default: null,
  },
  // Company domain fields
  companyDomain: {
    type: String,
    required: true,
  },
  // User preferences
  preferences: {
    defaultPlatform: {
      type: String,
      default: 'instagram-reel',
    },
    theme: {
      type: String,
      default: 'light',
    },
  },
  emailVerified: {
    type: Date,
    default: null,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

export default mongoose.models.User || mongoose.model('User', userSchema);
