import { NextRequest, NextResponse } from 'next/server';
import { supabase, TABLES } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
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
    const { data: approvedDomain, error: domainError } = await supabase
      .from(TABLES.COMPANY_DOMAINS)
      .select('id')
      .eq('domain', domain)
      .eq('is_active', true)
      .single();

    if (domainError || !approvedDomain) {
      return NextResponse.json(
        { error: 'Your email domain is not approved. Please contact your administrator.' },
        { status: 403 }
      );
    }

    // Check if user already exists
    const { data: existingUser, error: userCheckError } = await supabase
      .from(TABLES.USERS)
      .select('id')
      .eq('email', email)
      .single();

    if (userCheckError && userCheckError.code !== 'PGRST116') { // PGRST116 = no rows returned
      return NextResponse.json(
        { error: 'Database error checking existing user' },
        { status: 500 }
      );
    }

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const { data: user, error: createError } = await supabase
      .from(TABLES.USERS)
      .insert({
        email,
        name,
        password: hashedPassword,
        company_domain: domain,
        is_admin: false,
      })
      .select('id')
      .single();

    if (createError) {
      console.error('User creation error:', createError);
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Account created successfully',
      userId: user.id,
    });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}
