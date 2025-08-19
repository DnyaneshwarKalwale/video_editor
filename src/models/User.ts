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
