import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import Project from '@/models/Project';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/options';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get authenticated user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = session.user.id;
    const { id: projectId } = await params;
    
    await connectDB();

    // Find the project (ensure it belongs to the user)
    const project = await Project.findOne({
      _id: projectId,
      userId: userId,
      status: { $ne: 'deleted' }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      textVariations: project.textVariations || [],
    });
  } catch (error) {
    console.error('Text variations fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch text variations' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get authenticated user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = session.user.id;
    const projectId = params.id;
    const { elementId, originalText, variations } = await request.json();
    
    await connectDB();

    // Find and update the project
    const project = await Project.findOneAndUpdate(
      {
        _id: projectId,
        userId: userId,
        status: { $ne: 'deleted' }
      },
      {
        $push: {
          textVariations: {
            elementId,
            originalText,
            variations,
            createdAt: new Date(),
          }
        },
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      textVariations: project.textVariations,
    });
  } catch (error) {
    console.error('Text variations save error:', error);
    return NextResponse.json(
      { error: 'Failed to save text variations' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get authenticated user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = session.user.id;
    const { id: projectId } = await params;
    const { elementId, originalText, variations } = await request.json();
    
    await connectDB();

    // First, find the project
    const project = await Project.findOne({
      _id: projectId,
      userId: userId,
      status: { $ne: 'deleted' }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Remove existing variations for this element
    const updatedTextVariations = project.textVariations.filter(
      (v: any) => v.elementId !== elementId
    );

    // Add new variations for this element
    updatedTextVariations.push({
      elementId,
      originalText,
      variations,
      createdAt: new Date(),
    });

    // Update the project with the new textVariations array
    const updatedProject = await Project.findByIdAndUpdate(
      projectId,
      {
        textVariations: updatedTextVariations,
        updatedAt: new Date()
      },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      textVariations: updatedProject.textVariations,
    });
  } catch (error) {
    console.error('Text variations save error:', error);
    return NextResponse.json(
      { error: 'Failed to save text variations' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get authenticated user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = session.user.id;
    const { id: projectId } = await params;
    const { searchParams } = new URL(request.url);
    const elementId = searchParams.get('elementId');
    
    if (!elementId) {
      return NextResponse.json({ error: 'Element ID required' }, { status: 400 });
    }
    
    await connectDB();

    // Remove variations for the specific element
    const project = await Project.findOneAndUpdate(
      {
        _id: projectId,
        userId: userId,
        status: { $ne: 'deleted' }
      },
      {
        $pull: { textVariations: { elementId: elementId } },
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Variations deleted successfully',
      textVariations: project.textVariations,
    });
  } catch (error) {
    console.error('Text variations delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete text variations' },
      { status: 500 }
    );
  }
}
