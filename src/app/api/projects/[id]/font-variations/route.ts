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

    // Get project font variations
    const { data: project, error } = await supabase
      .from(TABLES.PROJECTS)
      .select('font_variations')
      .eq('id', id)
      .eq('user_id', session.user.id)
      .neq('status', 'deleted')
      .single();

    if (error || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get all font variations for the project
    const fontVariations = project.font_variations || [];
    
    console.log('Retrieved font variations:', JSON.stringify(fontVariations, null, 2));

    return NextResponse.json({
      success: true,
      fontVariations: fontVariations
    });
  } catch (error) {
    console.error('Font variations fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch font variations' },
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
    const { elementId, originalFont, variations } = body;

    if (!elementId || !variations || !Array.isArray(variations)) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    // Get current project
    const { data: project, error: findError } = await supabase
      .from(TABLES.PROJECTS)
      .select('font_variations')
      .eq('id', id)
      .eq('user_id', session.user.id)
      .neq('status', 'deleted')
      .single();

    if (findError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Remove existing variations for this element and add new ones
    const currentVariations = project.font_variations || [];
    const filteredVariations = currentVariations.filter(
      (variation: any) => variation.elementId !== elementId
    );

    // Create the proper structure according to the schema
    const fontVariationEntry = {
      elementId: elementId,
      originalFont: originalFont || 'Arial, sans-serif',
      variations: variations.map((variation: any) => ({
        id: variation.id,
        content: variation.content,
        type: variation.type || 'manual',
        metadata: {
          fontFamily: variation.metadata?.fontFamily || 'Arial, sans-serif',
          fontSize: variation.metadata?.fontSize || 48,
          fontWeight: variation.metadata?.fontWeight || 'bold',
          color: variation.metadata?.color || '#ffffff',
          textAlign: variation.metadata?.textAlign || 'center',
          opacity: variation.metadata?.opacity || 100,
          fontStyle: variation.metadata?.fontStyle || 'normal',
          textDecoration: variation.metadata?.textDecoration || 'none',
          lineHeight: variation.metadata?.lineHeight || 1.2,
          letterSpacing: variation.metadata?.letterSpacing || 'normal',
          textShadow: variation.metadata?.textShadow || 'none'
        }
      })),
      createdAt: new Date().toISOString()
    };

    // Add the new variation entry
    const updatedVariations = [...filteredVariations, fontVariationEntry];
    
    console.log('Saving font variations:', JSON.stringify(updatedVariations, null, 2));

    // Update project with new variations
    const { error: updateError } = await supabase
      .from(TABLES.PROJECTS)
      .update({
        font_variations: updatedVariations,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', session.user.id);

    if (updateError) {
      console.error('Font variations save error:', updateError);
      return NextResponse.json(
        { error: 'Failed to save font variations' },
        { status: 500 }
      );
    }
    
    console.log('Font variations saved successfully');

    return NextResponse.json({
      success: true,
      message: 'Font variations saved successfully'
    });
  } catch (error) {
    console.error('Font variations save error:', error);
    return NextResponse.json(
      { error: 'Failed to save font variations' },
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
      .select('font_variations')
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
    
    const currentVariations = project.font_variations || [];
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
        font_variations: currentVariations,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', session.user.id);

    if (updateError) {
      console.error('Font variation deletion error:', updateError);
      return NextResponse.json(
        { error: 'Failed to delete font variation' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Font variation deleted successfully'
    });
  } catch (error) {
    console.error('Font variation deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete font variation' },
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
      .select('font_variations')
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
    
    const currentVariations = project.font_variations || [];
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
        font_variations: currentVariations,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', session.user.id);

    if (updateError) {
      console.error('Font variation deletion error:', updateError);
      return NextResponse.json(
        { error: 'Failed to delete font variation' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Font variation deleted successfully'
    });
  } catch (error) {
    console.error('Font variation deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete font variation' },
      { status: 500 }
    );
  }
}
