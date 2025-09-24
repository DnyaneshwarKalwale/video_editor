import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Load naming pattern for project
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;

    // Get user from auth header or session
    const authHeader = request.headers.get('authorization');
    let userId = null;

    if (authHeader) {
      const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
      userId = user?.id;
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;
    const { pattern_type, element_names } = await request.json();

    // Get user from auth header or session
    const authHeader = request.headers.get('authorization');
    let userId = null;

    if (authHeader) {
      const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
      userId = user?.id;
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
      return NextResponse.json({ error: 'Failed to save naming pattern' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      pattern: data
    });

  } catch (error) {
    console.error('Error in PUT naming pattern:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Remove naming pattern for project (reset to default)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;

    const { error } = await supabase
      .from('project_naming_patterns')
      .delete()
      .eq('project_id', projectId);

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