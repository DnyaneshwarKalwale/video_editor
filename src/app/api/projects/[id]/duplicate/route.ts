import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import Project from '@/models/Project';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/options';
import { generateId } from '@designcombo/timeline';
import { projectGetSourceMap } from 'next/dist/build/swc/generated-native';

export async function POST(
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

    // Find the original project (ensure it belongs to the user)
    const originalProject = await (Project as any).findOne({
      _id: projectId,
      userId: userId,
      status: { $ne: 'deleted' }
    });

    if (!originalProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Create a duplicate project
    const duplicateProject = await (Project as any).create({
      userId,
      projectId: generateId(),
      name: `${originalProject.name} (Copy)`,
      platform: originalProject.platform,
      aspectRatio: originalProject.aspectRatio,
      width: originalProject.width,
      height: originalProject.height,
      status: 'active',
      trackItems: originalProject.trackItems,
      size: originalProject.size,
      metadata: originalProject.metadata,
      assets: originalProject.assets,
      textVariations: originalProject.textVariations,
      videoVariations: originalProject.videoVariations,
      thumbnail: originalProject.thumbnail,
      duration: originalProject.duration,
      exports: [], // Don't duplicate exports
    });

    return NextResponse.json({
      success: true,
      project: {
        id: duplicateProject._id,
        projectId: duplicateProject.projectId,
        name: duplicateProject.name,
        platform: duplicateProject.platform,
        aspectRatio: duplicateProject.aspectRatio,
        width: duplicateProject.width,
        height: duplicateProject.height,
        createdAt: duplicateProject.createdAt,
        updatedAt: duplicateProject.updatedAt,
      },
    });
  } catch (error) {
    console.error('Project duplication error:', error);
    return NextResponse.json(
      { error: 'Failed to duplicate project' },
      { status: 500 }
    );
  }
}
