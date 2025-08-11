import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

// Increase timeout for video rendering (10 minutes)
const RENDER_TIMEOUT = 10 * 60 * 1000; // 10 minutes

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { variation, textOverlays, platformConfig, duration, videoTrackItems, audioTrackItems } = body;

    console.log('Received render request:', {
      variation: variation?.id,
      textOverlaysCount: textOverlays?.length || 0,
      videoTrackItemsCount: videoTrackItems?.length || 0,
      duration,
      platformConfig
    });

    // Create a temporary JSON file with the video data
    const tempDataPath = path.join(process.cwd(), 'temp-video-data.json');
    const videoData = {
      variation: variation || { id: 'default', isOriginal: true },
      textOverlays: textOverlays || [],
      platformConfig: platformConfig || { width: 1080, height: 1920, aspectRatio: '9:16' },
      duration: duration || 5000,
      videoTrackItems: videoTrackItems || [],
      audioTrackItems: audioTrackItems || [],
    };

    // Log the full video data for debugging
    console.log('Full video data:', JSON.stringify(videoData, null, 2));

    fs.writeFileSync(tempDataPath, JSON.stringify(videoData, null, 2));

    // Output path for the rendered video
    const outputPath = path.join(process.cwd(), `output-${variation?.id || 'video'}.mp4`);

    // Set environment variables for Chrome
    const env = {
      ...process.env,
      PUPPETEER_SKIP_CHROMIUM_DOWNLOAD: 'true',
      PUPPETEER_EXECUTABLE_PATH: '/usr/bin/google-chrome-stable',
      CHROME_BIN: '/usr/bin/google-chrome-stable'
    };
    
    // Use Remotion CLI to render the video
    const remotionCommand = `npx remotion render src/remotion/entry.tsx VideoComposition ${outputPath} --props=${tempDataPath} --fps=30 --width=${platformConfig.width} --height=${platformConfig.height} --concurrency=2 --jpeg-quality=80`;

    console.log('Executing Remotion command:', remotionCommand);
    console.log('Starting render at:', new Date().toISOString());
    
    // Execute with timeout
    const { stdout, stderr } = await execAsync(remotionCommand, { 
      env,
      timeout: RENDER_TIMEOUT 
    });
    
    console.log('Render completed at:', new Date().toISOString());
    console.log('Remotion stdout:', stdout);
    if (stderr) console.log('Remotion stderr:', stderr);

    // Check if the video file was created
    if (!fs.existsSync(outputPath)) {
      throw new Error('Video file was not created');
    }

    // Get file size for logging
    const stats = fs.statSync(outputPath);
    console.log('Video file created successfully:', {
      path: outputPath,
      size: `${(stats.size / 1024 / 1024).toFixed(2)} MB`
    });

    // Read the video file
    const videoBuffer = fs.readFileSync(outputPath);

    // Clean up temporary files
    fs.unlinkSync(tempDataPath);
    fs.unlinkSync(outputPath);

    console.log('Video render completed successfully');

    return new NextResponse(videoBuffer, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': `attachment; filename="variation-${variation?.id || 'video'}.mp4"`,
        'Content-Length': videoBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error rendering video:', error);
    
    // Clean up any temporary files on error
    try {
      const tempDataPath = path.join(process.cwd(), 'temp-video-data.json');
      if (fs.existsSync(tempDataPath)) {
        fs.unlinkSync(tempDataPath);
      }
    } catch (cleanupError) {
      console.error('Error cleaning up temp files:', cleanupError);
    }
    
    return NextResponse.json({ 
      error: 'Failed to render video',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 