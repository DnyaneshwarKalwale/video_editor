// Test script to check Lambda connectivity and diagnose timeout issues
const https = require('https');
const url = require('url');

const LAMBDA_CONFIG = {
  serveUrl: 'https://remotionlambda-useast1-ad9v3yryvx.s3.us-east-1.amazonaws.com/sites/video-editor/index.html',
  region: 'us-east-1',
  functionName: 'remotion-render-4-0-339-mem3008mb-disk2048mb-900sec'
};

async function testConnectivity() {
  console.log('🔍 Testing Lambda connectivity...\n');
  
  // Test 1: S3 Bundle Access
  console.log('1️⃣ Testing S3 bundle access...');
  try {
    const parsedUrl = url.parse(LAMBDA_CONFIG.serveUrl);
    
    const result = await new Promise((resolve, reject) => {
      const req = https.request({
        hostname: parsedUrl.hostname,
        port: 443,
        path: parsedUrl.path,
        method: 'HEAD',
        timeout: 10000
      }, (res) => {
        console.log(`   ✅ S3 bundle accessible: ${res.statusCode}`);
        resolve(true);
      });
      
      req.on('error', (err) => {
        console.log(`   ❌ S3 bundle error: ${err.message}`);
        reject(err);
      });
      
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('S3 bundle timeout'));
      });
      
      req.end();
    });
  } catch (error) {
    console.log(`   ❌ S3 bundle failed: ${error.message}`);
  }
  
  // Test 2: AWS Lambda Service
  console.log('\n2️⃣ Testing AWS Lambda service...');
  try {
    const result = await new Promise((resolve, reject) => {
      const req = https.request({
        hostname: `lambda.${LAMBDA_CONFIG.region}.amazonaws.com`,
        port: 443,
        path: '/',
        method: 'HEAD',
        timeout: 10000
      }, (res) => {
        console.log(`   ✅ Lambda service accessible: ${res.statusCode}`);
        resolve(true);
      });
      
      req.on('error', (err) => {
        console.log(`   ❌ Lambda service error: ${err.message}`);
        reject(err);
      });
      
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Lambda service timeout'));
      });
      
      req.end();
    });
  } catch (error) {
    console.log(`   ❌ Lambda service failed: ${error.message}`);
  }
  
  // Test 3: Environment Check
  console.log('\n3️⃣ Environment check...');
  console.log(`   Node.js version: ${process.version}`);
  console.log(`   Platform: ${process.platform}`);
  console.log(`   AWS credentials: ${process.env.REMOTION_AWS_ACCESS_KEY_ID ? '✅ Set' : '❌ Missing'}`);
  console.log(`   AWS secret: ${process.env.REMOTION_AWS_SECRET_ACCESS_KEY ? '✅ Set' : '❌ Missing'}`);
  
  // Test 4: DNS Resolution
  console.log('\n4️⃣ DNS resolution test...');
  const dns = require('dns').promises;
  try {
    const addresses = await dns.resolve4('remotionlambda-useast1-ad9v3yryvx.s3.us-east-1.amazonaws.com');
    console.log(`   ✅ S3 DNS resolved: ${addresses.join(', ')}`);
  } catch (error) {
    console.log(`   ❌ S3 DNS failed: ${error.message}`);
  }
  
  console.log('\n📋 Summary:');
  console.log('If you see ❌ errors above, those are likely causing the ETIMEDOUT issues.');
  console.log('Common fixes:');
  console.log('- Check your internet connection');
  console.log('- Verify AWS credentials are correct');
  console.log('- Ensure no firewall is blocking AWS services');
  console.log('- Try reducing concurrency from 20 to 10 or 5');
}

// Run the test
testConnectivity().catch(console.error);
