import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Default templates that every user should have
const DEFAULT_TEMPLATES = [
  {
    name: 'Default Template',
    description: 'Standard template with project name, headline, speed, font, and progress bar',
    template: '{ProjectName}-{Headline}-{VideoSpeed}-{FontName}-{FontSize}-{ProgressBar}',
    is_default: true
  },
  {
    name: 'Simple Template',
    description: 'Minimal template with just headline, font, and speed',
    template: '{Headline}{FontName}{VideoSpeed}',
    is_default: true
  },
  {
    name: 'Detailed Template',
    description: 'Comprehensive template for detailed naming',
    template: '{ProjectName}-Ad-{Headline}-{ProgressBar}-{FontSize}-{Duration}',
    is_default: true
  },
  {
    name: 'Media Focused',
    description: 'Template focused on media elements',
    template: '{VideoName}-{AudioName}-{Headline}-{VideoSpeed}',
    is_default: true
  },
  {
    name: 'Style Focused',
    description: 'Template focused on styling elements',
    template: '{ProjectName}-{FontName}-{FontSize}-{TextColor}-{Headline}',
    is_default: true
  }
];

// GET - Get all templates for the user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Check if user has any templates
    const { data: existingTemplates, error: fetchError } = await supabase
      .from('user_naming_templates')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: true });

    if (fetchError) {
      console.error('Error fetching user templates:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
    }

    // If user has no templates, create default ones
    if (!existingTemplates || existingTemplates.length === 0) {
      console.log('Creating default templates for user:', userId);
      
      const defaultTemplatesToInsert = DEFAULT_TEMPLATES.map(template => ({
        user_id: userId,
        name: template.name,
        description: template.description,
        template: template.template,
        custom_values: {},
        is_default: template.is_default
      }));

      const { data: insertedTemplates, error: insertError } = await supabase
        .from('user_naming_templates')
        .insert(defaultTemplatesToInsert)
        .select();

      if (insertError) {
        console.error('Error creating default templates:', insertError);
        return NextResponse.json({ error: 'Failed to create default templates' }, { status: 500 });
      }

      return NextResponse.json({ templates: insertedTemplates });
    }

    return NextResponse.json({ templates: existingTemplates });

  } catch (error) {
    console.error('Error in GET /api/user/naming-templates:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new custom template
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { name, description, template, customValues } = body;

    if (!name || !template) {
      return NextResponse.json({ error: 'Name and template are required' }, { status: 400 });
    }

    // Check if template name already exists for this user
    const { data: existingTemplate } = await supabase
      .from('user_naming_templates')
      .select('id')
      .eq('user_id', userId)
      .eq('name', name)
      .single();

    if (existingTemplate) {
      return NextResponse.json({ error: 'Template name already exists' }, { status: 400 });
    }

    // Create new template
    const { data: newTemplate, error: insertError } = await supabase
      .from('user_naming_templates')
      .insert({
        user_id: userId,
        name,
        description: description || '',
        template,
        custom_values: customValues || {},
        is_default: false
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating template:', insertError);
      return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
    }

    return NextResponse.json({ template: newTemplate });

  } catch (error) {
    console.error('Error in POST /api/user/naming-templates:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update an existing template
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { id, name, description, template, customValues } = body;

    if (!id || !name || !template) {
      return NextResponse.json({ error: 'ID, name and template are required' }, { status: 400 });
    }

    // Update template
    const { data: updatedTemplate, error: updateError } = await supabase
      .from('user_naming_templates')
      .update({
        name,
        description: description || '',
        template,
        custom_values: customValues || {},
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating template:', updateError);
      return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
    }

    return NextResponse.json({ template: updatedTemplate });

  } catch (error) {
    console.error('Error in PUT /api/user/naming-templates:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete a template
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('id');

    if (!templateId) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
    }

    // Delete template (only custom templates, not default ones)
    const { error: deleteError } = await supabase
      .from('user_naming_templates')
      .delete()
      .eq('id', templateId)
      .eq('user_id', userId)
      .eq('is_default', false);

    if (deleteError) {
      console.error('Error deleting template:', deleteError);
      return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in DELETE /api/user/naming-templates:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
