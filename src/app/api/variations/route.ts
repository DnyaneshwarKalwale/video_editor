import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import Variation from '@/models/Variation';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { 
      userId, 
      projectId, 
      originalElementId, 
      originalText, 
      generatedText, 
      aiModel, 
      confidence 
    } = body;

    if (!userId || !projectId || !originalElementId || !originalText || !generatedText) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const variation = await Variation.create({
      userId,
      projectId,
      originalElementId,
      originalText,
      generatedText,
      aiModel: aiModel || 'gpt-4',
      confidence: confidence || 0.8,
    });

    return NextResponse.json({
      success: true,
      variation: {
        id: variation._id,
        originalElementId: variation.originalElementId,
        originalText: variation.originalText,
        generatedText: variation.generatedText,
        aiModel: variation.aiModel,
        confidence: variation.confidence,
        createdAt: variation.createdAt,
      },
    });
  } catch (error) {
    console.error('Variation creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create variation' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const projectId = searchParams.get('projectId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }

    const query: any = { userId };
    if (projectId) {
      query.projectId = projectId;
    }

    const variations = await Variation.find(query)
      .sort({ createdAt: -1 })
      .select('originalElementId originalText generatedText aiModel confidence createdAt');

    return NextResponse.json({
      success: true,
      variations,
    });
  } catch (error) {
    console.error('Variation fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch variations' },
      { status: 500 }
    );
  }
}
