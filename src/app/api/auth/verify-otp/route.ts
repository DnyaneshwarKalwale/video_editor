import { NextRequest, NextResponse } from 'next/server';
import { supabase, TABLES } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { email, otp, password, name } = await request.json();

    if (!email || !otp || !password || !name) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    // Get stored OTP data from database
    const { data: otpData, error: otpError } = await supabase
      .from(TABLES.OTP_CODES)
      .select('*')
      .eq('email', email)
      .single();

    if (otpError || !otpData) {
      return NextResponse.json({ error: 'OTP expired or not found' }, { status: 400 });
    }

    // Check if OTP is expired
    if (new Date(otpData.expires_at) < new Date()) {
      // Delete expired OTP
      await supabase
        .from(TABLES.OTP_CODES)
        .delete()
        .eq('email', email);
      return NextResponse.json({ error: 'OTP has expired' }, { status: 400 });
    }

    // Check OTP attempts
    if (otpData.attempts >= 3) {
      // Delete OTP after too many attempts
      await supabase
        .from(TABLES.OTP_CODES)
        .delete()
        .eq('email', email);
      return NextResponse.json({ error: 'Too many attempts. Please request a new OTP' }, { status: 400 });
    }

    // Verify OTP
    if (otpData.otp !== otp) {
      // Increment attempts
      await supabase
        .from(TABLES.OTP_CODES)
        .update({ attempts: otpData.attempts + 1 })
        .eq('email', email);
      return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
    }

    // Extract domain from email
    const domain = email.split('@')[1];
    if (!domain) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Check if domain is approved
    const { data: approvedDomain } = await supabase
      .from(TABLES.COMPANY_DOMAINS)
      .select('id, company_name')
      .eq('domain', domain)
      .eq('is_active', true)
      .single();

    if (!approvedDomain) {
      return NextResponse.json({ error: 'Company domain not approved. Please contact your admin.' }, { status: 403 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create or update user
    const { data: user, error: userError } = await supabase
      .from(TABLES.USERS)
      .upsert({
        email,
        name,
        password: hashedPassword,
        company_domain: domain,
        email_verified: new Date().toISOString(),
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'email',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (userError || !user) {
      console.error('User creation error:', userError);
      return NextResponse.json({ error: 'Failed to create user account' }, { status: 500 });
    }

    // Remove OTP from database
    await supabase
      .from(TABLES.OTP_CODES)
      .delete()
      .eq('email', email);

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully. You can now log in.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        company_domain: user.company_domain
      }
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json({ error: 'Failed to verify OTP' }, { status: 500 });
  }
}
