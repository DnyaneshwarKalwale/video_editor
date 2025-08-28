import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/options';
import connectDB from '@/lib/database';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'raw',
          folder: 'custom-fonts',
          public_id: `${fontFamily}-${Date.now()}`,
          format: file.name.split('.').pop(),
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(buffer);
    });

    await connectDB();

    // Create font record in database
    const fontData = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      family: fontFamily,
      fullName: fontName,
      postScriptName: fontName.replace(/\s+/g, ''),
      preview: `https://via.placeholder.com/300x100/ffffff/000000?text=${encodeURIComponent(fontFamily)}`,
      style: 'normal',
      url: (uploadResult as any).secure_url,
      category: 'custom',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: session.user.email,
      isCustom: true,
      fileName: file.name,
      fileSize: file.size,
    };

    // Insert into database using mongoose
    const mongoose = await connectDB();
    await mongoose.connection.db.collection('customFonts').insertOne(fontData);

    return NextResponse.json({
      success: true,
      font: fontData,
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

    const mongoose = await connectDB();

    // Get custom fonts for the user
    const customFonts = await mongoose.connection.db.collection('customFonts')
      .find({ userId: session.user.email })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      fonts: customFonts
    });

  } catch (error) {
    console.error('Error fetching custom fonts:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch custom fonts',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
