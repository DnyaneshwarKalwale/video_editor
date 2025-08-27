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
}>();

// Fair queue system for handling multiple users
let activeJobs = 0;
const maxConcurrentJobs = 5; // Allow 5 videos to render simultaneously
const maxJobsPerUser = 1; // Each user can have max 2 active jobs
const renderQueue: string[] = [];
const userJobCounts = new Map<string, number>(); // Track active jobs per user

// Lambda configuration
const LAMBDA_CONFIG = {
  serveUrl: 'https://remotionlambda-useast1-ad9v3yryvx.s3.us-east-1.amazonaws.com/sites/video-editor/index.html',
  compositionId: 'VideoComposition',
  region: 'us-east-1',
  functionName: 'remotion-render-4-0-339-mem3008mb-disk2048mb-900sec' // Use the new function with 15-minute timeout
};

// Network connectivity check function
async function checkNetworkConnectivity() {
  try {
    const https = require('https');
    const url = require('url');
    
    const parsedUrl = url.parse(LAMBDA_CONFIG.serveUrl);
    
    return new Promise((resolve, reject) => {
      const req = https.request({
        hostname: parsedUrl.hostname,
        port: 443,
        path: parsedUrl.path,
        method: 'HEAD',
        timeout: 10000 // 10 second timeout
      }, (res: any) => {
        console.log(`[Network Check] S3 connectivity: ${res.statusCode}`);
        resolve(true);
      });
      
      req.on('error', (err: any) => {
        console.error(`[Network Check] S3 connectivity failed:`, err.message);
        reject(err);
      });
      
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Network timeout'));
      });
      
      req.end();
    });
  } catch (error) {
    console.error(`[Network Check] Error checking connectivity:`, error);
    throw error;
  }
}

