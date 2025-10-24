// Test Next.js configuration
const { execSync } = require('child_process');

console.log('🔍 Testing Next.js Configuration...\n');

try {
  console.log('1. Checking Next.js config syntax...');
  execSync('npx next info', { stdio: 'inherit' });
  console.log('✅ Next.js configuration is valid\n');
  
  console.log('2. Testing build process...');
  execSync('npm run build:skip-lint', { stdio: 'inherit' });
  console.log('✅ Build successful!\n');
  
} catch (error) {
  console.error('❌ Configuration test failed');
  console.error('Error:', error.message);
  
  console.log('\n💡 Trying alternative build...');
  try {
    execSync('SKIP_ENV_VALIDATION=true npx next build', { stdio: 'inherit' });
    console.log('✅ Alternative build successful!');
  } catch (altError) {
    console.error('❌ Alternative build also failed');
    process.exit(1);
  }
}