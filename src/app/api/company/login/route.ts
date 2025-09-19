import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;
    
    // TODO: Implement company login logic
    console.log('Company login attempt:', email);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Login successful',
      user: { email, type: 'company' }
    });
  } catch (error) {
    console.error('Error during company login:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 401 }
    );
  }
}
