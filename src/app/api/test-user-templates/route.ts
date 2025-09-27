import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/options';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    console.log('Testing user templates table...');
    
    const session = await getServerSession(authOptions);
    console.log('Session:', session ? 'Found' : 'Not found');
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    console.log('User ID:', userId);

    // Test if table exists by trying to select from it
    const { data, error } = await supabase
      .from('user_naming_templates')
      .select('*')
      .eq('user_id', userId)
      .limit(1);

    if (error) {
      console.error('Table access error:', error);
      return NextResponse.json({ 
        error: 'Table access failed', 
        details: error.message,
        code: error.code 
      }, { status: 500 });
    }

    console.log('Table access successful, found templates:', data?.length || 0);

    return NextResponse.json({ 
      success: true, 
      tableExists: true,
      templateCount: data?.length || 0,
      userId: userId
    });

  } catch (error) {
    console.error('Error testing user templates table:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