// Cleanup old jobs (run every 5 minutes)
setInterval(() => {
  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
  
  for (const [jobId, job] of lambdaJobStore.entries()) {
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

// Process Lambda render job with retry logic
async function processLambdaJob(jobId: string, videoData: any) {
  const maxRetries = 3;
  let attempt = 0;
  
  while (attempt < maxRetries) {
    attempt++;
    try {
      // Update job status to processing
      const job = lambdaJobStore.get(jobId);
      if (job) {
        job.status = 'processing';
        job.progress = 40; // Start at 40% since we're using high concurrency
        lambdaJobStore.set(jobId, job);
      }

      console.log(`[Lambda Job ${jobId}] Starting Lambda render (attempt ${attempt}/${maxRetries}) for ${videoData.duration}ms duration`);

      // Check network connectivity before starting render
      if (attempt === 1) {
        try {
          console.log(`[Lambda Job ${jobId}] Checking network connectivity...`);
          await checkNetworkConnectivity();
          console.log(`[Lambda Job ${jobId}] Network connectivity OK`);
        } catch (networkError) {
          console.warn(`[Lambda Job ${jobId}] Network connectivity check failed:`, networkError);
          // Continue anyway, as the render might still work
        }
      }

      // Create temporary JSON file for props
      const tempDataPath = `temp-lambda-data-${jobId}.json`;
      const fs = require('fs');
      fs.writeFileSync(tempDataPath, JSON.stringify(videoData, null, 2));

      // Build the Lambda render command with optimized settings for speed
      // Reduced concurrency to 10 to prevent network overload
      const lambdaCommand = `npx remotion lambda render ${LAMBDA_CONFIG.serveUrl} ${LAMBDA_CONFIG.compositionId} --props=${tempDataPath} --region=${LAMBDA_CONFIG.region} --function-name=${LAMBDA_CONFIG.functionName} --concurrency=10 --timeout=600000`;

      console.log(`[Lambda Job ${jobId}] Executing: ${lambdaCommand}`);

      // Execute Lambda render with execAsync with longer timeout
      const { stdout, stderr } = await execAsync(lambdaCommand, {
        timeout: 600000, // 10 minutes timeout to handle network delays
        env: {
          ...process.env,
          REMOTION_AWS_ACCESS_KEY_ID: process.env.REMOTION_AWS_ACCESS_KEY_ID,
          REMOTION_AWS_SECRET_ACCESS_KEY: process.env.REMOTION_AWS_SECRET_ACCESS_KEY,
        }
      });
    
      console.log(`[Lambda Job ${jobId}] Lambda render completed`);
      console.log(`[Lambda Job ${jobId}] Output:`, stdout);

      // Update progress to 70% when Lambda execution completes (more realistic)
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

      // Update job status to completed
      if (job) {
        job.status = 'completed';
        job.progress = 100;
        job.result = s3Url;
        job.completedAt = new Date();
        lambdaJobStore.set(jobId, job);
      }

      // Clean up temporary file
      try {
        if (fs.existsSync(tempDataPath)) {
          fs.unlinkSync(tempDataPath);
        }
      } catch (cleanupError) {
        console.log(`[Lambda Job ${jobId}] Error cleaning up temp file:`, cleanupError);
      }

      // Success! Break out of retry loop
      break;

    } catch (error) {
      console.error(`[Lambda Job ${jobId}] Error in Lambda render (attempt ${attempt}/${maxRetries}):`, error);
      
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

      // Check if this is the last attempt
      if (attempt >= maxRetries) {
        // Check if it's a concurrency limit error
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        let finalError = 'Video rendering failed. Please try again.';
        
        if (errorMessage.includes('TooManyRequestsException') || errorMessage.includes('Rate Exceeded')) {
          finalError = 'Too many videos being processed. Please wait a moment and try again.';
        } else if (errorMessage.includes('ETIMEDOUT') || errorMessage.includes('connect ETIMEDOUT')) {
          finalError = 'Network timeout occurred. Please try again in a few moments.';
        } else if (errorMessage.includes('delayRender') || errorMessage.includes('timeout')) {
          finalError = 'Video took too long to load. Please try with a shorter video or check your internet connection.';
        } else if (errorMessage.includes('Command failed')) {
          finalError = 'Video processing failed. Please try again or contact support if the problem persists.';
        }
        
        // Update job status to failed
        const job = lambdaJobStore.get(jobId);
        if (job) {
          job.status = 'failed';
          job.error = finalError;
          job.completedAt = new Date();
          lambdaJobStore.set(jobId, job);
        }
      } else {
        // Wait before retrying (exponential backoff)
        const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Max 10 seconds
        console.log(`[Lambda Job ${jobId}] Retrying in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
}

// GET endpoint to check job status or system diagnostics
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('jobId');
  const diagnostics = searchParams.get('diagnostics');
  
  // If diagnostics is requested, return system info
  if (diagnostics === 'true') {
    try {
      const networkStatus = await checkNetworkConnectivity();
      return NextResponse.json({
        system: 'Lambda Render Service',
        status: 'operational',
        network: 'connected',
        config: {
          region: LAMBDA_CONFIG.region,
          functionName: LAMBDA_CONFIG.functionName,
          serveUrl: LAMBDA_CONFIG.serveUrl,
          maxConcurrentJobs,
          maxJobsPerUser
        },
        queue: {
          activeJobs,
          queueLength: renderQueue.length,
          userJobCounts: Object.fromEntries(userJobCounts)
        },
        environment: {
          hasAwsCredentials: !!(process.env.REMOTION_AWS_ACCESS_KEY_ID && process.env.REMOTION_AWS_SECRET_ACCESS_KEY),
          nodeVersion: process.version,
          platform: process.platform
        }
      });
    } catch (error) {
      return NextResponse.json({
        system: 'Lambda Render Service',
        status: 'network_issue',
        error: error instanceof Error ? error.message : 'Unknown error',
        config: {
          region: LAMBDA_CONFIG.region,
          functionName: LAMBDA_CONFIG.functionName,
          serveUrl: LAMBDA_CONFIG.serveUrl
        }
      }, { status: 500 });
    }
  }
  
  if (!jobId) {
    return NextResponse.json({ error: 'Job ID required' }, { status: 400 });
  }
  
  const job = lambdaJobStore.get(jobId);
  if (!job) {
    // If job is not found, it might have been cancelled or completed and cleaned up
    // Return a specific status to indicate this
    return NextResponse.json({ 
      error: 'Job not found',
      status: 'not_found',
      message: 'Job may have been cancelled or completed'
    }, { status: 404 });
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

    const body = await request.json();
    const { variation, textOverlays, platformConfig, duration, videoTrackItems, audioTrackItems, userId } = body;

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
      userId: userId || 'anonymous', // Include userId for fair queue
    };
    
    // Create job entry
    const job = {
      id: jobId,
      status: 'pending' as const,
      progress: 0,
      createdAt: new Date(),
      videoData: videoData // Store video data for later processing
    };
    
    lambdaJobStore.set(jobId, job);

    console.log(`[Lambda Job ${jobId}] Created new Lambda render job`);

    // Add to queue instead of processing immediately
    renderQueue.push(jobId);
    console.log(`[Queue] Added job ${jobId} to queue (${renderQueue.length} jobs in queue, ${activeJobs} active)`);
    
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
  
  const job = lambdaJobStore.get(jobId);
  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
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
        
                 // Download the video from S3 with retry logic
         let videoBuffer: ArrayBuffer | undefined;
         let retries = 3;
        
        while (retries > 0) {
          try {
            console.log(`[Lambda Job ${jobId}] S3 download attempt ${4-retries}`);
            
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
            videoBuffer = new ArrayBuffer(totalLength);
            const uint8Array = new Uint8Array(videoBuffer);
            let offset = 0;
            
            for (const chunk of chunks) {
              uint8Array.set(chunk, offset);
              offset += chunk.length;
            }
            
            console.log(`[Lambda Job ${jobId}] Successfully downloaded video: ${videoBuffer.byteLength} bytes`);
            break;
            
          } catch (s3Error) {
            console.log(`[Lambda Job ${jobId}] S3 download attempt ${4-retries} failed:`, s3Error);
            retries--;
            
            if (retries > 0) {
              await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds before retry
            } else {
              throw s3Error;
            }
          }
        }
        
        if (!videoBuffer || videoBuffer.byteLength === 0) {
          throw new Error('Downloaded video file is empty');
        }
        
        // Clean up the job after successful download
        lambdaJobStore.delete(jobId);
        
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
        
        // Don't delete the job on download failure, let user retry
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
  
  const job = lambdaJobStore.get(jobId);
  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }
  
  console.log(`[Lambda Job ${jobId}] Cancellation requested`);
  
  // Mark job as cancelled
  job.cancelled = true;
  job.status = 'cancelled';
  job.completedAt = new Date();
  lambdaJobStore.set(jobId, job);
  
  // Note: With execAsync, we can't directly kill the process, but the job is marked as cancelled
  console.log(`[Lambda Job ${jobId}] Job marked as cancelled`);
  
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
