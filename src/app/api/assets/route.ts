import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import Asset from '@/models/Asset';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type'); // video, image, audio

    // For now, since there's no authentication, we'll get all assets
    // In a real app, you'd filter by actual user ID
    const query: any = { status: 'active' };
    if (type) {
      query.fileType = { $regex: `^${type}/` };
    }

    const assets = await Asset.find(query)
      .sort({ createdAt: -1 })
      .select('fileName fileType fileSize cloudinaryUrl metadata createdAt');

    return NextResponse.json({
      success: true,
      assets: assets.map(asset => ({
        id: asset._id,
        fileName: asset.fileName,
        fileType: asset.fileType,
        fileSize: asset.fileSize,
        url: asset.cloudinaryUrl,
        metadata: asset.metadata,
        createdAt: asset.createdAt,
      })),
    });
  } catch (error) {
    console.error('Assets fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assets' },
      { status: 500 }
    );
  }
}
