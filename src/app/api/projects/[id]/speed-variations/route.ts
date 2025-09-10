import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/options';
import { supabase, TABLES } from '@/lib/supabase';

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

    // Get project speed variations
    const { data: project, error } = await supabase
      .from(TABLES.PROJECTS)
      .select('speed_variations')
      .eq('id', id)
      .eq('user_id', session.user.id)
      .neq('status', 'deleted')
      .single();

    if (error || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get all speed variations for the project
    const speedVariations = project.speed_variations || [];
    
    console.log('Retrieved speed variations:', JSON.stringify(speedVariations, null, 2));

    return NextResponse.json({
      success: true,
      speedVariations: speedVariations
    });
  } catch (error) {
    console.error('Speed variations fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch speed variations' },
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
    const { elementId, originalSpeed, variations } = body;

    if (!elementId || !variations || !Array.isArray(variations)) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    // Get current project
    const { data: project, error: findError } = await supabase
      .from(TABLES.PROJECTS)
      .select('speed_variations')
      .eq('id', id)
      .eq('user_id', session.user.id)
      .neq('status', 'deleted')
      .single();

    if (findError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Remove existing variations for this element and add new ones
    const currentVariations = project.speed_variations || [];
    const filteredVariations = currentVariations.filter(
      (variation: any) => variation.elementId !== elementId
    );

    // Create the proper structure according to the schema
    const speedVariationEntry = {
      elementId: elementId,
      originalSpeed: originalSpeed || 1.0,
      variations: variations.map((variation: any) => ({
        id: variation.id,
        content: variation.content,
        type: variation.type || 'manual',
        metadata: {
          speed: variation.metadata?.speed || 1.0,
          label: variation.metadata?.label || 'Normal Speed',
          duration: variation.metadata?.duration || 0,
          description: variation.metadata?.description || 'Custom speed'
        }
      })),
      createdAt: new Date().toISOString()
    };

    // Add the new variation entry
    const updatedVariations = [...filteredVariations, speedVariationEntry];
    
    console.log('Saving speed variations:', JSON.stringify(updatedVariations, null, 2));

    // Update project with new variations
    const { error: updateError } = await supabase
      .from(TABLES.PROJECTS)
      .update({
        speed_variations: updatedVariations,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', session.user.id);

    if (updateError) {
      console.error('Speed variations save error:', updateError);
      return NextResponse.json(
        { error: 'Failed to save speed variations' },
        { status: 500 }
      );
    }
    
    console.log('Speed variations saved successfully');

    return NextResponse.json({
      success: true,
      message: 'Speed variations saved successfully'
    });
  } catch (error) {
    console.error('Speed variations save error:', error);
    return NextResponse.json(
      { error: 'Failed to save speed variations' },
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

    const body = await request.json();
    const { variationId } = body;

    if (!variationId) {
      return NextResponse.json({ error: 'Variation ID required' }, { status: 400 });
    }

    // Get current project
    const { data: project, error: findError } = await supabase
      .from(TABLES.PROJECTS)
      .select('speed_variations')
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
    
    const currentVariations = project.speed_variations || [];
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

    // Remove the specific variation from the element entry
    if (elementEntryIndex !== -1 && variationIndex !== -1) {
      currentVariations[elementEntryIndex].variations.splice(variationIndex, 1);
      
      // If no variations left for this element, remove the entire entry
      if (currentVariations[elementEntryIndex].variations.length === 0) {
        currentVariations.splice(elementEntryIndex, 1);
      }
    }

    // Update project with modified variations
    const { error: updateError } = await supabase
      .from(TABLES.PROJECTS)
      .update({
        speed_variations: currentVariations,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', session.user.id);

    if (updateError) {
      console.error('Speed variation deletion error:', updateError);
      return NextResponse.json(
        { error: 'Failed to delete speed variation' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Speed variation deleted successfully'
    });
  } catch (error) {
    console.error('Speed variation deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete speed variation' },
      { status: 500 }
    );
  }
}
