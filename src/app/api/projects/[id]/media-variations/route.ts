import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/options';
import { supabase, TABLES, BUCKETS } from '@/lib/supabase';

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

    // Get project media variations
    const { data: project, error } = await supabase
      .from(TABLES.PROJECTS)
      .select('video_variations')
      .eq('id', id)
      .eq('user_id', session.user.id)
      .neq('status', 'deleted')
      .single();

    if (error || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get all media variations for the project
    const mediaVariations = project.video_variations || [];
    
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

    // Get current project
    const { data: project, error: findError } = await supabase
      .from(TABLES.PROJECTS)
      .select('video_variations')
      .eq('id', id)
      .eq('user_id', session.user.id)
      .neq('status', 'deleted')
      .single();

    if (findError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Remove existing variations for this element
    const currentVariations = project.video_variations || [];
    const filteredVariations = currentVariations.filter(
      (variation: any) => variation.elementId !== elementId
    );

    // Create the proper structure according to the schema
    const videoVariationEntry = {
      elementId: elementId,
      originalVideo: variations[0]?.originalContent || '', // Use first variation's original content
      variations: variations.map((variation: any) => ({
        id: variation.id,
        videoUrl: variation.content || variation.supabaseUrl || variation.videoUrl, // Use content field from upload
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
        supabasePath: variation.supabasePath
      })),
      createdAt: new Date().toISOString()
    };

    // Add the new variation entry
    const updatedVariations = [...filteredVariations, videoVariationEntry];
    
    console.log('Saving video variations:', JSON.stringify(updatedVariations, null, 2));

    // Update project with new variations
    const { error: updateError } = await supabase
      .from(TABLES.PROJECTS)
      .update({
        video_variations: updatedVariations,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', session.user.id);

    if (updateError) {
      console.error('Media variations save error:', updateError);
      return NextResponse.json(
        { error: 'Failed to save media variations' },
        { status: 500 }
      );
    }
    
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

    // Get current project
    const { data: project, error: findError } = await supabase
      .from(TABLES.PROJECTS)
      .select('video_variations')
      .eq('id', id)
      .eq('user_id', session.user.id)
      .neq('status', 'deleted')
      .single();

    if (findError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get variations to delete from Supabase Storage
    const elementEntry = project.video_variations?.find(
      (entry: any) => entry.elementId === elementId
    );

    // Delete from Supabase Storage
    if (elementEntry && elementEntry.variations) {
      for (const variation of elementEntry.variations) {
        if (variation.supabasePath) {
          try {
            await supabase.storage
              .from(BUCKETS.UPLOADS)
              .remove([variation.supabasePath]);
          } catch (error) {
            console.error('Error deleting from Supabase Storage:', error);
          }
        }
      }
    }

    // Remove from project
    const currentVariations = project.video_variations || [];
    const updatedVariations = currentVariations.filter(
      (variation: any) => variation.elementId !== elementId
    );

    // Update project
    const { error: updateError } = await supabase
      .from(TABLES.PROJECTS)
      .update({
        video_variations: updatedVariations,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', session.user.id);

    if (updateError) {
      console.error('Media variations delete error:', updateError);
      return NextResponse.json(
        { error: 'Failed to delete media variations' },
        { status: 500 }
      );
    }

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

    // Get current project
    const { data: project, error: findError } = await supabase
      .from(TABLES.PROJECTS)
      .select('video_variations')
      .eq('id', id)
      .eq('user_id', session.user.id)
      .neq('status', 'deleted')
      .single();

    if (findError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Find the variation to delete
    let variationToDelete = null;
    let elementEntryIndex = -1;
    let variationIndex = -1;
    
    const currentVariations = project.video_variations || [];
    for (let i = 0; i < currentVariations.length; i++) {
      const entry = currentVariations[i];
      if (entry.variations) {
        const foundIndex = entry.variations.findIndex((v: any) => v.id === variationId);
        if (foundIndex !== -1) {
          variationToDelete = entry.variations[foundIndex];
          elementEntryIndex = i;
          variationIndex = foundIndex;
          break;
        }
      }
    }

    if (!variationToDelete) {
      return NextResponse.json({ error: 'Variation not found' }, { status: 404 });
    }

    // Delete from Supabase Storage
    if (variationToDelete.supabasePath) {
      try {
        await supabase.storage
          .from(BUCKETS.UPLOADS)
          .remove([variationToDelete.supabasePath]);
      } catch (error) {
        console.error('Error deleting from Supabase Storage:', error);
      }
    }

    // Remove the specific variation from the element entry
    if (elementEntryIndex !== -1 && variationIndex !== -1) {
      currentVariations[elementEntryIndex].variations.splice(variationIndex, 1);
      
      // If no variations left for this element, remove the entire entry
      if (currentVariations[elementEntryIndex].variations.length === 0) {
        currentVariations.splice(elementEntryIndex, 1);
      }
    }

    // Update project
    const { error: updateError } = await supabase
      .from(TABLES.PROJECTS)
      .update({
        video_variations: currentVariations,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', session.user.id);

    if (updateError) {
      console.error('Media variation delete error:', updateError);
      return NextResponse.json(
        { error: 'Failed to delete media variation' },
        { status: 500 }
      );
    }

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
