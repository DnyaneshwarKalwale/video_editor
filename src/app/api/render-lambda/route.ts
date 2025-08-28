import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

const execAsync = promisify(exec);

// In-memory job store for Lambda renders
const lambdaJobStore = new Map<string, {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  result?: string; // S3 URL
  error?: string;
  createdAt: Date;
  completedAt?: Date;
  renderId?: string; // Remotion Lambda render ID
  videoData?: any; // Store video data for processing
  cancelled?: boolean; // Flag to track cancellation requests
  renderCost?: number; // AWS Lambda render cost
}>();

// Fair queue system for handling multiple users
let activeJobs = 0;
const maxConcurrentJobs = 10; // Increased to handle more concurrent users
const maxJobsPerUser = 2; // Each user can have max 2 active jobs
const renderQueue: string[] = [];
const userJobCounts = new Map<string, number>(); // Track active jobs per user
const userSessions = new Map<string, string>(); // Track user sessions to prevent conflicts

// Lambda configuration
const LAMBDA_CONFIG = {
  serveUrl: 'https://remotionlambda-useast1-ad9v3yryvx.s3.us-east-1.amazonaws.com/sites/video-editor/index.html',
  compositionId: 'VideoComposition',
  region: 'us-east-1',
  functionName: 'remotion-render-4-0-339-mem3008mb-disk2048mb-900sec'
};

