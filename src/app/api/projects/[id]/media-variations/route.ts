import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import Project from '@/models/Project';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/options';
import { v2 as cloudinary } from 'cloudinary';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    await connectDB();

    const project = await (Project as any).findOne({
      _id: id,
      userId: session.user.id,
      status: { $ne: 'deleted' }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get all media variations for the project
    const mediaVariations = project.videoVariations || [];
    
    console.log('Retrieved video variations:', JSON.stringify(mediaVariations, null, 2));

    return NextResponse.json({
      success: true,
      mediaVariations: mediaVariations
    });
  } catch (error) {
    console.error('Media variations fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch media variations' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { elementId, variations } = body;

    if (!elementId || !variations) {
      return NextResponse.json({ error: 'Element ID and variations required' }, { status: 400 });
    }

    await connectDB();

    const project = await (Project as any).findOne({
      _id: id,
      userId: session.user.id,
      status: { $ne: 'deleted' }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Remove existing variations for this element
    project.videoVariations = project.videoVariations.filter(
      (variation: any) => variation.elementId !== elementId
    );

    // Create the proper structure according to the schema
    const videoVariationEntry = {
      elementId: elementId,
      originalVideo: variations[0]?.originalContent || '', // Use first variation's original content
      variations: variations.map((variation: any) => ({
        id: variation.id,
        videoUrl: variation.content || variation.cloudinaryUrl || variation.videoUrl, // Use content field from upload
        thumbnail: variation.thumbnail,
        metadata: {
          ...variation.metadata,
          fileName: variation.metadata?.fileName || variation.fileName,
          fileSize: variation.metadata?.fileSize || variation.fileSize,
          fileType: variation.metadata?.fileType || variation.fileType,
          duration: variation.metadata?.duration,
          width: variation.metadata?.width,
          height: variation.metadata?.height,
          format: variation.metadata?.format
        },
        cloudinaryPublicId: variation.cloudinaryPublicId
      })),
      createdAt: new Date()
    };

    // Add the new variation entry
    project.videoVariations.push(videoVariationEntry);
    
    console.log('Saving video variations:', JSON.stringify(project.videoVariations, null, 2));

    await project.save();
    
    console.log('Video variations saved successfully');

    return NextResponse.json({
      success: true,
      message: 'Media variations saved successfully'
    });
  } catch (error) {
    console.error('Media variations save error:', error);
    return NextResponse.json(
      { error: 'Failed to save media variations' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const elementId = searchParams.get('elementId');

    if (!elementId) {
      return NextResponse.json({ error: 'Element ID required' }, { status: 400 });
    }

    await connectDB();

    const project = await (Project as any).findOne({
      _id: id,
      userId: session.user.id,
      status: { $ne: 'deleted' }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get variations to delete from Cloudinary
    const elementEntry = project.videoVariations.find(
      (entry: any) => entry.elementId === elementId
    );

    // Delete from Cloudinary
    if (elementEntry && elementEntry.variations) {
      for (const variation of elementEntry.variations) {
        if (variation.cloudinaryPublicId) {
          try {
            await cloudinary.uploader.destroy(variation.cloudinaryPublicId);
          } catch (error) {
            console.error('Error deleting from Cloudinary:', error);
          }
        }
      }
    }

    // Remove from project
    project.videoVariations = project.videoVariations.filter(
      (variation: any) => variation.elementId !== elementId
    );

    await project.save();

    return NextResponse.json({
      success: true,
      message: 'Media variations deleted successfully'
    });
  } catch (error) {
    console.error('Media variations delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete media variations' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { variationId } = body;

    if (!variationId) {
      return NextResponse.json({ error: 'Variation ID required' }, { status: 400 });
    }

    await connectDB();

    const project = await (Project as any).findOne({
      _id: id,
      userId: session.user.id,
      status: { $ne: 'deleted' }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Find the variation to delete
    let variationToDelete = null;
    let elementEntryIndex = -1;
    
    for (let i = 0; i < project.videoVariations.length; i++) {
      const entry = project.videoVariations[i];
      if (entry.variations) {
        const variationIndex = entry.variations.findIndex((v: any) => v.id === variationId);
        if (variationIndex !== -1) {
          variationToDelete = entry.variations[variationIndex];
          elementEntryIndex = i;
          break;
        }
      }
    }

    if (!variationToDelete) {
      return NextResponse.json({ error: 'Variation not found' }, { status: 404 });
    }

    // Delete from Cloudinary
    if (variationToDelete.cloudinaryPublicId) {
      try {
        await cloudinary.uploader.destroy(variationToDelete.cloudinaryPublicId);
      } catch (error) {
        console.error('Error deleting from Cloudinary:', error);
      }
    }

    // Remove the specific variation from the element entry
    if (elementEntryIndex !== -1) {
      project.videoVariations[elementEntryIndex].variations = project.videoVariations[elementEntryIndex].variations.filter(
        (v: any) => v.id !== variationId
      );
      
      // If no variations left, remove the entire element entry
      if (project.videoVariations[elementEntryIndex].variations.length === 0) {
        project.videoVariations.splice(elementEntryIndex, 1);
      }
    }

    await project.save();

    return NextResponse.json({
      success: true,
      message: 'Media variation deleted successfully'
    });
  } catch (error) {
    console.error('Media variation delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete media variation' },
      { status: 500 }
    );
  }
}
