import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/options';
import connectDB from '@/lib/database';
import UserActivity from '@/models/UserActivity';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');
    const period = searchParams.get('period') || '30';

    const now = new Date();
    const start = new Date(now.getTime() - parseInt(period) * 24 * 60 * 60 * 1000);

    const query: any = { createdAt: { $gte: start, $lte: now } };
    if (domain) query.companyDomain = domain;

    console.log('Analytics query:', query);
    console.log('Date range:', { start, now });

    const activities = await (UserActivity as any).find(query).sort({ createdAt: -1 });
    const users = await (User as any).find(domain ? { companyDomain: domain } : {}).select('email name companyDomain createdAt');

    console.log('Found activities:', activities.length);
    console.log('Found users:', users.length);

    const stats = {
      totalUsers: users.length,
      totalDownloads: activities.filter(a => a.activityType === 'video_download').length,
      totalProjects: activities.filter(a => a.activityType === 'project_created').length,
      totalCost: activities.reduce((sum, a) => sum + (a.cost || 0), 0),
      totalVideoDuration: activities.reduce((sum, a) => sum + (a.videoDuration || 0), 0),
    };

    const domainStats = await UserActivity.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$companyDomain',
          totalUsers: { $addToSet: '$userId' },
          totalDownloads: { $sum: { $cond: [{ $eq: ['$activityType', 'video_download'] }, 1, 0] } },
          totalCost: { $sum: '$cost' },
        }
      },
      {
        $project: {
          domain: '$_id',
          totalUsers: { $size: '$totalUsers' },
          totalDownloads: 1,
          totalCost: 1,
        }
      },
      { $sort: { totalCost: -1 } }
    ]);

    console.log('Domain stats:', domainStats);

    return NextResponse.json({
      success: true,
      stats,
      domainStats,
      activities: activities.slice(0, 100),
      users: users.slice(0, 100),
    });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { activityType, projectId, projectName, videoDuration, videoSize, cost, metadata } = body;

    const user = await (User as any).findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let calculatedCost = cost;
    if (!calculatedCost && activityType === 'video_download') {
      const durationInSeconds = (videoDuration || 0) / 1000;
      const sizeInMB = (videoSize || 0) / (1024 * 1024);
      calculatedCost = (durationInSeconds * 0.01) + (sizeInMB * 0.001);
    }

    const activity = await (UserActivity as any).create({
      userId: user._id.toString(),
      userEmail: user.email,
      companyDomain: user.companyDomain,
      activityType,
      projectId,
      projectName,
      videoDuration,
      videoSize,
      cost: calculatedCost,
      metadata,
    });

    return NextResponse.json({
      success: true,
      activity,
      message: 'Activity recorded successfully'
    });

  } catch (error) {
    console.error('Error recording activity:', error);
    return NextResponse.json({ error: 'Failed to record activity' }, { status: 500 });
  }
}
