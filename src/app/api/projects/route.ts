import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import Project from '@/models/Project';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { userId, name, platform, trackItems, size, metadata } = body;

    if (!userId || !name || !platform) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const project = await Project.create({
      userId,
      name,
      platform,
      trackItems,
      size,
      metadata,
    });

    return NextResponse.json({
      success: true,
      project: {
        id: project._id,
        name: project.name,
        platform: project.platform,
        createdAt: project.createdAt,
      },
    });
  } catch (error) {
    console.error('Project creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }

    const projects = await Project.find({ userId })
      .sort({ updatedAt: -1 })
      .select('name platform createdAt updatedAt');

    return NextResponse.json({
      success: true,
      projects,
    });
  } catch (error) {
    console.error('Project fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}
