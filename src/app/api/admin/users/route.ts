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

    // Build query for users
    let usersQuery = supabase
      .from(TABLES.USERS)
      .select('*')
      .order('created_at', { ascending: false });

    if (domain) {
      usersQuery = usersQuery.eq('company_domain', domain);
    }

    const { data: users, error: usersError } = await usersQuery;

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    // Get detailed user stats with activities
    const userStats = await Promise.all(
      (users || []).map(async (user) => {
        // Get user activities
        const { data: activities, error: activitiesError } = await supabase
          .from(TABLES.USER_ACTIVITIES)
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (activitiesError) {
          console.error('Error fetching user activities:', activitiesError);
        }

        const userActivities = activities || [];
        
        const stats = {
          totalDownloads: userActivities.filter((a: any) => a.activity_type === 'video_download').length,
          totalProjects: userActivities.filter((a: any) => a.activity_type === 'project_created').length,
          totalCost: userActivities.reduce((sum: number, a: any) => sum + (a.cost || 0), 0),
          lastActivity: userActivities.length > 0 ? userActivities[0].created_at : null,
        };

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          companyDomain: user.company_domain,
          createdAt: user.created_at,
          isActive: user.is_active,
          stats,
          recentActivities: userActivities.slice(0, 5).map((a: any) => ({
            type: a.activity_type,
            projectName: a.project_name,
            cost: a.cost,
            createdAt: a.created_at,
          }))
        };
      })
    );

    return NextResponse.json({
      success: true,
      users: userStats
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
