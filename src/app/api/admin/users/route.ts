import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/options';
import connectDB from '@/lib/database';
import User from '@/models/User';
import UserActivity from '@/models/UserActivity';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');

    // Get all users
    const userQuery: any = {};
    if (domain) {
      userQuery.companyDomain = domain;
    }

    const users = await (User as any).find(userQuery).sort({ createdAt: -1 });

    // Get detailed user stats with activities
    const userStats = await Promise.all(
      users.map(async (user) => {
        const activities = await (UserActivity as any).find({ userId: user._id.toString() });
        
        const stats = {
          totalDownloads: activities.filter(a => a.activityType === 'video_download').length,
          totalProjects: activities.filter(a => a.activityType === 'project_created').length,
          totalCost: activities.reduce((sum, a) => sum + (a.cost || 0), 0),
          lastActivity: activities.length > 0 ? activities[0].createdAt : null,
        };

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          companyDomain: user.companyDomain,
          createdAt: user.createdAt,
          isActive: user.isActive,
          stats,
          recentActivities: activities.slice(0, 5).map(a => ({
            type: a.activityType,
            projectName: a.projectName,
            cost: a.cost,
            createdAt: a.createdAt,
          }))
        };
      })
    );

    return NextResponse.json({
      success: true,
      users: userStats,
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
