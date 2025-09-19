import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // TODO: Implement rejection logic
    console.log('Rejecting item with ID:', id);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Item rejected successfully',
      id 
    });
  } catch (error) {
    console.error('Error rejecting item:', error);
    return NextResponse.json(
      { error: 'Failed to reject item' },
      { status: 500 }
    );
  }
}
