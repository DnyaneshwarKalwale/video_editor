import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    
    // Get user's progress bar settings
    const { data: user, error } = await supabase
      .from('users')
      .select('progress_bar_settings')
      .eq('email', session.user.email)
      .single();

    if (error) {
      console.error('Error fetching progress bar settings:', error);
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }

    console.log('[Progress Bar API] User settings from database:', {
      userEmail: session.user.email,
      hasSettings: !!user?.progress_bar_settings,
      settings: user?.progress_bar_settings
    });

    return NextResponse.json({ 
      settings: user?.progress_bar_settings || null 
    });

  } catch (error) {
    console.error('Error in GET /api/progress-bar-settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { settings } = body;

    if (!settings) {
      return NextResponse.json({ error: 'Settings are required' }, { status: 400 });
    }

    
    // Update user's progress bar settings
    const { error } = await supabase
      .from('users')
      .update({ 
        progress_bar_settings: settings,
        updated_at: new Date().toISOString()
      })
      .eq('email', session.user.email);

    if (error) {
      console.error('Error updating progress bar settings:', error);
      return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Progress bar settings saved successfully' 
    });

  } catch (error) {
    console.error('Error in POST /api/progress-bar-settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
