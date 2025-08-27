import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import Project from '@/models/Project';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/options';
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
    
    console.log('🔌 Projects API: Connecting to database...');
    await connectDB();
    console.log('✅ Projects API: Database connected');

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    // Build query
    const query: any = { userId, status: { $ne: 'deleted' } };
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    console.log('🔍 Projects API: Query:', query);

    const projects = await Project.find(query)
      .sort({ updatedAt: -1 })
      .select('projectId name platform aspectRatio createdAt updatedAt thumbnail duration status')
      .limit(50); // Limit to prevent loading too many projects at once

    console.log('📦 Projects API: Found', projects.length, 'projects');

    return NextResponse.json({
      success: true,
      projects: projects.map(project => ({
        id: project._id,
        projectId: project.projectId,
        name: project.name,
        platform: project.platform,
        aspectRatio: project.aspectRatio,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        thumbnail: project.thumbnail,
        duration: project.duration,
        status: project.status,
      })),
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
    
    await connectDB();

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
    const project = await Project.create({
      userId,
      projectId,
      name,
      platform,
      aspectRatio: platformConfig.aspectRatio,
      width: platformConfig.width,
      height: platformConfig.height,
      status: 'active',
      trackItems: [],
      size: {
        width: platformConfig.width,
        height: platformConfig.height,
      },
      metadata: {},
      assets: [],
      textVariations: [],
      videoVariations: [],
      exports: [],
    });

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
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
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
