import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { generateVariationFileName } from '@/utils/variation-naming';

const execAsync = promisify(exec);

// Increase timeout for video rendering (20 minutes)
const RENDER_TIMEOUT = 20 * 60 * 1000; // 20 minutes

// In-memory job store (in production, use Redis or database)
const jobStore = new Map<string, {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  result?: string; // file path
  error?: string;
  createdAt: Date;
  completedAt?: Date;
  videoData?: any; // Store video data for processing
  cancelled?: boolean; // Flag to track cancellation requests
  process?: any; // Store the child process for cancellation
}>();

// Job queue to ensure only one video renders at a time
let isProcessing = false;
const jobQueue: string[] = [];

// Global lock to prevent any concurrent processing
let globalLock = false;

// Process next job in queue
async function processNextJob() {
  if (isProcessing || jobQueue.length === 0 || globalLock) {
    return;
  }
  
  isProcessing = true;
  globalLock = true;
  
  const jobId = jobQueue.shift()!;
  const job = jobStore.get(jobId);
  
  if (job && job.videoData) {
    console.log(`[Queue] Processing job ${jobId} (${jobQueue.length} jobs remaining in queue)`);
    try {
      await processVideoJob(jobId, job.videoData);
    } finally {
      // Always release the lock
      isProcessing = false;
      globalLock = false;
      
      // Process next job if any
      if (jobQueue.length > 0) {
        setTimeout(processNextJob, 2000); // Wait 2 seconds before next job
      }
    }
  } else {
    isProcessing = false;
    globalLock = false;
  }
}

// Background processing function
async function processVideoJob(jobId: string, videoData: any) {
  let tempDataPath: string | null = null;
  let outputPath: string | null = null;
  let childProcess: any = null;
  
  try {
    // Update job status to processing
    const job = jobStore.get(jobId);
    if (job) {
      job.status = 'processing';
      job.progress = 5;
      jobStore.set(jobId, job);
    }
    
    console.log(`[Job ${jobId}] Starting render for ${videoData.duration}ms duration (${Math.round(videoData.duration/1000)}s)`);

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
    
    // Use Remotion CLI to render the video with optimized settings for longer videos
    const remotionCommand = `npx remotion render src/remotion/entry.tsx VideoComposition ${outputPath} --props=${tempDataPath} --fps=24 --width=${videoData.platformConfig.width} --height=${videoData.platformConfig.height} --concurrency=1 --jpeg-quality=60 --memory-limit=1024 --codec=h264 --crf=28`;

    console.log(`[Job ${jobId}] Starting video render...`);
    
    // Kill any existing Chrome processes to free up memory
    try {
      await execAsync('pkill -f chrome-headless || true');
      console.log(`[Job ${jobId}] Cleaned up existing Chrome processes`);
    } catch (error) {
      console.log(`[Job ${jobId}] No existing Chrome processes to clean up`);
    }
    
    // Execute with spawn to allow cancellation
    const { spawn } = require('child_process');
    const remotionArgs = [
      'remotion', 'render', 'src/remotion/entry.tsx', 'VideoComposition', outputPath,
      '--props=' + tempDataPath,
      '--fps=24',
      '--width=' + videoData.platformConfig.width,
      '--height=' + videoData.platformConfig.height,
      '--concurrency=1',
      '--jpeg-quality=60',
      '--memory-limit=1024',
      '--codec=h264',
      '--crf=28'
    ];
    
    childProcess = spawn('npx', remotionArgs, { 
      env,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    // Store the process in the job for cancellation
    const currentJob = jobStore.get(jobId);
    if (currentJob) {
      currentJob.process = childProcess;
      jobStore.set(jobId, currentJob);
    }
    
    // Set up cancellation check interval
    const cancellationCheck = setInterval(() => {
      const currentJob = jobStore.get(jobId);
      if (currentJob?.cancelled) {
        console.log(`[Job ${jobId}] Cancellation requested, killing process...`);
        childProcess.kill('SIGTERM');
        clearInterval(cancellationCheck);
      }
    }, 1000);
    
    // Wait for process to complete
    await new Promise<void>((resolve, reject) => {
      childProcess.on('close', (code: number) => {
        clearInterval(cancellationCheck);
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Process exited with code ${code}`));
        }
      });
      
      childProcess.on('error', (error: any) => {
        clearInterval(cancellationCheck);
        reject(error);
      });
      
      // Set timeout
      setTimeout(() => {
        clearInterval(cancellationCheck);
        childProcess.kill('SIGTERM');
        reject(new Error('Render timeout'));
      }, RENDER_TIMEOUT);
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

// Function to reset queue and processing state
function resetQueue() {
  isProcessing = false;
  globalLock = false;
  jobQueue.length = 0;
  console.log('[Queue] Reset queue and processing state');
}

// Test endpoint to check if video file exists
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get('id');
  const jobId = searchParams.get('jobId');
  const action = searchParams.get('action');
  
  // Reset queue action
  if (action === 'reset') {
    resetQueue();
    return NextResponse.json({ message: 'Queue reset successfully' });
  }
  
  // Cancel job action
  if (action === 'cancel' && jobId) {
    const job = jobStore.get(jobId);
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }
    
    if (job.status === 'completed' || job.status === 'failed') {
      return NextResponse.json({ error: 'Cannot cancel completed or failed job' }, { status: 400 });
    }
    
    // Mark job as cancelled
    job.cancelled = true;
    job.status = 'cancelled';
    job.completedAt = new Date();
    jobStore.set(jobId, job);
    
    // Kill the process if it's running
    if (job.process) {
      try {
        job.process.kill('SIGTERM');
        console.log(`[Job ${jobId}] Process killed due to cancellation`);
      } catch (error) {
        console.error(`[Job ${jobId}] Error killing process:`, error);
      }
    }
    
    return NextResponse.json({ message: 'Job cancelled successfully' });
  }
  
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

    // Create video data with duration limit for performance
    const maxDuration = 90000; // 90 seconds maximum
    const actualDuration = Math.min(duration || 5000, maxDuration);
    
    // Generate unique job ID
    const jobId = `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    if (duration && duration > maxDuration) {
      console.log(`[Job ${jobId}] Duration capped from ${duration}ms to ${maxDuration}ms for performance`);
    }
    
    const videoData = {
      variation: variation || { id: 'default', isOriginal: true },
      textOverlays: textOverlays || [],
      platformConfig: platformConfig || { width: 1080, height: 1920, aspectRatio: '9:16' },
      duration: actualDuration,
      videoTrackItems: videoTrackItems || [],
      audioTrackItems: audioTrackItems || [],
    };
    
    // Create job entry
    const job = {
      id: jobId,
      status: 'pending' as const,
      progress: 0,
      createdAt: new Date(),
      videoData: videoData // Store video data for later processing
    };
    
    jobStore.set(jobId, job);

    console.log(`[Job ${jobId}] Created new video render job`);

    // Add to queue instead of processing immediately
    jobQueue.push(jobId);
    console.log(`[Queue] Added job ${jobId} to queue (${jobQueue.length} jobs in queue, isProcessing: ${isProcessing}, globalLock: ${globalLock})`);
    
    // Start processing if not already processing
    if (!isProcessing && !globalLock) {
      processNextJob();
    }

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
      
      // Generate meaningful filename based on variation data
      const filename = generateVariationFileName(job.videoData, job.videoData?.projectName);
      
      return new NextResponse(videoBuffer, {
        headers: {
          'Content-Type': 'video/mp4',
          'Content-Disposition': `attachment; filename="${filename}"`,
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