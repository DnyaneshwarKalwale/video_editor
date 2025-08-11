import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { prompt, count } = await request.json();

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a top-tier direct response copywriter trained in the principles of Sabri Suby, Dan Kennedy, and Russell Brunson.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content;

    if (!aiResponse) {
      throw new Error('No response from OpenAI API');
    }

    // Parse the numbered list response from AI
    const lines = aiResponse.split('\n').filter((line: string) => line.trim());
    const variations = lines
      .map((line: string) => {
        // Remove numbering (1., 2., etc.) and clean up
        const cleaned = line.replace(/^\d+\.\s*/, '').trim();
        return cleaned;
      })
      .filter((variation: string) => variation.length > 0)
      .slice(0, count);

    return NextResponse.json({ variations });
  } catch (error: unknown) {
    console.error('OpenAI API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
