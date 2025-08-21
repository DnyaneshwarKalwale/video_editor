import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import cloudinary from '@/lib/cloudinary';
import Asset from '@/models/Asset';
import Project from '@/models/Project';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/options';

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = session.user.id;
    
    await connectDB();

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
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
    }

    // Verify project belongs to user
    const project = await Project.findOne({
      _id: projectId,
      userId: userId,
      status: { $ne: 'deleted' }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary with project-specific folder and timeout
    const uploadResult = await new Promise<any>((resolve, reject) => {
      // Set timeout for upload (5 minutes)
      const timeout = setTimeout(() => {
        reject(new Error('Upload timeout - file too large or slow connection'));
      }, 5 * 60 * 1000); // 5 minutes

      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'auto',
          folder: `users/${userId}/projects/${projectId}/uploads`,
          timeout: 300000, // 5 minutes timeout
        },
        (error, result) => {
          clearTimeout(timeout);
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(error);
          } else {
            console.log('Cloudinary upload successful');
            resolve(result);
          }
        }
      );

      uploadStream.end(buffer);
    });

    // Save to Asset model with project ID
    const asset = await Asset.create({
      userId: userId,
      projectId: projectId,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      cloudinaryUrl: uploadResult.secure_url,
      cloudinaryPublicId: uploadResult.public_id,
      isVariation: isVariation, // Flag to distinguish variation uploads
      metadata: {
        duration: uploadResult.duration || 0,
        width: uploadResult.width || 0,
        height: uploadResult.height || 0,
        format: uploadResult.format || 'unknown',
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
        type: file.type.startsWith('video/') ? 'video' : 
              file.type.startsWith('image/') ? 'image' : 'audio',
      },
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    
    // Handle specific error types
    if (error.message?.includes('timeout') || error.message?.includes('Timeout')) {
      return NextResponse.json({ 
        error: 'Upload timeout - file too large or slow connection. Try a smaller file.' 
      }, { status: 408 });
    }
    
    if (error.http_code === 499) {
      return NextResponse.json({ 
        error: 'Upload cancelled or timed out. Try a smaller file or check your connection.' 
      }, { status: 408 });
    }

    return NextResponse.json({ 
      error: 'Upload failed. Please try again.' 
    }, { status: 500 });
  }
}
