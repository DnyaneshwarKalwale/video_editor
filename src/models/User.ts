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
  // For Google OAuth
  googleId: {
    type: String,
    sparse: true,
  },
  // For email/password authentication
  password: {
    type: String,
    default: null,
  },
  // Account verification
  emailVerified: {
    type: Date,
    default: null,
  },
  // Account status
  isActive: {
    type: Boolean,
    default: true,
  },
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
}, {
  timestamps: true,
});

export default mongoose.models.User || mongoose.model('User', userSchema);
