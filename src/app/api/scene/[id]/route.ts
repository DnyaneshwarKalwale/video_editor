import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/options';
import { supabase, TABLES } from '@/lib/supabase';

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

    // Find the project and get scene data
    const { data: project, error } = await supabase
      .from(TABLES.PROJECTS)
      .select('name, track_items, size, metadata')
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
        id: projectId,
        name: project.name
      },
      scene: {
        id: projectId,
        content: {
          trackItems: project.track_items || [],
          size: project.size || {},
          metadata: project.metadata || {},
        }
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

    // Update the project with new scene data
    const { data: project, error } = await supabase
      .from(TABLES.PROJECTS)
      .update({
        track_items: trackItems || [],
        size: size || {},
        metadata: metadata || {},
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)
      .eq('user_id', userId)
      .neq('status', 'deleted')
      .select('name, track_items, size, metadata')
      .single();

    if (error || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      project: {
        id: projectId,
        name: project.name
      },
      scene: {
        id: projectId,
        content: {
          trackItems: project.track_items,
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
