import connectDB from './database';
import cloudinary from './cloudinary';
import Export from '@/models/Export';
import fs from 'fs';

export async function saveExportToDatabase(
  userId: string,
  projectId: string,
  variationId: string | null,
  outputPath: string,
  videoData: any
) {
  try {
    await connectDB();

    // Upload the rendered video to Cloudinary
    const uploadResult = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'video',
          folder: `users/${userId}/exports`,
          format: 'mp4',
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      // Read the file and pipe to upload stream
      const fileStream = fs.createReadStream(outputPath);
      fileStream.pipe(uploadStream);
    });

    // Get file stats
    const stats = fs.statSync(outputPath);

    // Save to database
    const exportRecord = await Export.create({
      userId,
      projectId,
      variationId,
      status: 'completed',
      cloudinaryUrl: uploadResult.secure_url,
      cloudinaryPublicId: uploadResult.public_id,
      settings: {
        width: videoData.platformConfig.width,
        height: videoData.platformConfig.height,
        fps: 24,
        duration: videoData.duration,
        format: 'mp4',
      },
      metadata: {
        fileSize: stats.size,
        renderTime: Date.now(), // You might want to calculate actual render time
        error: null,
      },
    });

    return {
      success: true,
      exportId: exportRecord._id,
      cloudinaryUrl: uploadResult.secure_url,
      fileSize: stats.size,
    };
  } catch (error) {
    console.error('Error saving export to database:', error);
    throw error;
  }
}

export async function updateExportStatus(
  exportId: string,
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled',
  error?: string
) {
  try {
    await connectDB();

    const updateData: any = { status };
    if (error) {
      updateData['metadata.error'] = error;
    }

    await Export.findByIdAndUpdate(exportId, updateData);
  } catch (error) {
    console.error('Error updating export status:', error);
  }
}
