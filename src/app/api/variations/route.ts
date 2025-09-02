import { NextRequest, NextResponse } from 'next/server';
import { supabase, TABLES } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
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

    const { data: variation, error } = await supabase
      .from(TABLES.VARIATIONS)
      .insert({
        user_id: userId,
        project_id: projectId,
        original_element_id: originalElementId,
        original_text: originalText,
        generated_text: generatedText,
        ai_model: aiModel || 'gpt-4',
        confidence: confidence || 0.8,
      })
      .select()
      .single();

    if (error) {
      console.error('Variation creation error:', error);
      return NextResponse.json(
        { error: 'Failed to create variation' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      variation: {
        id: variation.id,
        originalElementId: variation.original_element_id,
        originalText: variation.original_text,
        generatedText: variation.generated_text,
        aiModel: variation.ai_model,
        confidence: variation.confidence,
        createdAt: variation.created_at,
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
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const projectId = searchParams.get('projectId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }

    let query = supabase
      .from(TABLES.VARIATIONS)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { data: variations, error } = await query;

    if (error) {
      console.error('Variation fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch variations' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      variations: variations?.map(variation => ({
        id: variation.id,
        originalElementId: variation.original_element_id,
        originalText: variation.original_text,
        generatedText: variation.generated_text,
        aiModel: variation.ai_model,
        confidence: variation.confidence,
        createdAt: variation.created_at,
      })) || [],
    });
  } catch (error) {
    console.error('Variation fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch variations' },
      { status: 500 }
    );
  }
}
