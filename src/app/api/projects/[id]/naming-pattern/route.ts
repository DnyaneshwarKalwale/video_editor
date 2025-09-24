import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/options';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Load naming pattern for project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const projectId = resolvedParams.id;

    // Get user from NextAuth session
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    const { data, error } = await supabase
      .from('project_naming_patterns')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error loading naming pattern:', error);
      return NextResponse.json({ error: 'Failed to load naming pattern' }, { status: 500 });
    }

    return NextResponse.json({
      pattern: data || null
    });

  } catch (error) {
    console.error('Error in GET naming pattern:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Save/Update naming pattern for project
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const projectId = resolvedParams.id;
    const { pattern_type, element_names } = await request.json();

    // Get user from NextAuth session
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Validate input
    if (!pattern_type || !element_names) {
      return NextResponse.json(
        { error: 'pattern_type and element_names are required' },
        { status: 400 }
      );
    }

    // Validate pattern_type
    const validPatterns = ['default', 'numbers', 'letters', 'letters-upper'];
    if (!validPatterns.includes(pattern_type)) {
      return NextResponse.json(
        { error: 'Invalid pattern_type' },
        { status: 400 }
      );
    }

    // Validate element_names structure
    const requiredElements = ['video', 'image', 'audio', 'text', 'font', 'speed'];
    for (const element of requiredElements) {
      if (!element_names[element] || typeof element_names[element] !== 'string') {
        return NextResponse.json(
          { error: `Missing or invalid element name: ${element}` },
          { status: 400 }
        );
      }
    }

    // Use upsert to insert or update
    const { data, error } = await supabase
      .from('project_naming_patterns')
      .upsert({
        project_id: projectId,
        user_id: userId,
        pattern_type,
        element_names
      }, {
        onConflict: 'project_id,user_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving naming pattern:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      return NextResponse.json({ 
        error: 'Failed to save naming pattern',
        details: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      pattern: data
    });

  } catch (error) {
    console.error('Error in PUT naming pattern:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE - Remove naming pattern for project (reset to default)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const projectId = resolvedParams.id;

    // Get user from NextAuth session
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    const { error } = await supabase
      .from('project_naming_patterns')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting naming pattern:', error);
      return NextResponse.json({ error: 'Failed to delete naming pattern' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in DELETE naming pattern:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}