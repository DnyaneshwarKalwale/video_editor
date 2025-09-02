import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/email-service';

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json();

    if (!email || !name) {
      return NextResponse.json({ error: 'Email and name are required' }, { status: 400 });
    }

    // Test connection first
    const connectionTest = await emailService.testAWSSESConnection();
    if (!connectionTest.success) {
      return NextResponse.json({ 
        error: 'AWS SES connection failed', 
        details: connectionTest.message 
      }, { status: 500 });
    }

    // Send test email
    const emailSent = await emailService.sendOTPEmail(email, '123456', name);

    if (!emailSent) {
      return NextResponse.json({ error: 'Failed to send test email' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
      connection: connectionTest.message
    });

  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json({ error: 'Failed to send test email' }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Test connection only
    const connectionTest = await emailService.testAWSSESConnection();
    
    return NextResponse.json({
      success: connectionTest.success,
      message: connectionTest.message,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Connection test error:', error);
    return NextResponse.json({ error: 'Connection test failed' }, { status: 500 });
  }
}
