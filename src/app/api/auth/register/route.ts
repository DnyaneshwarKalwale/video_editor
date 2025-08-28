import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import User from '@/models/User';
import CompanyDomain from '@/models/CompanyDomain';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { email, password, name } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Extract domain from email
    const domain = email.split('@')[1];
    if (!domain) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if domain is approved
    const approvedDomain = await (CompanyDomain as any).findOne({ 
      domain: domain, 
      isActive: true 
    });

    if (!approvedDomain) {
      return NextResponse.json(
        { error: 'Your email domain is not approved. Please contact your administrator.' },
        { status: 403 }
      );
    }

    // Check if user already exists
    const existingUser = await (User as any).findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await (User as any).create({
      email,
      name,
      password: hashedPassword,
      companyDomain: domain,
      isAdmin: false,
    });

    return NextResponse.json({
      message: 'Account created successfully',
      userId: user._id,
    });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
}
