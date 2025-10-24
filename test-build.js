// Test build script to check for issues before deployment
const { execSync } = require('child_process');

console.log('🔍 Testing build process...\n');

try {
  console.log('1. Checking TypeScript compilation...');
  execSync('npx tsc --noEmit', { stdio: 'inherit' });
  console.log('✅ TypeScript compilation successful\n');
  
  console.log('2. Testing Next.js build...');
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Next.js build successful\n');
  
  console.log('🎉 Build test completed successfully!');
  console.log('Your app is ready for deployment.');
  
} catch (error) {
  console.error('❌ Build test failed:', error.message);
  console.log('\n💡 Common fixes:');
  console.log('- Check for TypeScript errors');
  console.log('- Verify all imports are correct');
  console.log('- Ensure environment variables are set');
  console.log('- Check for missing dependencies');
  process.exit(1);
}