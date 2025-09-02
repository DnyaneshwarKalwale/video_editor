import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/options';
import { supabase, TABLES } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');
    const period = searchParams.get('period') || '30';

    const now = new Date();
    const start = new Date(now.getTime() - parseInt(period) * 24 * 60 * 60 * 1000);

    // Build query for activities
    let activitiesQuery = supabase
      .from(TABLES.USER_ACTIVITIES)
      .select('*')
      .gte('created_at', start.toISOString())
      .lte('created_at', now.toISOString())
      .order('created_at', { ascending: false });

    if (domain) {
      activitiesQuery = activitiesQuery.eq('company_domain', domain);
    }

    const { data: activities, error: activitiesError } = await activitiesQuery;

    if (activitiesError) {
      console.error('Analytics activities error:', activitiesError);
      return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
    }

    // Build query for users
    let usersQuery = supabase
      .from(TABLES.USERS)
      .select('email, name, company_domain, created_at');

    if (domain) {
      usersQuery = usersQuery.eq('company_domain', domain);
    }

    const { data: users, error: usersError } = await usersQuery;

    if (usersError) {
      console.error('Analytics users error:', usersError);
      return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
    }

    console.log('Found activities:', activities?.length || 0);
    console.log('Found users:', users?.length || 0);

    const stats = {
      totalUsers: users?.length || 0,
      totalDownloads: activities?.filter(a => a.activity_type === 'video_download').length || 0,
      totalProjects: activities?.filter(a => a.activity_type === 'project_created').length || 0,
      totalCost: activities?.reduce((sum, a) => sum + (a.cost || 0), 0) || 0,
      totalVideoDuration: activities?.reduce((sum, a) => sum + (a.video_duration || 0), 0) || 0,
    };

    // Get domain statistics
    const domainStats = activities?.reduce((acc, activity) => {
      const domain = activity.company_domain;
      if (!acc[domain]) {
        acc[domain] = {
          domain,
          users: 0,
          downloads: 0,
          projects: 0,
          cost: 0,
          videoDuration: 0,
        };
      }
      
      if (activity.activity_type === 'video_download') acc[domain].downloads++;
      if (activity.activity_type === 'project_created') acc[domain].projects++;
      acc[domain].cost += activity.cost || 0;
      acc[domain].videoDuration += activity.video_duration || 0;
      
      return acc;
    }, {} as Record<string, any>) || {};

    // Count users per domain
    users?.forEach(user => {
      const domain = user.company_domain;
      if (domainStats[domain]) {
        domainStats[domain].users++;
      }
    });

    return NextResponse.json({
      success: true,
      stats,
      activities: activities || [],
      users: users || [],
      domainStats: Object.values(domainStats),
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      activityType, 
      projectId, 
      projectName, 
      videoDuration, 
      videoSize, 
      cost, 
      metadata 
    } = body;

    if (!activityType) {
      return NextResponse.json({ error: 'Activity type is required' }, { status: 400 });
    }

    const { data: activity, error } = await supabase
      .from(TABLES.USER_ACTIVITIES)
      .insert({
        user_id: session.user.id,
        user_email: session.user.email || '',
        company_domain: session.user.companyDomain || '',
        activity_type: activityType,
        project_id: projectId,
        project_name: projectName,
        video_duration: videoDuration,
        cost: cost || 0,
        metadata: metadata || {},
        user_agent: request.headers.get('user-agent') || '',
      })
      .select()
      .single();

    if (error) {
      console.error('Activity tracking error:', error);
      return NextResponse.json({ error: 'Failed to track activity' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      activity: {
        id: activity.id,
        activityType: activity.activity_type,
        projectId: activity.project_id,
        projectName: activity.project_name,
        videoDuration: activity.video_duration,
        cost: activity.cost,
        createdAt: activity.created_at,
      },
    });
  } catch (error) {
    console.error('Activity tracking error:', error);
    return NextResponse.json({ error: 'Failed to track activity' }, { status: 500 });
  }
}
