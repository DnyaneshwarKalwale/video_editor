import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

// Increase timeout for video rendering (20 minutes)
const RENDER_TIMEOUT = 20 * 60 * 1000; // 20 minutes

// In-memory job store (in production, use Redis or database)
const jobStore = new Map<string, {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  result?: string; // file path
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}>();

// Background processing function
async function processVideoJob(jobId: string, videoData: any) {
  let tempDataPath: string | null = null;
  let outputPath: string | null = null;
  
  try {
    // Update job status to processing
    const job = jobStore.get(jobId);
    if (job) {
      job.status = 'processing';
      job.progress = 10;
      jobStore.set(jobId, job);
    }

    // Create a temporary JSON file with the video data
    tempDataPath = path.join(process.cwd(), `temp-video-data-${jobId}.json`);
    fs.writeFileSync(tempDataPath, JSON.stringify(videoData, null, 2));

    // Output path for the rendered video
    outputPath = path.join(process.cwd(), `output-${jobId}.mp4`);

    // Set environment variables for Chrome
    const env = {
      ...process.env,
      PUPPETEER_SKIP_CHROMIUM_DOWNLOAD: 'true',
      PUPPETEER_EXECUTABLE_PATH: '/usr/bin/google-chrome-stable',
      CHROME_BIN: '/usr/bin/google-chrome-stable'
    };
    
    // Use Remotion CLI to render the video
    const remotionCommand = `npx remotion render src/remotion/entry.tsx VideoComposition ${outputPath} --props=${tempDataPath} --fps=30 --width=${videoData.platformConfig.width} --height=${videoData.platformConfig.height} --concurrency=2 --jpeg-quality=80`;

    console.log(`[Job ${jobId}] Starting video render...`);
    
    // Execute with timeout
    const { stdout, stderr } = await execAsync(remotionCommand, { 
      env,
      timeout: RENDER_TIMEOUT 
    });
    
    console.log(`[Job ${jobId}] Render completed successfully`);

    // Check if the video file was created
    if (!fs.existsSync(outputPath)) {
      throw new Error('Video file was not created');
    }

    // Get file size for logging
    const stats = fs.statSync(outputPath);
    console.log(`[Job ${jobId}] Video file created: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

    // Update job status to completed
    if (job) {
      job.status = 'completed';
      job.progress = 100;
      job.result = outputPath;
      job.completedAt = new Date();
      jobStore.set(jobId, job);
    }

    // Clean up temporary JSON file
    try {
      if (tempDataPath && fs.existsSync(tempDataPath)) {
        fs.unlinkSync(tempDataPath);
      }
    } catch (cleanupError) {
      console.log(`[Job ${jobId}] Error cleaning up temp file:`, cleanupError);
    }

  } catch (error) {
    console.error(`[Job ${jobId}] Error rendering video:`, error);
    
    // Update job status to failed
    const job = jobStore.get(jobId);
    if (job) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';
      job.completedAt = new Date();
      jobStore.set(jobId, job);
    }
    
    // Clean up files on error
    try {
      if (tempDataPath && fs.existsSync(tempDataPath)) {
        fs.unlinkSync(tempDataPath);
      }
      if (outputPath && fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
      }
    } catch (cleanupError) {
      console.error(`[Job ${jobId}] Error cleaning up files:`, cleanupError);
    }
  }
}

// Test endpoint to check if video file exists
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get('id');
  const jobId = searchParams.get('jobId');
  
  if (jobId) {
    // Check job status
    const job = jobStore.get(jobId);
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      id: job.id,
      status: job.status,
      progress: job.progress,
      result: job.result,
      error: job.error,
      createdAt: job.createdAt,
      completedAt: job.completedAt
    });
  }
  
  if (!videoId) {
    return NextResponse.json({ error: 'Video ID required' }, { status: 400 });
  }
  
  const outputPath = path.join(process.cwd(), `output-${videoId}.mp4`);
  
  if (!fs.existsSync(outputPath)) {
    return NextResponse.json({ error: 'Video file not found', path: outputPath }, { status: 404 });
  }
  
  const stats = fs.statSync(outputPath);
  return NextResponse.json({ 
    exists: true, 
    path: outputPath,
    size: stats.size,
    sizeMB: (stats.size / 1024 / 1024).toFixed(2)
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { variation, textOverlays, platformConfig, duration, videoTrackItems, audioTrackItems } = body;

    // Create video data
    const videoData = {
      variation: variation || { id: 'default', isOriginal: true },
      textOverlays: textOverlays || [],
      platformConfig: platformConfig || { width: 1080, height: 1920, aspectRatio: '9:16' },
      duration: duration || 5000,
      videoTrackItems: videoTrackItems || [],
      audioTrackItems: audioTrackItems || [],
    };

    // Generate unique job ID
    const jobId = `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Create job entry
    const job = {
      id: jobId,
      status: 'pending' as const,
      progress: 0,
      createdAt: new Date()
    };
    
    jobStore.set(jobId, job);

    console.log(`[Job ${jobId}] Created new video render job`);

    // Start background processing
    processVideoJob(jobId, videoData).catch(error => {
      console.error(`[Job ${jobId}] Background processing error:`, error);
    });

    // Return job ID immediately
    return NextResponse.json({ 
      jobId,
      status: 'pending',
      message: 'Video rendering started in background',
      checkStatusUrl: `/api/render-video?jobId=${jobId}`,
      downloadUrl: `/api/render-video/download?jobId=${jobId}`
    });

  } catch (error) {
    console.error('Error creating video render job:', error);
    
    return NextResponse.json({ 
      error: 'Failed to create video render job',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Download endpoint for completed videos
export async function PUT(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('jobId');
  
  if (!jobId) {
    return NextResponse.json({ error: 'Job ID required' }, { status: 400 });
  }
  
  const job = jobStore.get(jobId);
  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }
  
  if (job.status === 'pending' || job.status === 'processing') {
    return NextResponse.json({ 
      status: job.status,
      progress: job.progress,
      message: 'Video is still being rendered'
    }, { status: 202 });
  }
  
  if (job.status === 'failed') {
    return NextResponse.json({ 
      status: 'failed',
      error: job.error,
      message: 'Video rendering failed'
    }, { status: 500 });
  }
  
  if (job.status === 'completed' && job.result) {
    try {
      // Check if file still exists
      if (!fs.existsSync(job.result)) {
        return NextResponse.json({ error: 'Video file not found' }, { status: 404 });
      }
      
      // Read the video file
      const videoBuffer = fs.readFileSync(job.result);
      
      // Clean up the job and file after successful download
      jobStore.delete(jobId);
      try {
        fs.unlinkSync(job.result);
      } catch (cleanupError) {
        console.error('Error cleaning up video file:', cleanupError);
      }
      
      return new NextResponse(videoBuffer, {
        headers: {
          'Content-Type': 'video/mp4',
          'Content-Disposition': `attachment; filename="variation-${jobId}.mp4"`,
          'Content-Length': videoBuffer.length.toString(),
        },
      });
    } catch (error) {
      console.error('Error reading video file:', error);
      return NextResponse.json({ error: 'Failed to read video file' }, { status: 500 });
    }
  }
  
  return NextResponse.json({ error: 'Invalid job status' }, { status: 400 });
} 