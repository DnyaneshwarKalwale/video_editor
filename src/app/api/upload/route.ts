import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import cloudinary from '@/lib/cloudinary';
import Asset from '@/models/Asset';

export async function POST(request: NextRequest) {
  try {
    // Debug environment variables
    console.log('Upload API Debug:');
    console.log('CLOUD_NAME:', process.env.CLOUD_NAME);
    console.log('CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY ? '***' : 'NOT SET');
    console.log('CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET ? '***' : 'NOT SET');
    
    await connectDB();

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;
    const projectId = formData.get('projectId') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // For now, since there's no authentication, we'll use a default user ID
    // In a real app, you'd get this from the authenticated user session
    const actualUserId = userId || 'default-user-id';

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    const uploadResult = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'auto',
          folder: `users/${actualUserId}/uploads`,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      uploadStream.end(buffer);
    });

    // Debug upload result
    console.log('Cloudinary Upload Result:', {
      secure_url: uploadResult.secure_url,
      duration: uploadResult.duration,
      width: uploadResult.width,
      height: uploadResult.height,
      format: uploadResult.format,
    });

    // Save to database
    const asset = await Asset.create({
      userId: actualUserId,
      projectId: projectId || null,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      cloudinaryUrl: uploadResult.secure_url,
      cloudinaryPublicId: uploadResult.public_id,
      metadata: {
        duration: uploadResult.duration,
        width: uploadResult.width,
        height: uploadResult.height,
        format: uploadResult.format,
      },
    });

    return NextResponse.json({
      success: true,
      asset: {
        id: asset._id,
        fileName: asset.fileName,
        fileType: asset.fileType,
        cloudinaryUrl: asset.cloudinaryUrl,
        metadata: asset.metadata,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}
