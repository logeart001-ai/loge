/**
 * Environment Variable Validation
 * Run this at build time to catch configuration issues early
 */

const requiredEnvVars = {
  // Supabase (required for all environments)
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  
  // App URL (required for production)
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
}

const productionEnvVars = {
  // Paystack (required for payment processing)
  PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY,
  NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
}

function validateEnvironment() {
  const errors: string[] = []
  const warnings: string[] = []
  
  // Check required variables
  Object.entries(requiredEnvVars).forEach(([key, value]) => {
    if (!value) {
      errors.push(`Missing required environment variable: ${key}`)
    }
  })
  
  // Check production variables (warnings only in development)
  if (process.env.NODE_ENV === 'production') {
    Object.entries(productionEnvVars).forEach(([key, value]) => {
      if (!value) {
        errors.push(`Missing required production environment variable: ${key}`)
      }
    })
  } else {
    Object.entries(productionEnvVars).forEach(([key, value]) => {
      if (!value) {
        warnings.push(`Missing ${key} (required for payment processing)`)
      }
    })
  }
  
  // Validate APP_URL format
  if (process.env.NEXT_PUBLIC_APP_URL) {
    try {
      const url = new URL(process.env.NEXT_PUBLIC_APP_URL)
      if (process.env.NODE_ENV === 'production' && url.protocol !== 'https:') {
        warnings.push('NEXT_PUBLIC_APP_URL should use HTTPS in production')
      }
      if (url.hostname === 'localhost') {
        warnings.push('NEXT_PUBLIC_APP_URL is set to localhost (use your production domain)')
      }
    } catch {
      errors.push('NEXT_PUBLIC_APP_URL is not a valid URL')
    }
  }
  
  // Validate Paystack keys (check if test vs live)
  if (process.env.PAYSTACK_SECRET_KEY) {
    const isTestKey = process.env.PAYSTACK_SECRET_KEY.startsWith('sk_test_')
    const isLiveKey = process.env.PAYSTACK_SECRET_KEY.startsWith('sk_live_')
    
    if (process.env.NODE_ENV === 'production' && isTestKey) {
      warnings.push('Using Paystack TEST key in production - payments will not be real!')
    }
    if (process.env.NODE_ENV === 'development' && isLiveKey) {
      warnings.push('Using Paystack LIVE key in development - be careful!')
    }
    if (!isTestKey && !isLiveKey) {
      errors.push('PAYSTACK_SECRET_KEY format is invalid (should start with sk_test_ or sk_live_)')
    }
  }
  
  if (process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY) {
    const isTestKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY.startsWith('pk_test_')
    const isLiveKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY.startsWith('pk_live_')
    
    if (process.env.NODE_ENV === 'production' && isTestKey) {
      warnings.push('Using Paystack TEST public key in production')
    }
    if (!isTestKey && !isLiveKey) {
      errors.push('NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY format is invalid (should start with pk_test_ or pk_live_)')
    }
  }
  
  // Print results
  if (warnings.length > 0) {
    console.warn('\n⚠️  Environment Warnings:')
    warnings.forEach(warning => console.warn(`   - ${warning}`))
  }
  
  if (errors.length > 0) {
    console.error('\n❌ Environment Errors:')
    errors.forEach(error => console.error(`   - ${error}`))
    
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Environment validation failed. Fix the errors above.')
    }
  } else {
    console.log('\n✅ Environment variables validated successfully')
  }
  
  // Print current environment info
  console.log('\n📋 Environment Info:')
  console.log(`   Node Environment: ${process.env.NODE_ENV}`)
  console.log(`   App URL: ${process.env.NEXT_PUBLIC_APP_URL || 'NOT SET'}`)
  console.log(`   Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓ Set' : '✗ Missing'}`)
  console.log(`   Paystack Secret: ${process.env.PAYSTACK_SECRET_KEY ? '✓ Set' : '✗ Missing'}`)
  console.log(`   Paystack Public: ${process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ? '✓ Set' : '✗ Missing'}`)
  console.log('')
}

// Run validation
try {
  validateEnvironment()
} catch (error) {
  console.error('Environment validation failed:', error)
  process.exit(1)
}

export {}
