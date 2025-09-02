import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/options';
import { supabase, TABLES } from '@/lib/supabase';
import { generateId } from '@designcombo/timeline';

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

    // Find the original project (ensure it belongs to the user)
    const { data: originalProject, error: findError } = await supabase
      .from(TABLES.PROJECTS)
      .select('*')
      .eq('id', projectId)
      .eq('user_id', userId)
      .neq('status', 'deleted')
      .single();

    if (findError || !originalProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Create a duplicate project
    const { data: duplicateProject, error: createError } = await supabase
      .from(TABLES.PROJECTS)
      .insert({
        user_id: userId,
        project_id: generateId(),
        name: `${originalProject.name} (Copy)`,
        platform: originalProject.platform,
        aspect_ratio: originalProject.aspect_ratio,
        width: originalProject.width,
        height: originalProject.height,
        status: 'active',
        track_items: originalProject.track_items,
        size: originalProject.size,
        metadata: originalProject.metadata,
        assets: originalProject.assets,
        text_variations: originalProject.text_variations,
        video_variations: originalProject.video_variations,
        thumbnail: originalProject.thumbnail,
        duration: originalProject.duration,
        exports: [], // Don't duplicate exports
      })
      .select()
      .single();

    if (createError) {
      console.error('Project duplication error:', createError);
      return NextResponse.json(
        { error: 'Failed to duplicate project' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      project: {
        id: duplicateProject.id,
        projectId: duplicateProject.project_id,
        name: duplicateProject.name,
        platform: duplicateProject.platform,
        aspectRatio: duplicateProject.aspect_ratio,
        width: duplicateProject.width,
        height: duplicateProject.height,
        createdAt: duplicateProject.created_at,
        updatedAt: duplicateProject.updated_at,
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
