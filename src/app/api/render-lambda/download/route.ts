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
  
  // Redirect to the main route's PUT endpoint
  const redirectUrl = new URL(request.url);
  redirectUrl.pathname = '/api/render-lambda';
  
  return NextResponse.redirect(redirectUrl.toString());
}
