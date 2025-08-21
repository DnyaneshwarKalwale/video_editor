import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

const execAsync = promisify(exec);

// In-memory job store for Lambda renders
const lambdaJobStore = new Map<string, {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  result?: string; // S3 URL
  error?: string;
  createdAt: Date;
  completedAt?: Date;
  renderId?: string; // Remotion Lambda render ID
  videoData?: any; // Store video data for processing
}>();

// Queue system for handling concurrency limits
let isProcessing = false;
const renderQueue: string[] = [];

// Lambda configuration
const LAMBDA_CONFIG = {
  serveUrl: 'https://remotionlambda-useast1-ad9v3yryvx.s3.us-east-1.amazonaws.com/sites/video-editor/index.html',
  compositionId: 'VideoComposition',
  region: 'us-east-1',
  functionName: 'remotion-render-4-0-339-mem3008mb-disk2048mb-900sec' // Use the new function with 15-minute timeout
};

// Process next job in queue
async function processNextJob() {
  if (isProcessing || renderQueue.length === 0) {
    return;
  }
  
  isProcessing = true;
  const jobId = renderQueue.shift()!;
  const job = lambdaJobStore.get(jobId);
  
  if (job && job.videoData) {
    console.log(`[Queue] Processing job ${jobId} (${renderQueue.length} jobs remaining in queue)`);
    try {
      await processLambdaJob(jobId, job.videoData);
    } finally {
      isProcessing = false;
      // Process next job if any
      if (renderQueue.length > 0) {
        setTimeout(processNextJob, 2000); // Wait 2 seconds before next job
      }
    }
  } else {
    isProcessing = false;
  }
}

// Process Lambda render job
async function processLambdaJob(jobId: string, videoData: any) {
  try {
    // Update job status to processing
    const job = lambdaJobStore.get(jobId);
    if (job) {
      job.status = 'processing';
      job.progress = 10;
      lambdaJobStore.set(jobId, job);
    }

    console.log(`[Lambda Job ${jobId}] Starting Lambda render for ${videoData.duration}ms duration`);

    // Create temporary JSON file for props
    const tempDataPath = `temp-lambda-data-${jobId}.json`;
    const fs = require('fs');
    fs.writeFileSync(tempDataPath, JSON.stringify(videoData, null, 2));

    // Build the Lambda render command with optimized settings for speed
    // Note: Using concurrency=8 to stay under current AWS limit of 10
    const lambdaCommand = `npx remotion lambda render ${LAMBDA_CONFIG.serveUrl} ${LAMBDA_CONFIG.compositionId} --props=${tempDataPath} --region=${LAMBDA_CONFIG.region} --function-name=${LAMBDA_CONFIG.functionName} --concurrency=8`;

    console.log(`[Lambda Job ${jobId}] Executing: ${lambdaCommand}`);

    // Execute Lambda render
    const { stdout, stderr } = await execAsync(lambdaCommand, {
      timeout: 900000, // 15 minutes timeout
      env: {
        ...process.env,
        REMOTION_AWS_ACCESS_KEY_ID: process.env.REMOTION_AWS_ACCESS_KEY_ID,
        REMOTION_AWS_SECRET_ACCESS_KEY: process.env.REMOTION_AWS_SECRET_ACCESS_KEY,
      }
    });

    console.log(`[Lambda Job ${jobId}] Lambda render completed`);
    console.log(`[Lambda Job ${jobId}] Output:`, stdout);

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

  } catch (error) {
    console.error(`[Lambda Job ${jobId}] Error in Lambda render:`, error);
    
    // Check if it's a concurrency limit error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    let finalError = errorMessage;
    
    if (errorMessage.includes('TooManyRequestsException') || errorMessage.includes('Rate Exceeded')) {
      finalError = 'AWS Lambda concurrency limit reached. Please wait a moment and try again, or contact support to increase your limit.';
    }
    
    // Update job status to failed
    const job = lambdaJobStore.get(jobId);
    if (job) {
      job.status = 'failed';
      job.error = finalError;
      job.completedAt = new Date();
      lambdaJobStore.set(jobId, job);
    }
    
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
  }
}

// GET endpoint to check job status
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('jobId');
  
  if (!jobId) {
    return NextResponse.json({ error: 'Job ID required' }, { status: 400 });
  }
  
  const job = lambdaJobStore.get(jobId);
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
    const { variation, textOverlays, platformConfig, duration, videoTrackItems, audioTrackItems } = body;

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
    console.log(`[Queue] Added job ${jobId} to queue (${renderQueue.length} jobs in queue, isProcessing: ${isProcessing})`);
    
    // Start processing if not already processing
    if (!isProcessing) {
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
        
        return new NextResponse(videoBuffer, {
          headers: {
            'Content-Type': 'video/mp4',
            'Content-Disposition': `attachment; filename="lambda-video-${jobId}.mp4"`,
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
