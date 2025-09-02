import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/options';
import { supabase, TABLES } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get authenticated user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = session.user.id;
    const { id: projectId } = await params;

    // Get project text variations
    const { data: project, error } = await supabase
      .from(TABLES.PROJECTS)
      .select('text_variations')
      .eq('id', projectId)
      .eq('user_id', userId)
      .neq('status', 'deleted')
      .single();

    if (error || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      textVariations: project.text_variations || [],
    });
  } catch (error) {
    console.error('Text variations fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch text variations' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get authenticated user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = session.user.id;
    const { id: projectId } = await params;
    const { elementId, originalText, variations } = await request.json();

    // Get current project
    const { data: project, error: findError } = await supabase
      .from(TABLES.PROJECTS)
      .select('text_variations')
      .eq('id', projectId)
      .eq('user_id', userId)
      .neq('status', 'deleted')
      .single();

    if (findError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Add new text variation
    const currentVariations = project.text_variations || [];
    const newVariation = {
      elementId,
      originalText,
      variations,
      createdAt: new Date().toISOString(),
    };

    const updatedVariations = [...currentVariations, newVariation];

    // Update project with new variations
    const { data: updatedProject, error: updateError } = await supabase
      .from(TABLES.PROJECTS)
      .update({
        text_variations: updatedVariations,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)
      .eq('user_id', userId)
      .select('text_variations')
      .single();

    if (updateError) {
      console.error('Text variations save error:', updateError);
      return NextResponse.json(
        { error: 'Failed to save text variations' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      textVariations: updatedProject.text_variations,
    });
  } catch (error) {
    console.error('Text variations save error:', error);
    return NextResponse.json(
      { error: 'Failed to save text variations' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get authenticated user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = session.user.id;
    const { id: projectId } = await params;
    const { elementId, originalText, variations } = await request.json();

    // Get current project
    const { data: project, error: findError } = await supabase
      .from(TABLES.PROJECTS)
      .select('text_variations')
      .eq('id', projectId)
      .eq('user_id', userId)
      .neq('status', 'deleted')
      .single();

    if (findError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Remove existing variations for this element and add new ones
    const currentVariations = project.text_variations || [];
    const filteredVariations = currentVariations.filter(
      (v: any) => v.elementId !== elementId
    );

    const newVariation = {
      elementId,
      originalText,
      variations,
      createdAt: new Date().toISOString(),
    };

    const updatedVariations = [...filteredVariations, newVariation];

    // Update project with new variations
    const { data: updatedProject, error: updateError } = await supabase
      .from(TABLES.PROJECTS)
      .update({
        text_variations: updatedVariations,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)
      .eq('user_id', userId)
      .select('text_variations')
      .single();

    if (updateError) {
      console.error('Text variations update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update text variations' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      textVariations: updatedProject.text_variations,
    });
  } catch (error) {
    console.error('Text variations update error:', error);
    return NextResponse.json(
      { error: 'Failed to update text variations' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get authenticated user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = session.user.id;
    const { id: projectId } = await params;
    const { searchParams } = new URL(request.url);
    const elementId = searchParams.get('elementId');

    if (!elementId) {
      return NextResponse.json({ error: 'Element ID is required' }, { status: 400 });
    }

    // Get current project
    const { data: project, error: findError } = await supabase
      .from(TABLES.PROJECTS)
      .select('text_variations')
      .eq('id', projectId)
      .eq('user_id', userId)
      .neq('status', 'deleted')
      .single();

    if (findError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Remove variations for this element
    const currentVariations = project.text_variations || [];
    const updatedVariations = currentVariations.filter(
      (v: any) => v.elementId !== elementId
    );

    // Update project
    const { data: updatedProject, error: updateError } = await supabase
      .from(TABLES.PROJECTS)
      .update({
        text_variations: updatedVariations,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)
      .eq('user_id', userId)
      .select('text_variations')
      .single();

    if (updateError) {
      console.error('Text variations delete error:', updateError);
      return NextResponse.json(
        { error: 'Failed to delete text variations' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      textVariations: updatedProject.text_variations,
    });
  } catch (error) {
    console.error('Text variations delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete text variations' },
      { status: 500 }
    );
  }
}
