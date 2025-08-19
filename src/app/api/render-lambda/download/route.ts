import { NextRequest, NextResponse } from 'next/server';

// In-memory job store reference (same as in main route)
const lambdaJobStore = new Map<string, {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  result?: string; // S3 URL
  error?: string;
  createdAt: Date;
  completedAt?: Date;
  renderId?: string;
}>();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('jobId');
  
  if (!jobId) {
    return NextResponse.json({ error: 'Job ID required' }, { status: 400 });
  }
  
  // For now, we'll redirect to the main route since the job store is in memory
  // In production, you'd want to use a database or Redis
  return NextResponse.redirect(new URL(`/api/render-lambda?jobId=${jobId}`, request.url));
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('jobId');
  
  if (!jobId) {
    return NextResponse.json({ error: 'Job ID required' }, { status: 400 });
  }
  
  // This endpoint will be handled by the main route's PUT method
  // We'll redirect the request
  const url = new URL(request.url);
  url.pathname = '/api/render-lambda';
  
  const newRequest = new Request(url.toString(), {
    method: 'PUT',
    headers: request.headers,
    body: request.body
  });
  
  // Import and call the PUT handler from the main route
  const { PUT } = await import('../route');
  return PUT(newRequest);
}
