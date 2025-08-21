import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import Project from '@/models/Project';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/options';
import { generateId } from '@designcombo/timeline';

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

    const userId = session.user.id;
    const projectId = params.id;
    
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
      project: {
        id: project._id,
        projectId: project.projectId,
        name: project.name,
        platform: project.platform,
        aspectRatio: project.aspectRatio,
        width: project.width,
        height: project.height,
        trackItems: project.trackItems,
        size: project.size,
        metadata: project.metadata,
        assets: project.assets,
        textVariations: project.textVariations,
        videoVariations: project.videoVariations,
        thumbnail: project.thumbnail,
        duration: project.duration,
        exports: project.exports,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      },
    });
  } catch (error) {
    console.error('Project fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}

export async function PUT(
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
    const { name, platform, trackItems, size, metadata, assets, textVariations, videoVariations } = await request.json();
    
    await connectDB();

    // Find and update the project (ensure it belongs to the user)
    const updateData: any = { updatedAt: new Date() };
    
    if (name !== undefined) updateData.name = name;
    if (platform !== undefined) updateData.platform = platform;
    if (trackItems !== undefined) updateData.trackItems = trackItems;
    if (size !== undefined) updateData.size = size;
    if (metadata !== undefined) updateData.metadata = metadata;
    if (assets !== undefined) updateData.assets = assets;
    if (textVariations !== undefined) updateData.textVariations = textVariations;
    if (videoVariations !== undefined) updateData.videoVariations = videoVariations;

    const project = await Project.findOneAndUpdate(
      {
        _id: projectId,
        userId: userId,
        status: { $ne: 'deleted' }
      },
      updateData,
      { new: true }
    );

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      project: {
        id: project._id,
        projectId: project.projectId,
        name: project.name,
        platform: project.platform,
        aspectRatio: project.aspectRatio,
        width: project.width,
        height: project.height,
        trackItems: project.trackItems,
        size: project.size,
        metadata: project.metadata,
        assets: project.assets,
        textVariations: project.textVariations,
        videoVariations: project.videoVariations,
        thumbnail: project.thumbnail,
        duration: project.duration,
        exports: project.exports,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      },
    });
  } catch (error) {
    console.error('Project update error:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
    
    await connectDB();

    // Soft delete the project (mark as deleted instead of actually deleting)
    const project = await Project.findOneAndUpdate(
      {
        _id: projectId,
        userId: userId,
        status: { $ne: 'deleted' }
      },
      { status: 'deleted', updatedAt: new Date() },
      { new: true }
    );

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (error) {
    console.error('Project deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}
