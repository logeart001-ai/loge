// Check if payment setup is complete
// Run with: node check-payment-setup.js

console.log('🔍 Checking Payment Integration Setup...\n');

// Check environment variables
console.log('1. Environment Variables:');
const requiredEnvVars = [
  'PAYSTACK_SECRET_KEY',
  'NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY',
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY'
];

let envComplete = true;
requiredEnvVars.forEach(envVar => {
  const value = process.env[envVar];
  if (value) {
    console.log(`   ✅ ${envVar}: ${envVar.includes('SECRET') ? '***' + value.slice(-4) : value.slice(0, 20) + '...'}`);
  } else {
    console.log(`   ❌ ${envVar}: Missing`);
    envComplete = false;
  }
});

console.log('\n2. Paystack Configuration:');
const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
const paystackPublic = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;

if (paystackSecret && paystackPublic) {
  const isTestMode = paystackSecret.startsWith('sk_test_') && paystackPublic.startsWith('pk_test_');
  console.log(`   ✅ Mode: ${isTestMode ? 'Test' : 'Live'} ${isTestMode ? '(Safe for testing)' : '(⚠️ LIVE KEYS!)'}`);
  console.log(`   ✅ Secret Key: sk_test_***${paystackSecret.slice(-4)}`);
  console.log(`   ✅ Public Key: pk_test_***${paystackPublic.slice(-4)}`);
} else {
  console.log('   ❌ Paystack keys not configured');
  envComplete = false;
}

console.log('\n3. Required Files:');
const fs = require('fs');
const requiredFiles = [
  'lib/paystack-service.ts',
  'app/api/payments/initialize/route.ts',
  'app/api/payments/verify/route.ts',
  'app/api/payments/webhook/route.ts',
  'app/payment/callback/page.tsx',
  'app/cart/page.tsx'
];

let filesComplete = true;
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`   ✅ ${file}`);
  } else {
    console.log(`   ❌ ${file}: Missing`);
    filesComplete = false;
  }
});

console.log('\n4. Test Pages:');
const testFiles = [
  'app/test-payment/page.tsx',
  'test-payment.js',
  'test-payment-flow.js',
  'test-payment-data.sql'
];

testFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`   ✅ ${file}`);
  } else {
    console.log(`   ⚠️  ${file}: Not found`);
  }
});

console.log('\n📋 Setup Summary:');
console.log(`   Environment: ${envComplete ? '✅ Complete' : '❌ Incomplete'}`);
console.log(`   Files: ${filesComplete ? '✅ Complete' : '❌ Incomplete'}`);
console.log(`   Paystack: ${paystackSecret && paystackPublic ? '✅ Configured' : '❌ Not configured'}`);

if (envComplete && filesComplete) {
  console.log('\n🎉 Payment integration setup is complete!');
  console.log('\n🧪 Ready for testing:');
  console.log('   1. Make sure dev server is running: npm run dev');
  console.log('   2. Visit: http://localhost:3001/test-payment');
  console.log('   3. Sign in and test the payment flow');
  console.log('   4. Use test card: 4084084084084081');
} else {
  console.log('\n⚠️  Setup incomplete. Please fix the issues above.');
}

console.log('\n💳 Test Card Numbers:');
console.log('   Success: 4084084084084081');
console.log('   Decline: 5060666666666666666');
console.log('   CVV: Any 3 digits');
console.log('   Expiry: Any future date (e.g., 12/25)');

console.log('\n🔗 Useful URLs:');
console.log('   Test Payment: http://localhost:3001/test-payment');
console.log('   Cart: http://localhost:3001/cart');
console.log('   Art Gallery: http://localhost:3001/art');
console.log('   Sign In: http://localhost:3001/auth/signin');