import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/options';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get authenticated user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const voiceOverId = params.id;

    // For now, return a mock response
    // In a real implementation, this would check the actual status from a TTS service
    return NextResponse.json({
      success: true,
      voiceOver: {
        id: voiceOverId,
        status: 'completed',
        url: 'https://example.com/mock-voice-over.mp3',
        createdAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Voice-over status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check voice-over status' },
      { status: 500 }
    );
  }
}
