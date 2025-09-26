import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/options';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Load naming template for project
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
      console.log('No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    console.log('User ID from session:', userId);

    // Load template from database
    const { data, error } = await supabase
      .from('project_naming_templates')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error loading naming template:', error);
      // Return default template if none found
      return NextResponse.json({
        template: {
          id: 'default',
          name: 'Default Template',
          template: '{ProjectName}-{Headline}-{VideoSpeed}-{FontName}-{FontSize}-{ProgressBar}',
          description: 'Standard template with project name, headline, speed, font, and progress bar',
          isDefault: true
        }
      });
    }

    console.log('Successfully loaded naming template:', data);
    
    return NextResponse.json({
      template: data
    });

  } catch (error) {
    console.error('Error in GET naming template:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PUT - Save naming template for project
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const projectId = resolvedParams.id;
    const { id, name, template, description, isDefault } = await request.json();

    console.log('PUT request received:', { projectId, id, name, template, description, isDefault });

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      console.log('No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    console.log('User ID from session:', userId);

    if (!name || !template) {
      return NextResponse.json(
        { error: 'name and template are required' },
        { status: 400 }
      );
    }

    const upsertData = {
      project_id: projectId,
      user_id: userId,
      template_id: id || `custom-${Date.now()}`,
      name,
      template,
      description: description || '',
      is_default: isDefault || false,
      updated_at: new Date().toISOString()
    };
    
    console.log('Attempting upsert with data:', upsertData);
    
    const { data, error } = await supabase
      .from('project_naming_templates')
      .upsert(upsertData, {
        onConflict: 'project_id,user_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving naming template:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      return NextResponse.json({ 
        error: 'Failed to save naming template',
        details: error.message 
      }, { status: 500 });
    }

    console.log('Successfully saved naming template:', data);
    
    return NextResponse.json({
      success: true,
      template: data
    });

  } catch (error) {
    console.error('Error in PUT naming template:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE - Remove naming template for project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const projectId = resolvedParams.id;

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      console.log('No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    console.log('User ID from session:', userId);

    const { error } = await supabase
      .from('project_naming_templates')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting naming template:', error);
      return NextResponse.json({ 
        error: 'Failed to delete naming template',
        details: error.message 
      }, { status: 500 });
    }

    console.log('Successfully deleted naming template');
    
    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully'
    });

  } catch (error) {
    console.error('Error in DELETE naming template:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

