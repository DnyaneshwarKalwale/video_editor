import { NextRequest, NextResponse } from 'next/server';
import { supabase, TABLES } from '@/lib/supabase';
import { emailService } from '@/lib/email-service';

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json();

    if (!email || !name) {
      return NextResponse.json({ error: 'Email and name are required' }, { status: 400 });
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from(TABLES.USERS)
      .select('id, email_verified')
      .eq('email', email)
      .single();

    if (existingUser) {
      if (existingUser.email_verified) {
        return NextResponse.json({ error: 'Email already verified' }, { status: 400 });
      }
      // User exists but not verified, allow resending OTP
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete any existing OTP for this email
    await supabase
      .from(TABLES.OTP_CODES)
      .delete()
      .eq('email', email);

    // Store OTP in database
    const { error: otpError } = await supabase
      .from(TABLES.OTP_CODES)
      .insert({
        email,
        otp,
        expires_at: expiresAt.toISOString(),
        attempts: 0
      });

    if (otpError) {
      console.error('Failed to store OTP:', otpError);
      return NextResponse.json({ error: 'Failed to store OTP' }, { status: 500 });
    }

    // Send OTP email
    const emailSent = await emailService.sendOTPEmail(email, otp, name);

    if (!emailSent) {
      return NextResponse.json({ error: 'Failed to send OTP email' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully',
      expiresIn: '10 minutes'
    });

  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
  }
}
