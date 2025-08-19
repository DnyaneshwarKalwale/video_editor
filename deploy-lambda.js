const { execSync } = require('child_process');

console.log('🚀 Deploying Remotion Lambda function with extended timeout...');

try {
  // Deploy Lambda function with 15-minute timeout (900 seconds)
  // This should handle videos up to 10-15 minutes long
  const deployCommand = `npx remotion lambda functions deploy --timeout=900 --memory=3008 --disk-size=2048`;
  
  console.log('Executing:', deployCommand);
  execSync(deployCommand, { stdio: 'inherit' });
  
  console.log('✅ Lambda function deployed successfully with 15-minute timeout!');
  console.log('📹 Now you can render videos up to 10-15 minutes long');
  
} catch (error) {
  console.error('❌ Failed to deploy Lambda function:', error.message);
  console.log('\n💡 Make sure you have:');
  console.log('1. AWS credentials configured');
  console.log('2. REMOTION_AWS_ACCESS_KEY_ID and REMOTION_AWS_SECRET_ACCESS_KEY set');
  console.log('3. Sufficient AWS permissions');
}

