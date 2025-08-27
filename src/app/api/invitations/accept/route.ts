import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    const { token, name } = await request.json();

    if (!token || !name) {
      return NextResponse.json({ error: 'Token and name are required' }, { status: 400 });
    }

    await connectDB();

    // Find invitation by token
    const invitation = await User.findOne({
      'invitation.token': token,
      isActive: false,
    });

    if (!invitation) {
      return NextResponse.json({ error: 'Invalid or expired invitation' }, { status: 400 });
    }

    // Check if invitation is expired
    if (invitation.invitation.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Invitation has expired' }, { status: 400 });
    }

    // Activate the user and clear invitation token
    const updatedUser = await User.findByIdAndUpdate(
      invitation._id,
      {
        name,
        isActive: true,
        emailVerified: new Date(),
        $unset: { 'invitation.token': 1 },
      },
      { new: true }
    );

    return NextResponse.json({ 
      success: true, 
      message: 'Invitation accepted successfully',
      user: {
        id: updatedUser._id,
        email: updatedUser.email,
        name: updatedUser.name,
        company: updatedUser.invitation.company,
        role: updatedUser.invitation.role,
      }
    });

  } catch (error) {
    console.error('Error accepting invitation:', error);
    return NextResponse.json({ error: 'Failed to accept invitation' }, { status: 500 });
  }
}
