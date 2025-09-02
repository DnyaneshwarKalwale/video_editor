import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/options';
import { supabase, TABLES, BUCKETS } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('font') as File;
    const fontName = formData.get('fontName') as string;
    const fontFamily = formData.get('fontFamily') as string;

    if (!file || !fontName || !fontFamily) {
      return NextResponse.json({ 
        error: 'Missing required fields: font, fontName, fontFamily' 
      }, { status: 400 });
    }

    // Validate file type by both MIME type and extension
    const allowedTypes = [
      'font/ttf',
      'font/otf',
      'font/woff',
      'font/woff2',
      'application/x-font-ttf',
      'application/x-font-otf',
      'application/font-woff',
      'application/font-woff2'
    ];

    // Get file extension
    const fileExtension = file.name.toLowerCase().split('.').pop();
    const allowedExtensions = ['ttf', 'otf', 'woff', 'woff2'];

    // Check both MIME type and extension
    const isValidMimeType = allowedTypes.includes(file.type);
    const isValidExtension = allowedExtensions.includes(fileExtension || '');

    if (!isValidMimeType && !isValidExtension) {
      return NextResponse.json({ 
        error: 'Invalid file type. Please upload a valid font file (TTF, OTF, WOFF, WOFF2)' 
      }, { status: 400 });
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 10MB' 
      }, { status: 400 });
    }

    // Generate unique file path
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`;
    const filePath = `${session.user.email}/fonts/${fileName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKETS.FONTS)
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
      .from(BUCKETS.FONTS)
      .getPublicUrl(filePath);

    // Create font record in database
    const fontData = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      family: fontFamily,
      full_name: fontName,
      post_script_name: fontName.replace(/\s+/g, ''),
      preview: `https://via.placeholder.com/300x100/ffffff/000000?text=${encodeURIComponent(fontFamily)}`,
      style: 'normal',
      url: publicUrl,
      category: 'custom',
      user_id: session.user.email,
      is_custom: true,
      file_name: file.name,
      file_size: file.size,
    };

    // Insert into database
    const { data: font, error: insertError } = await supabase
      .from(TABLES.CUSTOM_FONTS)
      .insert(fontData)
      .select()
      .single();

    if (insertError) {
      console.error('Font database insert error:', insertError);
      return NextResponse.json({ 
        error: 'Failed to save font metadata',
        details: insertError.message 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      font: {
        ...font,
        fullName: font.full_name,
        postScriptName: font.post_script_name,
        isCustom: font.is_custom,
        fileName: font.file_name,
        fileSize: font.file_size,
        createdAt: font.created_at,
        updatedAt: font.updated_at,
      },
      message: 'Custom font uploaded successfully'
    });

  } catch (error) {
    console.error('Error uploading custom font:', error);
    return NextResponse.json({ 
      error: 'Failed to upload custom font',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get custom fonts for the user
    const { data: customFonts, error } = await supabase
      .from(TABLES.CUSTOM_FONTS)
      .select('*')
      .eq('user_id', session.user.email)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching custom fonts:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch custom fonts',
        details: error.message 
      }, { status: 500 });
    }

    // Transform data to match expected format
    const fonts = customFonts?.map(font => ({
      ...font,
      fullName: font.full_name,
      postScriptName: font.post_script_name,
      isCustom: font.is_custom,
      fileName: font.file_name,
      fileSize: font.file_size,
      createdAt: font.created_at,
      updatedAt: font.updated_at,
    })) || [];

    return NextResponse.json({
      success: true,
      fonts
    });

  } catch (error) {
    console.error('Error fetching custom fonts:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch custom fonts',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
