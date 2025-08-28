import connectDB from './database';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export interface CreateUserData {
  email: string;
  name: string;
  image?: string;
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

    const user = await (User as any).create({
      email: userData.email,
      name: userData.name,
      image: userData.image || null,
      password: hashedPassword,
      emailVerified: new Date(), // Auto-verify for now
    });

    return user;
  }

  static async findUserByEmail(email: string) {
    await connectDB();
    return await (User as any).findOne({ email });
  }

  static async findUserById(id: string) {
    await connectDB();
    return await (User as any).findById(id);
  }

  static async updateUser(id: string, updateData: Partial<CreateUserData>) {
    await connectDB();
    
    // Hash password if provided
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 12);
    }

    return await (User as any).findByIdAndUpdate(id, updateData, { new: true });
  }

  static async verifyPassword(user: any, password: string) {
    if (!user.password) return false;
    return await bcrypt.compare(password, user.password);
  }
}
