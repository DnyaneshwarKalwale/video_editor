import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import Project from '@/models/Project';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/options';

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

    // Return the project data in the format expected by the editor
    return NextResponse.json({
      success: true,
      scene: {
        id: project._id,
        content: {
          trackItems: project.trackItems || [],
          size: project.size || { width: project.width, height: project.height },
          metadata: project.metadata || {},
        }
      },
      project: {
        id: project._id,
        projectId: project.projectId,
        name: project.name,
        platform: project.platform,
        aspectRatio: project.aspectRatio,
        width: project.width,
        height: project.height,
        assets: project.assets || [],
        textVariations: project.textVariations || [],
        videoVariations: project.videoVariations || [],
        exports: project.exports || [],
        thumbnail: project.thumbnail,
        duration: project.duration,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      }
    });
  } catch (error) {
    console.error('Scene fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scene' },
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
    const { trackItems, size, metadata } = await request.json();
    
    await connectDB();

    // Update the project with new scene data
    const project = await Project.findOneAndUpdate(
      {
        _id: projectId,
        userId: userId,
        status: { $ne: 'deleted' }
      },
      {
        trackItems: trackItems || [],
        size: size || {},
        metadata: metadata || {},
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      scene: {
        id: project._id,
        content: {
          trackItems: project.trackItems,
          size: project.size,
          metadata: project.metadata,
        }
      }
    });
  } catch (error) {
    console.error('Scene update error:', error);
    return NextResponse.json(
      { error: 'Failed to update scene' },
      { status: 500 }
    );
  }
}
