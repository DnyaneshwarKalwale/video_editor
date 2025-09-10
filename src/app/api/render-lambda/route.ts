import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({ message: 'Render Lambda API' });
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ message: 'POST not implemented' });
}
