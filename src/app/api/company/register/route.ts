import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, companyName } = body;
    
    // TODO: Implement company registration logic
    console.log('Company registration attempt:', email, companyName);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Registration successful',
      user: { email, companyName, type: 'company' }
    });
  } catch (error) {
    console.error('Error during company registration:', error);
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 400 }
    );
  }
}
