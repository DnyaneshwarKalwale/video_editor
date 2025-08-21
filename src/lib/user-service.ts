import connectDB from './database';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export interface CreateUserData {
  email: string;
  name: string;
  image?: string;
  googleId?: string;
  password?: string;
}

export class UserService {
  static async createUser(userData: CreateUserData) {
    await connectDB();
    
    // Hash password if provided
    let hashedPassword = null;
    if (userData.password) {
      hashedPassword = await bcrypt.hash(userData.password, 12);
    }

    const user = await User.create({
      email: userData.email,
      name: userData.name,
      image: userData.image || null,
      googleId: userData.googleId || null,
      password: hashedPassword,
      emailVerified: new Date(), // Auto-verify for now
    });

    return user;
  }

  static async findUserByEmail(email: string) {
    await connectDB();
    return await User.findOne({ email });
  }

  static async findUserByGoogleId(googleId: string) {
    await connectDB();
    return await User.findOne({ googleId });
  }

  static async findUserById(id: string) {
    await connectDB();
    return await User.findById(id);
  }

  static async updateUser(id: string, updateData: Partial<CreateUserData>) {
    await connectDB();
    
    // Hash password if provided
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 12);
    }

    return await User.findByIdAndUpdate(id, updateData, { new: true });
  }

  static async verifyPassword(user: any, password: string) {
    if (!user.password) return false;
    return await bcrypt.compare(password, user.password);
  }

  static async findOrCreateGoogleUser(profile: any) {
    await connectDB();
    
    // Try to find existing user by Google ID
    let user = await User.findOne({ googleId: profile.sub });
    
    if (!user) {
      // Try to find by email
      user = await User.findOne({ email: profile.email });
      
      if (user) {
        // Update existing user with Google ID
        user.googleId = profile.sub;
        user.image = profile.picture;
        await user.save();
      } else {
        // Create new user
        user = await User.create({
          email: profile.email,
          name: profile.name,
          image: profile.picture,
          googleId: profile.sub,
          emailVerified: new Date(),
        });
      }
    }

    return user;
  }
}
