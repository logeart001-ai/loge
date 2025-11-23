/**
 * Quick Environment Check Script
 * Run this locally to verify your environment is configured correctly
 * Usage: npm run check-env
 */

console.log('🔍 Checking Environment Configuration...\n')

const checks = []

// Check 1: NEXT_PUBLIC_APP_URL
console.log('1️⃣  Checking NEXT_PUBLIC_APP_URL...')
if (!process.env.NEXT_PUBLIC_APP_URL) {
  console.error('   ❌ NEXT_PUBLIC_APP_URL is not set!')
  console.log('   💡 Add to .env.local: NEXT_PUBLIC_APP_URL=https://logeart.shop')
  checks.push(false)
} else {
  console.log(`   ✅ Set to: ${process.env.NEXT_PUBLIC_APP_URL}`)
  
  if (process.env.NEXT_PUBLIC_APP_URL.includes('localhost')) {
    console.warn('   ⚠️  Using localhost - change to your production domain for deployment')
  }
  if (!process.env.NEXT_PUBLIC_APP_URL.startsWith('https://')) {
    console.warn('   ⚠️  Should use HTTPS in production')
  }
  checks.push(true)
}

// Check 2: Paystack Secret Key
console.log('\n2️⃣  Checking PAYSTACK_SECRET_KEY...')
if (!process.env.PAYSTACK_SECRET_KEY) {
  console.warn('   ⚠️  PAYSTACK_SECRET_KEY is not set')
  console.log('   💡 Payments will not work without this')
  checks.push(false)
} else {
  const isTest = process.env.PAYSTACK_SECRET_KEY.startsWith('sk_test_')
  const isLive = process.env.PAYSTACK_SECRET_KEY.startsWith('sk_live_')
  
  console.log(`   ✅ Set to: sk_${isTest ? 'test' : isLive ? 'live' : 'unknown'}_***`)
  
  if (isTest) {
    console.log('   📝 Using TEST mode - payments won\'t be real')
  } else if (isLive) {
    console.log('   💰 Using LIVE mode - real payments!')
  } else {
    console.error('   ❌ Invalid format - should start with sk_test_ or sk_live_')
    checks.push(false)
  }
  checks.push(true)
}

// Check 3: Paystack Public Key
console.log('\n3️⃣  Checking NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY...')
if (!process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY) {
  console.warn('   ⚠️  NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY is not set')
  checks.push(false)
} else {
  const isTest = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY.startsWith('pk_test_')
  const isLive = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY.startsWith('pk_live_')
  
  console.log(`   ✅ Set to: pk_${isTest ? 'test' : isLive ? 'live' : 'unknown'}_***`)
  checks.push(true)
}

// Check 4: Supabase URL
console.log('\n4️⃣  Checking NEXT_PUBLIC_SUPABASE_URL...')
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.error('   ❌ NEXT_PUBLIC_SUPABASE_URL is not set!')
  checks.push(false)
} else {
  console.log(`   ✅ Set to: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`)
  checks.push(true)
}

// Check 5: Supabase Anon Key
console.log('\n5️⃣  Checking NEXT_PUBLIC_SUPABASE_ANON_KEY...')
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error('   ❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is not set!')
  checks.push(false)
} else {
  console.log('   ✅ Set')
  checks.push(true)
}

// Summary
console.log('\n' + '='.repeat(50))
const passed = checks.filter(c => c).length
const total = checks.length

if (passed === total) {
  console.log('✅ All checks passed! Environment is configured correctly.')
} else {
  console.log(`⚠️  ${passed}/${total} checks passed. Fix the issues above.`)
}

console.log('\n📋 Deployment Checklist for Vercel:')
console.log('   1. Copy these variables to Vercel Environment Variables')
console.log('   2. Change NEXT_PUBLIC_APP_URL to https://logeart.shop')
console.log('   3. Use LIVE Paystack keys for production')
console.log('   4. Make sure all variables are set for "Production" environment')
console.log('   5. Redeploy after saving variables\n')

export {}
