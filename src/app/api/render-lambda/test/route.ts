import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Check if AWS credentials are configured
    const hasCredentials = !!(process.env.REMOTION_AWS_ACCESS_KEY_ID && process.env.REMOTION_AWS_SECRET_ACCESS_KEY);
    
    // Check if Lambda function exists
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    let lambdaFunctionExists = false;
    try {
      const { stdout } = await execAsync('npx remotion lambda functions list', {
        env: {
          ...process.env,
          REMOTION_AWS_ACCESS_KEY_ID: process.env.REMOTION_AWS_ACCESS_KEY_ID,
          REMOTION_AWS_SECRET_ACCESS_KEY: process.env.REMOTION_AWS_SECRET_ACCESS_KEY,
        },
        timeout: 10000
      });
      
      lambdaFunctionExists = stdout.includes('remotion-render-4-0-339-mem2048mb-disk2048mb-120sec');
    } catch (error) {
      console.error('Error checking Lambda function:', error);
    }
    
    // Check if site exists
    let siteExists = false;
    try {
      const { stdout } = await execAsync('npx remotion lambda sites list', {
        env: {
          ...process.env,
          REMOTION_AWS_ACCESS_KEY_ID: process.env.REMOTION_AWS_ACCESS_KEY_ID,
          REMOTION_AWS_SECRET_ACCESS_KEY: process.env.REMOTION_AWS_SECRET_ACCESS_KEY,
        },
        timeout: 10000
      });
      
      siteExists = stdout.includes('video-editor');
    } catch (error) {
      console.error('Error checking Lambda site:', error);
    }
    
    return NextResponse.json({
      status: 'ok',
      checks: {
        awsCredentials: hasCredentials,
        lambdaFunction: lambdaFunctionExists,
        siteDeployed: siteExists,
        serveUrl: 'https://remotionlambda-useast1-ad9v3yryvx.s3.us-east-1.amazonaws.com/sites/video-editor/index.html'
      },
      message: hasCredentials && lambdaFunctionExists && siteExists 
        ? 'Lambda setup is ready for rendering' 
        : 'Lambda setup needs configuration'
    });
    
  } catch (error) {
    console.error('Error in Lambda test endpoint:', error);
    return NextResponse.json({ 
      error: 'Failed to test Lambda setup',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
