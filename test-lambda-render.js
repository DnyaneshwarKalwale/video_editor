// Test Lambda rendering with proper environment variables
require('dotenv').config();

const https = require('https');
const url = require('url');

async function testLambdaRender() {
  console.log('🧪 Testing Lambda rendering...\n');
  
  // Check environment variables
  console.log('1️⃣ Environment check:');
  console.log(`   AWS Access Key: ${process.env.REMOTION_AWS_ACCESS_KEY_ID ? '✅ Set' : '❌ Missing'}`);
  console.log(`   AWS Secret Key: ${process.env.REMOTION_AWS_SECRET_ACCESS_KEY ? '✅ Set' : '❌ Missing'}`);
  
  if (!process.env.REMOTION_AWS_ACCESS_KEY_ID || !process.env.REMOTION_AWS_SECRET_ACCESS_KEY) {
    console.log('\n❌ AWS credentials not found in environment variables');
    console.log('   Make sure your .env file is being loaded properly');
    return;
  }
  
  // Test simple Lambda render command
  console.log('\n2️⃣ Testing Lambda render command...');
  
  const { exec } = require('child_process');
  const { promisify } = require('util');
  const execAsync = promisify(exec);
  
  try {
    // Create a simple test video data
    const testVideoData = {
      variation: { id: 'default', isOriginal: true },
      textOverlays: [],
      platformConfig: { width: 1080, height: 1920, aspectRatio: '9:16' },
      duration: 5000, // 5 seconds
      videoTrackItems: [],
      audioTrackItems: [],
      userId: 'test-user'
    };
    
    // Write test data to file
    const fs = require('fs');
    const testDataPath = 'test-lambda-data.json';
    fs.writeFileSync(testDataPath, JSON.stringify(testVideoData, null, 2));
    
    console.log('   Created test video data (5 seconds)');
    
    // Test Lambda render command with reduced concurrency
    const lambdaCommand = `npx remotion lambda render https://remotionlambda-useast1-ad9v3yryvx.s3.us-east-1.amazonaws.com/sites/video-editor/index.html VideoComposition --props=${testDataPath} --region=us-east-1 --function-name=remotion-render-4-0-339-mem3008mb-disk2048mb-900sec --concurrency=5 --timeout=300000`;
    
    console.log('   Executing Lambda render command...');
    console.log(`   Command: ${lambdaCommand.substring(0, 100)}...`);
    
    const { stdout, stderr } = await execAsync(lambdaCommand, {
      timeout: 300000, // 5 minutes
      env: {
        ...process.env,
        REMOTION_AWS_ACCESS_KEY_ID: process.env.REMOTION_AWS_ACCESS_KEY_ID,
        REMOTION_AWS_SECRET_ACCESS_KEY: process.env.REMOTION_AWS_SECRET_ACCESS_KEY,
      }
    });
    
    console.log('\n✅ Lambda render completed successfully!');
    console.log('Output:', stdout);
    
    // Clean up
    if (fs.existsSync(testDataPath)) {
      fs.unlinkSync(testDataPath);
    }
    
  } catch (error) {
    console.log('\n❌ Lambda render failed:');
    console.log('Error:', error.message);
    
    if (error.message.includes('ETIMEDOUT')) {
      console.log('\n🔧 This is the timeout issue you were experiencing.');
      console.log('The improvements I made should help:');
      console.log('- Reduced concurrency from 20 to 5');
      console.log('- Added retry logic with exponential backoff');
      console.log('- Better error handling for network timeouts');
    }
    
    // Clean up on error
    try {
      const fs = require('fs');
      if (fs.existsSync('test-lambda-data.json')) {
        fs.unlinkSync('test-lambda-data.json');
      }
    } catch (cleanupError) {
      // Ignore cleanup errors
    }
  }
}

// Run the test
testLambdaRender().catch(console.error);
