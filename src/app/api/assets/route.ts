import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/options';
import { supabase, TABLES } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = session.user.id;

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const type = searchParams.get('type'); // video, image, audio

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
    }

    // Build query for project-specific assets (exclude variations)
    let query = supabase
      .from(TABLES.ASSETS)
      .select('*')
      .eq('user_id', userId)
      .eq('project_id', projectId)
      .eq('status', 'active')
      .eq('is_variation', false)
      .order('created_at', { ascending: false });
    
    if (type) {
      query = query.ilike('file_type', `${type}%`);
    }

    const { data: assets, error } = await query;

    if (error) {
      console.error('Assets fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch assets' },
        { status: 500 }
      );
    }

    console.log(`Found ${assets?.length || 0} assets for project ${projectId} (excluding variations)`);

    return NextResponse.json({
      success: true,
      assets: assets?.map(asset => ({
        id: asset.id,
        fileName: asset.file_name,
        fileType: asset.file_type,
        fileSize: asset.file_size,
        url: asset.supabase_url,
        metadata: asset.metadata,
        createdAt: asset.created_at,
      })) || [],
    });
  } catch (error) {
    console.error('Assets fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assets' },
      { status: 500 }
    );
  }
}
