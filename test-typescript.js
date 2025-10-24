// Simple TypeScript compilation test
const { execSync } = require('child_process');

console.log('🔍 Testing TypeScript compilation...\n');

try {
  console.log('Running TypeScript check...');
  execSync('npx tsc --noEmit --skipLibCheck', { stdio: 'inherit' });
  console.log('✅ TypeScript compilation successful!');
} catch (error) {
  console.error('❌ TypeScript compilation failed');
  console.error('Error:', error.message);
  process.exit(1);
}