import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import CompanyDomain from '@/models/CompanyDomain';

// PATCH - Update domain status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const { isActive } = await request.json();
    
    const domain = await (CompanyDomain as any).findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    );
    
    if (!domain) {
      return NextResponse.json(
        { error: 'Domain not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      message: 'Domain updated successfully',
      domain,
    });
  } catch (error) {
    console.error('Error updating domain:', error);
    return NextResponse.json(
      { error: 'Failed to update domain' },
      { status: 500 }
    );
  }
}

// DELETE - Delete domain
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    
    const domain = await (CompanyDomain as any).findByIdAndDelete(id);
    
    if (!domain) {
      return NextResponse.json(
        { error: 'Domain not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      message: 'Domain deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting domain:', error);
    return NextResponse.json(
      { error: 'Failed to delete domain' },
      { status: 500 }
    );
  }
}