// Cleanup old jobs (run every 5 minutes)
setInterval(() => {
  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
  
  for (const [jobId, job] of Array.from(lambdaJobStore.entries())) {
    // Remove completed/failed/cancelled jobs older than 5 minutes
    if ((job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') && 
        job.completedAt && job.completedAt < fiveMinutesAgo) {
      console.log(`[Cleanup] Removing old job ${jobId} (${job.status})`);
      lambdaJobStore.delete(jobId);
    }
  }
}, 5 * 60 * 1000); // Run every 5 minutes

// Process next job in queue with fair user distribution
async function processNextJob() {
  if (activeJobs >= maxConcurrentJobs || renderQueue.length === 0) {
    return;
  }
  
  // Find the next job from a user who has the least active jobs (but not at max limit)
  let selectedJobId: string | null = null;
  let minUserJobs = Infinity;
  
  for (let i = 0; i < renderQueue.length; i++) {
    const jobId = renderQueue[i];
    const job = lambdaJobStore.get(jobId);
    if (job && job.videoData) {
      const userId = job.videoData.userId || 'anonymous';
      const userActiveJobs = userJobCounts.get(userId) || 0;
      
      // Only consider users who haven't reached their per-user limit
      if (userActiveJobs < maxJobsPerUser && userActiveJobs < minUserJobs) {
        minUserJobs = userActiveJobs;
        selectedJobId = jobId;
      }
    }
  }
  
  if (!selectedJobId) {
    return;
  }
  
  // Remove the selected job from queue
  const jobIndex = renderQueue.indexOf(selectedJobId);
  renderQueue.splice(jobIndex, 1);
  
  const job = lambdaJobStore.get(selectedJobId);
  if (job && job.videoData) {
    const userId = job.videoData.userId || 'anonymous';
    const currentUserJobs = userJobCounts.get(userId) || 0;
    userJobCounts.set(userId, currentUserJobs + 1);
    activeJobs++;
    
    console.log(`[Queue] Processing job ${selectedJobId} for user ${userId} (${renderQueue.length} jobs remaining, ${activeJobs} active, user has ${currentUserJobs + 1}/${maxJobsPerUser} slots)`);
    
    try {
      await processLambdaJob(selectedJobId, job.videoData);
    } finally {
      activeJobs--;
      const finalUserJobs = userJobCounts.get(userId) || 0;
      userJobCounts.set(userId, Math.max(0, finalUserJobs - 1));
      
      // Process next job if any
      if (renderQueue.length > 0) {
        setTimeout(processNextJob, 1000); // Wait 1 second before next job
      }
    }
  }
}

// Process Lambda render job
async function processLambdaJob(jobId: string, videoData: any) {
  try {
    // Update job status to processing
    const job = lambdaJobStore.get(jobId);
    if (job) {
      job.status = 'processing';
      job.progress = 40;
      lambdaJobStore.set(jobId, job);
    }

    console.log(`[Lambda Job ${jobId}] Starting Lambda render for ${videoData.duration}ms duration`);

    // Create temporary JSON file for props
    const tempDataPath = `temp-lambda-data-${jobId}.json`;
    const fs = require('fs');
    fs.writeFileSync(tempDataPath, JSON.stringify(videoData, null, 2));

    // Build the Lambda render command
    const lambdaCommand = `npx remotion lambda render ${LAMBDA_CONFIG.serveUrl} ${LAMBDA_CONFIG.compositionId} --props=${tempDataPath} --region=${LAMBDA_CONFIG.region} --function-name=${LAMBDA_CONFIG.functionName} --concurrency=20 --timeout=600000`;

    console.log(`[Lambda Job ${jobId}] Executing: ${lambdaCommand}`);

    // Execute Lambda render
    const { stdout, stderr } = await execAsync(lambdaCommand, {
      timeout: 600000, // 10 minutes timeout
      env: {
        ...process.env,
        REMOTION_AWS_ACCESS_KEY_ID: process.env.REMOTION_AWS_ACCESS_KEY_ID,
        REMOTION_AWS_SECRET_ACCESS_KEY: process.env.REMOTION_AWS_SECRET_ACCESS_KEY,
      }
    });
  
    console.log(`[Lambda Job ${jobId}] Lambda render completed`);
    console.log(`[Lambda Job ${jobId}] Output:`, stdout);

    // Update progress to 70% when Lambda execution completes
    if (job) {
      job.progress = 70;
      lambdaJobStore.set(jobId, job);
    }

    // Parse the output to extract the S3 URL
    let s3Url: string;
    const outputMatch = stdout.match(/\+ S3\s+(https:\/\/s3\.us-east-1\.amazonaws\.com\/[^\s]+)/);
    if (!outputMatch) {
      // Try alternative pattern without the "+ S3" prefix
      const altMatch = stdout.match(/(https:\/\/s3\.us-east-1\.amazonaws\.com\/[^\s]+)/);
      if (!altMatch) {
        throw new Error('Could not extract S3 URL from Lambda render output');
      }
      s3Url = altMatch[1];
    } else {
      s3Url = outputMatch[1];
    }
    console.log(`[Lambda Job ${jobId}] S3 URL: ${s3Url}`);

    // Extract actual AWS cost from the output
    const extractAWSCost = (stdout: string) => {
      const costMatch = stdout.match(/Estimated cost \$([0-9.]+)/);
      if (costMatch) {
        return parseFloat(costMatch[1]);
      }
      return 0;
    };

    // Get actual AWS cost from output
    const renderCost = extractAWSCost(stdout);
    console.log(`[Lambda Job ${jobId}] AWS cost: $${renderCost.toFixed(6)}`);

    // Track the cost in the job data
    if (job) {
      job.status = 'completed';
      job.progress = 100;
      job.result = s3Url;
      job.completedAt = new Date();
      job.renderCost = renderCost; // Add cost to job data
      lambdaJobStore.set(jobId, job);
    }

    // Save cost to analytics database
    try {
      const connectDB = require('@/lib/database').default;
      const UserActivity = require('@/models/UserActivity').default;
      const User = require('@/models/User').default;

      // Get user from the job data
      if (job?.videoData?.userId) {
        await connectDB();
        
        const user = await User.findById(job.videoData.userId);
        if (user) {
          await UserActivity.create({
            userId: user._id.toString(),
            userEmail: user.email,
            companyDomain: user.companyDomain,
            activityType: 'video_download',
            projectId: job.videoData.projectId || 'unknown',
            projectName: job.videoData.projectName || 'Unknown Project',
            videoDuration: videoData.duration || 5000,
            videoSize: 0, // Will be updated when downloaded
            cost: renderCost,
            metadata: {
              jobId,
              platform: videoData.platformConfig?.aspectRatio || 'unknown',
              awsCost: renderCost,
              memoryMB: 3008,
              durationSeconds: (videoData.duration || 5000) / 1000
            }
          });
          
          console.log(`[Lambda Job ${jobId}] AWS cost tracked for user ${user.email}: $${renderCost.toFixed(6)}`);
        }
      }
    } catch (costError) {
      console.error(`[Lambda Job ${jobId}] Failed to track cost:`, costError);
    }

    // Clean up temporary file
    try {
      if (fs.existsSync(tempDataPath)) {
        fs.unlinkSync(tempDataPath);
      }
    } catch (cleanupError) {
      console.log(`[Lambda Job ${jobId}] Error cleaning up temp file:`, cleanupError);
    }

  } catch (error) {
    console.error(`[Lambda Job ${jobId}] Error in Lambda render:`, error);
    
    // Clean up temporary file on error
    try {
      const fs = require('fs');
      const tempDataPath = `temp-lambda-data-${jobId}.json`;
      if (fs.existsSync(tempDataPath)) {
        fs.unlinkSync(tempDataPath);
      }
    } catch (cleanupError) {
      console.error(`[Lambda Job ${jobId}] Error cleaning up temp file:`, cleanupError);
    }

    // Update job status to failed
    const job = lambdaJobStore.get(jobId);
    if (job) {
      job.status = 'failed';
      job.error = 'Video rendering failed. Please try again.';
      job.completedAt = new Date();
      lambdaJobStore.set(jobId, job);
    }
  }
}

// GET endpoint to check job status
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('jobId');
  
  if (!jobId) {
    return NextResponse.json({ error: 'Job ID required' }, { status: 400 });
  }

  // Get user session for authorization
  const { getServerSession } = require('next-auth');
  const { authOptions } = require('../auth/[...nextauth]/options');
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }
  
  const job = lambdaJobStore.get(jobId);
  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  // Verify user owns this job or is admin
  if (job.videoData?.userId !== session.user.id && !session.user.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized access to job' }, { status: 403 });
  }
  
  return NextResponse.json({
    id: job.id,
    status: job.status,
    progress: job.progress,
    result: job.result,
    error: job.error,
    createdAt: job.createdAt,
    completedAt: job.completedAt,
    cancelled: job.cancelled || false
  });
}

