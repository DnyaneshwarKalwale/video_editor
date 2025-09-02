import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/options';
import { supabase, supabaseAdmin, TABLES, BUCKETS } from '@/lib/supabase';

// Configure for large file uploads
export const maxDuration = 300; // 5 minutes
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Upload API: Starting request...');
    
    // Get authenticated user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      console.log('❌ Upload API: No session or user ID');
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = session.user.id;
    console.log('👤 Upload API: User ID:', userId);

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const projectId = formData.get('projectId') as string;
    const isVariation = formData.get('isVariation') === 'true';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Check file size (50MB limit)
    const maxSize = 50 * 1024 * 1024; // 50MB in bytes
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 50MB' 
      }, { status: 400 });
    }

    console.log(`Uploading file: ${file.name}, size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);

    if (!projectId) {
      console.log('❌ Upload API: No project ID provided');
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
    }

    console.log('🔍 Upload API: Project ID:', projectId);

    // Verify project belongs to user
    const { data: project, error: projectError } = await supabase
      .from(TABLES.PROJECTS)
      .select('id, name, project_id')
      .eq('id', projectId)
      .eq('user_id', userId)
      .neq('status', 'deleted')
      .single();

    if (projectError || !project) {
      console.log('❌ Upload API: Project not found or error:', projectError);
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    console.log('✅ Upload API: Project found:', project.name);

    // Generate unique file path
    const fileExtension = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`;
    const filePath = `${userId}/projects/${projectId}/uploads/${fileName}`;

    // Upload to Supabase Storage using admin client to bypass RLS
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from(BUCKETS.UPLOADS)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return NextResponse.json({ 
        error: 'Upload failed',
        details: uploadError.message 
      }, { status: 500 });
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKETS.UPLOADS)
      .getPublicUrl(filePath);

    // Save to Asset table
    const { data: asset, error: assetError } = await supabase
      .from(TABLES.ASSETS)
      .insert({
        user_id: userId,
        project_id: projectId,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        supabase_url: publicUrl,
        supabase_path: filePath,
        is_variation: isVariation,
        metadata: {
          duration: 0, // Will be updated if video
          width: 0,
          height: 0,
          format: fileExtension,
        },
      })
      .select()
      .single();

    if (assetError) {
      console.error('Asset creation error:', assetError);
      return NextResponse.json({ 
        error: 'Failed to save asset metadata',
        details: assetError.message 
      }, { status: 500 });
    }

    // Track asset upload activity
    try {
      await supabase
        .from(TABLES.USER_ACTIVITIES)
        .insert({
          user_id: userId,
          user_email: session.user.email || '',
          company_domain: session.user.companyDomain || '',
          activity_type: 'asset_upload',
          project_id: projectId,
          project_name: project.name || '',
          metadata: {
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            isVariation: isVariation,
          },
          user_agent: request.headers.get('user-agent') || '',
        });
    } catch (activityError) {
      console.error('Activity tracking error:', activityError);
      // Don't fail the upload if activity tracking fails
    }

    console.log('File uploaded successfully to Supabase');

    return NextResponse.json({
      success: true,
      asset: {
        id: asset.id,
        fileName: asset.file_name,
        fileType: asset.file_type,
        fileSize: asset.file_size,
        supabaseUrl: asset.supabase_url,
        supabasePath: asset.supabase_path,
        isVariation: asset.is_variation,
        metadata: asset.metadata,
        createdAt: asset.created_at,
      },
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ 
      error: 'Upload failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
