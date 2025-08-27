import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import CompanyDomain from '@/models/CompanyDomain';

// GET - Fetch all domains
export async function GET() {
  try {
    await connectDB();
    
    const domains = await CompanyDomain.find().sort({ createdAt: -1 });
    
    return NextResponse.json({
      domains: domains,
    });
  } catch (error) {
    console.error('Error fetching domains:', error);
    return NextResponse.json(
      { error: 'Failed to fetch domains' },
      { status: 500 }
    );
  }
}

// POST - Add new domain
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const { domain, companyName } = await request.json();
    
    if (!domain || !companyName) {
      return NextResponse.json(
        { error: 'Domain and company name are required' },
        { status: 400 }
      );
    }
    
    // Check if domain already exists
    const existingDomain = await CompanyDomain.findOne({ domain: domain.toLowerCase() });
    if (existingDomain) {
      return NextResponse.json(
        { error: 'Domain already exists' },
        { status: 400 }
      );
    }
    
    // Create new domain
    const newDomain = await CompanyDomain.create({
      domain: domain.toLowerCase(),
      companyName,
      addedBy: 'admin', // You can get actual admin ID from session
      isActive: true,
    });
    
    return NextResponse.json({
      message: 'Domain added successfully',
      domain: newDomain,
    });
  } catch (error) {
    console.error('Error adding domain:', error);
    return NextResponse.json(
      { error: 'Failed to add domain' },
      { status: 500 }
    );
  }
}