// POST endpoint to start Lambda render
export async function POST(request: NextRequest) {
  try {
    // Validate environment variables
    if (!process.env.REMOTION_AWS_ACCESS_KEY_ID || !process.env.REMOTION_AWS_SECRET_ACCESS_KEY) {
      return NextResponse.json({ 
        error: 'AWS credentials not configured',
        details: 'Please set REMOTION_AWS_ACCESS_KEY_ID and REMOTION_AWS_SECRET_ACCESS_KEY environment variables'
      }, { status: 500 });
    }

    // Get user session for cost tracking and user isolation
    const { getServerSession } = require('next-auth');
    const { authOptions } = require('../auth/[...nextauth]/options');
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Create unique user session ID to prevent conflicts
    const userSessionId = `${session.user.id}-${Date.now()}`;
    userSessions.set(session.user.id, userSessionId);

    const body = await request.json();
    const { variation, textOverlays, platformConfig, duration, videoTrackItems, audioTrackItems, projectId, projectName } = body;

    // Create video data with duration limit for Lambda
    const maxDuration = 300000; // 5 minutes maximum for Lambda
    const actualDuration = Math.min(duration || 5000, maxDuration);
    
    // Generate unique job ID
    const jobId = `lambda-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    if (duration && duration > maxDuration) {
      console.log(`[Lambda Job ${jobId}] Duration capped from ${duration}ms to ${maxDuration}ms for Lambda`);
    }
    
    const videoData = {
      variation: variation || { id: 'default', isOriginal: true },
      textOverlays: textOverlays || [],
      platformConfig: platformConfig || { width: 1080, height: 1920, aspectRatio: '9:16' },
      duration: actualDuration,
      videoTrackItems: videoTrackItems || [],
      audioTrackItems: audioTrackItems || [],
      userId: session.user.id, // Include userId for cost tracking
      userSessionId: userSessionId, // Include session ID for user isolation
      projectId: projectId || 'unknown',
      projectName: projectName || 'Unknown Project',
    };
    
    // Create job entry with user isolation
    const job = {
      id: jobId,
      status: 'pending' as const,
      progress: 0,
      createdAt: new Date(),
      videoData: videoData, // Store video data for later processing
      userSessionId: userSessionId // Include session ID for user isolation
    };
    
    lambdaJobStore.set(jobId, job);

    console.log(`[Lambda Job ${jobId}] Created new Lambda render job for user ${session.user.id} (session: ${userSessionId})`);

    // Add to queue instead of processing immediately
    renderQueue.push(jobId);
    console.log(`[Queue] Added job ${jobId} to queue (${renderQueue.length} jobs in queue, ${activeJobs} active, user has ${userJobCounts.get(session.user.id) || 0}/${maxJobsPerUser} slots)`);
    
    // Start processing if not at max capacity
    if (activeJobs < maxConcurrentJobs) {
      processNextJob();
    }

    // Return job ID immediately
    return NextResponse.json({ 
      jobId,
      status: 'pending',
      message: 'Lambda video rendering started',
      checkStatusUrl: `/api/render-lambda?jobId=${jobId}`,
      downloadUrl: `/api/render-lambda/download?jobId=${jobId}`
    });

  } catch (error) {
    console.error('Error creating Lambda render job:', error);
    
    return NextResponse.json({ 
      error: 'Failed to create Lambda render job',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Download endpoint for completed Lambda videos
export async function PUT(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('jobId');
  
  if (!jobId) {
    return NextResponse.json({ error: 'Job ID required' }, { status: 400 });
  }

  // Get user session for authorization
  const { getServerSession } = require('next-auth');
  const { authOptions } = require('../auth/[...nextauth]/options');
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }
  
  const job = lambdaJobStore.get(jobId);
  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  // Verify user owns this job or is admin
  if (job.videoData?.userId !== session.user.id && !session.user.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized access to job' }, { status: 403 });
  }
  
  if (job.status === 'pending' || job.status === 'processing') {
    return NextResponse.json({ 
      status: job.status,
      progress: job.progress,
      message: 'Video is still being rendered on Lambda'
    }, { status: 202 });
  }
  
  if (job.status === 'failed') {
    return NextResponse.json({ 
      status: 'failed',
      error: job.error,
      message: 'Lambda video rendering failed'
    }, { status: 500 });
  }
  
  if (job.status === 'completed' && job.result) {
    try {
      // Add a small delay to ensure S3 file is available
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log(`[Lambda Job ${jobId}] Attempting to download from S3: ${job.result}`);
      
      // Parse S3 URL to extract bucket and key
      const s3Url = job.result;
      const urlMatch = s3Url.match(/https:\/\/s3\.us-east-1\.amazonaws\.com\/([^\/]+)\/(.+)/);
      
      if (!urlMatch) {
        throw new Error('Invalid S3 URL format');
      }
      
      const bucketName = urlMatch[1];
      // Clean the key by removing ANSI color codes and extra characters
      let key = urlMatch[2].replace(/\x1B\[[0-9;]*[mGK]/g, '').trim();
      
      console.log(`[Lambda Job ${jobId}] Original S3 URL: ${s3Url}`);
      console.log(`[Lambda Job ${jobId}] Cleaned key: "${key}"`);
      
      console.log(`[Lambda Job ${jobId}] Parsed S3 URL - Bucket: ${bucketName}, Key: ${key}`);
      
      // Initialize S3 client with AWS credentials
      const s3Client = new S3Client({
        region: 'us-east-1',
        credentials: {
          accessKeyId: process.env.REMOTION_AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.REMOTION_AWS_SECRET_ACCESS_KEY!,
        },
      });
      
      // Download the video from S3
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      });
      
      const response = await s3Client.send(command);
      
      if (!response.Body) {
        throw new Error('S3 response body is empty');
      }
      
      // Convert stream to buffer
      const chunks: Uint8Array[] = [];
      const reader = response.Body.transformToWebStream().getReader();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
      
      // Combine chunks into single buffer
      const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
      const videoBuffer = new ArrayBuffer(totalLength);
      const uint8Array = new Uint8Array(videoBuffer);
      let offset = 0;
      
      for (const chunk of chunks) {
        uint8Array.set(chunk, offset);
        offset += chunk.length;
      }
      
      console.log(`[Lambda Job ${jobId}] Successfully downloaded video: ${videoBuffer.byteLength} bytes`);
      
      // Generate filename without double extension
      const baseFilename = `lambda-video-${jobId}`;
      const filename = baseFilename.endsWith('.mp4') ? baseFilename : `${baseFilename}.mp4`;
      
      return new NextResponse(videoBuffer, {
        headers: {
          'Content-Type': 'video/mp4',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': videoBuffer.byteLength.toString(),
        },
      });
    } catch (error) {
      console.error(`[Lambda Job ${jobId}] Error downloading video from S3:`, error);
      
      return NextResponse.json({ 
        error: 'Failed to download video from S3',
        details: error instanceof Error ? error.message : 'Unknown error',
        s3Url: job.result // Return the S3 URL for debugging
      }, { status: 500 });
    }
  }
  
  return NextResponse.json({ error: 'Invalid job status' }, { status: 400 });
}

// DELETE endpoint to cancel a job
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('jobId');
  
  if (!jobId) {
    return NextResponse.json({ error: 'Job ID required' }, { status: 400 });
  }

  // Get user session for authorization
  const { getServerSession } = require('next-auth');
  const { authOptions } = require('../auth/[...nextauth]/options');
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }
  
  const job = lambdaJobStore.get(jobId);
  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  // Verify user owns this job or is admin
  if (job.videoData?.userId !== session.user.id && !session.user.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized access to job' }, { status: 403 });
  }
  
  console.log(`[Lambda Job ${jobId}] Cancellation requested`);
  
  // Mark job as cancelled
  job.cancelled = true;
  job.status = 'cancelled';
  job.completedAt = new Date();
  lambdaJobStore.set(jobId, job);
  
  // Remove from queue if it's still there
  const queueIndex = renderQueue.indexOf(jobId);
  if (queueIndex > -1) {
    renderQueue.splice(queueIndex, 1);
    console.log(`[Lambda Job ${jobId}] Removed from queue`);
  }
  
  // Clean up temporary file
  try {
    const fs = require('fs');
    const tempDataPath = `temp-lambda-data-${jobId}.json`;
    if (fs.existsSync(tempDataPath)) {
      fs.unlinkSync(tempDataPath);
      console.log(`[Lambda Job ${jobId}] Cleaned up temp file`);
    }
  } catch (cleanupError) {
    console.log(`[Lambda Job ${jobId}] Error cleaning up temp file:`, cleanupError);
  }
  
  return NextResponse.json({ 
    success: true,
    message: 'Job cancelled successfully',
    jobId: jobId
  });
}
