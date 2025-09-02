import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/options';
import { supabase, TABLES } from '@/lib/supabase';
import { generateId } from '@designcombo/timeline';

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

    // Find the project (ensure it belongs to the user)
    const { data: project, error } = await supabase
      .from(TABLES.PROJECTS)
      .select('*')
      .eq('id', projectId)
      .eq('user_id', userId)
      .neq('status', 'deleted')
      .single();

    if (error || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      project: {
        id: project.id,
        projectId: project.project_id,
        name: project.name,
        platform: project.platform,
        aspectRatio: project.aspect_ratio,
        width: project.width,
        height: project.height,
        trackItems: project.track_items,
        size: project.size,
        metadata: project.metadata,
        assets: project.assets,
        textVariations: project.text_variations,
        videoVariations: project.video_variations,
        thumbnail: project.thumbnail,
        duration: project.duration,
        exports: project.exports,
        createdAt: project.created_at,
        updatedAt: project.updated_at,
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
    const { name, platform, trackItems, size, metadata, assets, textVariations, videoVariations } = await request.json();

    // Build update data
    const updateData: any = { updated_at: new Date().toISOString() };
    
    if (name !== undefined) updateData.name = name;
    if (platform !== undefined) updateData.platform = platform;
    if (trackItems !== undefined) updateData.track_items = trackItems;
    if (size !== undefined) updateData.size = size;
    if (metadata !== undefined) updateData.metadata = metadata;
    if (assets !== undefined) updateData.assets = assets;
    if (textVariations !== undefined) updateData.text_variations = textVariations;
    if (videoVariations !== undefined) updateData.video_variations = videoVariations;

    // Find and update the project (ensure it belongs to the user)
    const { data: project, error } = await supabase
      .from(TABLES.PROJECTS)
      .update(updateData)
      .eq('id', projectId)
      .eq('user_id', userId)
      .neq('status', 'deleted')
      .select()
      .single();

    if (error || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      project: {
        id: project.id,
        projectId: project.project_id,
        name: project.name,
        platform: project.platform,
        aspectRatio: project.aspect_ratio,
        width: project.width,
        height: project.height,
        trackItems: project.track_items,
        size: project.size,
        metadata: project.metadata,
        assets: project.assets,
        textVariations: project.text_variations,
        videoVariations: project.video_variations,
        thumbnail: project.thumbnail,
        duration: project.duration,
        exports: project.exports,
        createdAt: project.created_at,
        updatedAt: project.updated_at,
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

    // Soft delete the project (mark as deleted instead of actually deleting)
    const { data: project, error } = await supabase
      .from(TABLES.PROJECTS)
      .update({ 
        status: 'deleted', 
        updated_at: new Date().toISOString() 
      })
      .eq('id', projectId)
      .eq('user_id', userId)
      .neq('status', 'deleted')
      .select()
      .single();

    if (error || !project) {
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
