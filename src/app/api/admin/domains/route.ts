import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/options';
import { supabase, TABLES } from '@/lib/supabase';

// GET - Fetch all domains
export async function GET() {
  try {
    const { data: domains, error } = await supabase
      .from(TABLES.COMPANY_DOMAINS)
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching domains:', error);
      return NextResponse.json(
        { error: 'Failed to fetch domains' },
        { status: 500 }
      );
    }
    
    console.log('🔍 Admin domains API: Raw domains data:', domains);
    
    // Transform the data to match the frontend interface
    const transformedDomains = (domains || []).map(domain => ({
      id: domain.id,
      domain: domain.domain,
      companyName: domain.company_name,
      isActive: domain.is_active,
      addedBy: domain.added_by,
      createdAt: domain.created_at,
    }));
    
    return NextResponse.json({
      domains: transformedDomains,
    });
  } catch (error) {
    console.error('Error fetching domains:', error);
    return NextResponse.json(
      { error: 'Failed to fetch domains' },
      { status: 500 }
    );
  }
}

// POST - Add new domain
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { domain, companyName } = await request.json();
    
    if (!domain || !companyName) {
      return NextResponse.json(
        { error: 'Domain and company name are required' },
        { status: 400 }
      );
    }
    
    // Check if domain already exists
    const { data: existingDomain, error: checkError } = await supabase
      .from(TABLES.COMPANY_DOMAINS)
      .select('id')
      .eq('domain', domain.toLowerCase())
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking existing domain:', checkError);
      return NextResponse.json(
        { error: 'Failed to check domain' },
        { status: 500 }
      );
    }
    
    if (existingDomain) {
      return NextResponse.json(
        { error: 'Domain already exists' },
        { status: 400 }
      );
    }
    
    // Create new domain
    const { data: newDomain, error: createError } = await supabase
      .from(TABLES.COMPANY_DOMAINS)
      .insert({
        domain: domain.toLowerCase().trim(),
        company_name: companyName.trim(),
        added_by: session.user.email || 'admin',
        is_active: true,
      })
      .select()
      .single();
    
    if (createError) {
      console.error('Error creating domain:', createError);
      return NextResponse.json(
        { error: 'Failed to add domain' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      message: 'Domain added successfully',
      domain: newDomain,
    });
  } catch (error) {
    console.error('Error adding domain:', error);
    return NextResponse.json(
      { error: 'Failed to add domain' },
      { status: 500 }
    );
  }
}
