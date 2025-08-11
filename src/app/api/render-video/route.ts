import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

// Store for background jobs
const jobs = new Map();

// Increase timeout for video rendering (5 minutes)
const RENDER_TIMEOUT = 5 * 60 * 1000; // 5 minutes

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { variation, textOverlays, platformConfig, duration, videoTrackItems, audioTrackItems } = body;

    // Generate unique job ID
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Initialize job status
    jobs.set(jobId, {
      status: 'processing',
      progress: 0,
      error: null,
      videoUrl: null,
      startTime: Date.now()
    });

    // Start background rendering
    renderVideoInBackground(jobId, {
      variation,
      textOverlays,
      platformConfig,
      duration,
      videoTrackItems,
      audioTrackItems
    });

    // Return immediately with job ID
    return NextResponse.json({ 
      jobId,
      status: 'processing',
      message: 'Video rendering started. Use the job ID to check progress.'
    });

  } catch (error) {
    console.error('Error starting video render:', error);
    return NextResponse.json({ 
      error: 'Failed to start video rendering',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function renderVideoInBackground(jobId: string, videoData: any) {
  try {
    console.log(`Starting background render for job ${jobId}`);
    
    // Update job status
    jobs.set(jobId, {
      ...jobs.get(jobId),
      status: 'processing',
      progress: 5
    });

    // Create a temporary JSON file with the video data
    const tempDataPath = path.join(process.cwd(), `temp-video-data-${jobId}.json`);
    fs.writeFileSync(tempDataPath, JSON.stringify(videoData, null, 2));

    // Output path for the rendered video
    const outputPath = path.join(process.cwd(), `output-${videoData.variation.id}-${jobId}.mp4`);

    // Set environment variables for Chrome
    const env = {
      ...process.env,
      PUPPETEER_SKIP_CHROMIUM_DOWNLOAD: 'true',
      PUPPETEER_EXECUTABLE_PATH: '/usr/bin/google-chrome-stable',
      CHROME_BIN: '/usr/bin/google-chrome-stable'
    };
    
    // Use Remotion CLI to render the video
    const remotionCommand = `npx remotion render src/remotion/entry.tsx VideoComposition ${outputPath} --props=${tempDataPath} --fps=30 --width=${videoData.platformConfig.width} --height=${videoData.platformConfig.height} --concurrency=2 --jpeg-quality=80`;

    console.log(`Executing Remotion command for job ${jobId}:`, remotionCommand);
    
    // Execute with timeout and progress tracking
    const { stdout, stderr } = await execAsync(remotionCommand, { 
      env,
      timeout: RENDER_TIMEOUT 
    });
    
    console.log(`Render completed for job ${jobId}`);

    // Check if the video file was created
    if (!fs.existsSync(outputPath)) {
      throw new Error('Video file was not created');
    }

    // Get file size for logging
    const stats = fs.statSync(outputPath);
    console.log(`Video file created successfully for job ${jobId}:`, {
      path: outputPath,
      size: `${(stats.size / 1024 / 1024).toFixed(2)} MB`
    });

    // Read the video file
    const videoBuffer = fs.readFileSync(outputPath);

    // Clean up temporary files
    fs.unlinkSync(tempDataPath);
    fs.unlinkSync(outputPath);

    // Update job status to completed
    jobs.set(jobId, {
      status: 'completed',
      progress: 100,
      error: null,
      videoBuffer: videoBuffer,
      videoSize: stats.size,
      completedTime: Date.now()
    });

    console.log(`Job ${jobId} completed successfully`);

  } catch (error) {
    console.error(`Error in background render for job ${jobId}:`, error);
    
    // Clean up any temporary files on error
    try {
      const tempDataPath = path.join(process.cwd(), `temp-video-data-${jobId}.json`);
      if (fs.existsSync(tempDataPath)) {
        fs.unlinkSync(tempDataPath);
      }
    } catch (cleanupError) {
      console.error('Error cleaning up temp files:', cleanupError);
    }
    
    // Update job status to failed
    jobs.set(jobId, {
      status: 'failed',
      progress: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
      completedTime: Date.now()
    });
  }
}

// New endpoint to check job status
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('jobId');
  
  if (!jobId) {
    return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
  }
  
  const job = jobs.get(jobId);
  
  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }
  
  if (job.status === 'completed') {
    // Return the video file
    return new NextResponse(job.videoBuffer, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': `attachment; filename="variation-${jobId}.mp4"`,
        'Content-Length': job.videoSize.toString(),
      },
    });
  }
  
  // Return job status
  return NextResponse.json({
    jobId,
    status: job.status,
    progress: job.progress,
    error: job.error,
    startTime: job.startTime,
    completedTime: job.completedTime
  });
} 