import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { variation, textOverlays, platformConfig, duration, videoTrackItems, audioTrackItems } = body;

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

    // Log the data being sent to Remotion for debugging
    console.log('Sending video data to Remotion:', {
      variation: videoData.variation?.id,
      textOverlaysCount: videoData.textOverlays?.length || 0,
      textOverlays: videoData.textOverlays?.map((o: any) => ({ 
        id: o.id, 
        text: o.text, 
        timing: o.timing,
        position: o.position,
        style: o.style
      })),
      platformConfig: videoData.platformConfig,
      duration: videoData.duration,
      videoTrackItemsCount: videoData.videoTrackItems?.length || 0,
      audioTrackItemsCount: videoData.audioTrackItems?.length || 0,
    });
    
    // Also log the full video data structure
    console.log('Full video data structure:', JSON.stringify(videoData, null, 2));

    fs.writeFileSync(tempDataPath, JSON.stringify(videoData, null, 2));

    // Verify the JSON file was written correctly
    const writtenData = fs.readFileSync(tempDataPath, 'utf8');
    console.log('JSON file path:', tempDataPath);
    console.log('JSON file exists:', fs.existsSync(tempDataPath));
    console.log('JSON file content length:', writtenData.length);
    console.log('JSON file first 200 chars:', writtenData.substring(0, 200));

    // Output path for the rendered video
    const outputPath = path.join(process.cwd(), `output-${variation.id}.mp4`);

    // Calculate duration in frames (30fps) - use the actual duration from the data
    const durationInFrames = Math.ceil(duration / 1000 * 30);
    
    console.log('Duration calculation:', {
      originalDuration: duration,
      durationInMs: duration,
      durationInFrames: durationInFrames,
      fps: 30
    });
    
    // Set environment variables for Chrome
    const env = {
      ...process.env,
      PUPPETEER_SKIP_CHROMIUM_DOWNLOAD: 'true',
      PUPPETEER_EXECUTABLE_PATH: '/usr/bin/google-chrome-stable',
      CHROME_BIN: '/usr/bin/google-chrome-stable'
    };
    
    // Use Remotion CLI to render the video with optimized settings
    const remotionCommand = `npx remotion render src/remotion/entry.tsx VideoComposition ${outputPath} --props=${tempDataPath} --fps=30 --width=${platformConfig.width} --height=${platformConfig.height} --concurrency=8 --jpeg-quality=80`;

    console.log('Executing Remotion command:', remotionCommand);
    console.log('Environment variables:', env);
    
    const { stdout, stderr } = await execAsync(remotionCommand, { env });
    
    console.log('Remotion stdout:', stdout);
    if (stderr) console.log('Remotion stderr:', stderr);

    // Check if the video file was created
    if (!fs.existsSync(outputPath)) {
      throw new Error('Video file was not created');
    }

    // Read the video file
    const videoBuffer = fs.readFileSync(outputPath);

    // Clean up temporary files
    fs.unlinkSync(tempDataPath);
    fs.unlinkSync(outputPath);

    return new NextResponse(videoBuffer, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': `attachment; filename="variation-${variation.id}.mp4"`,
      },
    });
  } catch (error) {
    console.error('Error rendering video:', error);
    return NextResponse.json({ 
      error: 'Failed to render video',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 