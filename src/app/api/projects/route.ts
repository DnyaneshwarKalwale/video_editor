import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/options';
import { supabase, TABLES } from '@/lib/supabase';
import { generateId } from '@designcombo/timeline';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Projects API: Starting request...');
    
    // Get authenticated user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      console.log('❌ Projects API: No session or user ID');
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = session.user.id;
    console.log('👤 Projects API: User ID:', userId);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    // Build query
    let query = supabase
      .from(TABLES.PROJECTS)
      .select('id, project_id, name, platform, aspect_ratio, created_at, updated_at, thumbnail, duration, status')
      .eq('user_id', userId)
      .neq('status', 'deleted')
      .order('updated_at', { ascending: false })
      .limit(50);

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    console.log('🔍 Projects API: Query built');

    const { data: projects, error } = await query;

    if (error) {
      console.error('❌ Projects API Error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch projects', details: error.message },
        { status: 500 }
      );
    }

    console.log('📦 Projects API: Found', projects?.length || 0, 'projects');

    return NextResponse.json({
      success: true,
      projects: projects?.map(project => ({
        id: project.id,
        projectId: project.project_id,
        name: project.name,
        platform: project.platform,
        aspectRatio: project.aspect_ratio,
        createdAt: project.created_at,
        updatedAt: project.updated_at,
        thumbnail: project.thumbnail,
        duration: project.duration,
        status: project.status,
      })) || [],
    });
  } catch (error) {
    console.error('❌ Projects API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = session.user.id;

    const { name, platform } = await request.json();

    if (!name || !platform) {
      return NextResponse.json({ error: 'Name and platform are required' }, { status: 400 });
    }

    // Get platform configuration
    const platformConfigs = {
      'instagram-reel': { width: 1080, height: 1920, aspectRatio: '9:16' },
      'instagram-post': { width: 1080, height: 1080, aspectRatio: '1:1' },
      'youtube-landscape': { width: 1920, height: 1080, aspectRatio: '16:9' },
      'facebook-feed': { width: 1200, height: 628, aspectRatio: '1.91:1' },
      'tiktok': { width: 1080, height: 1920, aspectRatio: '9:16' },
    };

    const platformConfig = platformConfigs[platform as keyof typeof platformConfigs];
    if (!platformConfig) {
      return NextResponse.json({ error: 'Invalid platform' }, { status: 400 });
    }

    // Generate unique project ID
    const projectId = generateId();

    // Create new project with initial data
    const { data: project, error } = await supabase
      .from(TABLES.PROJECTS)
      .insert({
        user_id: userId,
        project_id: projectId,
        name,
        platform,
        aspect_ratio: platformConfig.aspectRatio,
        width: platformConfig.width,
        height: platformConfig.height,
        status: 'active',
        track_items: [],
        size: {
          width: platformConfig.width,
          height: platformConfig.height,
        },
        metadata: {},
        assets: [],
        text_variations: [],
        video_variations: [],
        exports: [],
      })
      .select()
      .single();

    if (error) {
      console.error('Project creation error:', error);
      return NextResponse.json(
        { error: 'Failed to create project', details: error.message },
        { status: 500 }
      );
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
        createdAt: project.created_at,
        updatedAt: project.updated_at,
      },
    });
  } catch (error) {
    console.error('Project creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
