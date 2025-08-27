import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/options';
import connectDB from '@/lib/database';
import User from '@/models/User';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

// Email transporter setup
const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin (you can implement your own admin check)
    const currentUser = await User.findById(session.user.id);
    if (!currentUser || currentUser.invitation?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { email, company, role = 'user' } = await request.json();

    if (!email || !company) {
      return NextResponse.json({ error: 'Email and company are required' }, { status: 400 });
    }

    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    // Generate invitation token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create invitation record
    const invitation = await User.create({
      email,
      name: email.split('@')[0], // Temporary name
      invitation: {
        token,
        invitedBy: session.user.id,
        invitedAt: new Date(),
        expiresAt,
        company,
        role,
      },
      isActive: false, // User needs to accept invitation first
    });

    // Send invitation email
    const inviteUrl = `${process.env.NEXTAUTH_URL}/invite?token=${token}`;
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `You're invited to join ${company} on Scalez`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">You're invited to Scalez!</h2>
          <p>Hello,</p>
          <p>You've been invited to join <strong>${company}</strong> on Scalez, our video editing platform.</p>
          <p>Click the button below to accept the invitation and create your account:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteUrl}" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Accept Invitation
            </a>
          </div>
          <p>This invitation expires in 7 days.</p>
          <p>If you have any questions, please contact your administrator.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${inviteUrl}" style="color: #2563eb;">${inviteUrl}</a>
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ 
      success: true, 
      message: 'Invitation sent successfully',
      invitation: {
        id: invitation._id,
        email,
        company,
        role,
        expiresAt,
      }
    });

  } catch (error) {
    console.error('Error sending invitation:', error);
    return NextResponse.json({ error: 'Failed to send invitation' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Get all pending invitations
    const invitations = await User.find({
      'invitation.token': { $exists: true, $ne: null },
      isActive: false,
    }).select('email invitation.company invitation.role invitation.invitedAt invitation.expiresAt');

    return NextResponse.json({ invitations });

  } catch (error) {
    console.error('Error fetching invitations:', error);
    return NextResponse.json({ error: 'Failed to fetch invitations' }, { status: 500 });
  }
}
