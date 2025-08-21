import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import Asset from '@/models/Asset';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/options';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = session.user.id;
    
    await connectDB();

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const type = searchParams.get('type'); // video, image, audio

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
    }

    // Build query for project-specific assets (exclude variations)
    const query: any = { 
      userId: userId,
      projectId: projectId,
      status: 'active',
      $or: [
        { isVariation: { $exists: false } }, // Assets without isVariation flag (old assets)
        { isVariation: false } // Assets explicitly marked as not variations
      ]
    };
    
    if (type) {
      query.fileType = { $regex: `^${type}/` };
    }

    const assets = await Asset.find(query)
      .sort({ createdAt: -1 })
      .select('fileName fileType fileSize cloudinaryUrl metadata createdAt isVariation');

    console.log(`Found ${assets.length} assets for project ${projectId} (excluding variations)`);

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
