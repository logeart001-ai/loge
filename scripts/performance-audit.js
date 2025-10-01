#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

console.log('🚀 Running Performance Audit...\n')

// Check for performance optimizations
const checks = [
  {
    name: 'Next.js Config Optimizations',
    check: () => {
      const configPath = path.join(__dirname, '../next.config.ts')
      if (fs.existsSync(configPath)) {
        const config = fs.readFileSync(configPath, 'utf8')
        return config.includes('experimental') && config.includes('optimizePackageImports')
      }
      return false
    }
  },
  {
    name: 'Image Optimization Components',
    check: () => {
      const componentPath = path.join(__dirname, '../components/optimized-image.tsx')
      return fs.existsSync(componentPath)
    }
  },
  {
    name: 'Caching Implementation',
    check: () => {
      const cachePath = path.join(__dirname, '../lib/cache.ts')
      return fs.existsSync(cachePath)
    }
  },
  {
    name: 'Service Worker',
    check: () => {
      const swPath = path.join(__dirname, '../public/sw.js')
      return fs.existsSync(swPath)
    }
  },
  {
    name: 'Web App Manifest',
    check: () => {
      const manifestPath = path.join(__dirname, '../public/manifest.json')
      return fs.existsSync(manifestPath)
    }
  },
  {
    name: 'Performance Monitoring',
    check: () => {
      const monitorPath = path.join(__dirname, '../components/performance/performance-monitor.tsx')
      return fs.existsSync(monitorPath)
    }
  },
  {
    name: 'Optimized Images Directory',
    check: () => {
      const optimizedPath = path.join(__dirname, '../public/image/optimized')
      return fs.existsSync(optimizedPath)
    }
  }
]

// Run checks
let passed = 0
let total = checks.length

checks.forEach(({ name, check }) => {
  const result = check()
  const status = result ? '✅' : '❌'
  console.log(`${status} ${name}`)
  if (result) passed++
})

console.log(`\n📊 Performance Score: ${passed}/${total} (${Math.round((passed/total) * 100)}%)`)

// Recommendations
console.log('\n💡 Recommendations:')

if (passed === total) {
  console.log('🎉 Excellent! All performance optimizations are in place.')
  console.log('\n🚀 Next steps:')
  console.log('1. Run: npm run build && npm run start')
  console.log('2. Test with Lighthouse: npm run lighthouse')
  console.log('3. Monitor performance in production')
} else {
  console.log('⚠️  Some optimizations are missing. Run the setup commands:')
  console.log('1. npm run optimize-images')
  console.log('2. Ensure all components are using OptimizedImage')
  console.log('3. Test the service worker in production')
}

// Bundle analysis recommendation
console.log('\n📦 Bundle Analysis:')
console.log('Run: ANALYZE=true npm run build')
console.log('This will show you bundle sizes and optimization opportunities.')

// Performance testing
console.log('\n🔍 Performance Testing:')
console.log('1. Lighthouse: npm run lighthouse')
console.log('2. WebPageTest: https://webpagetest.org')
console.log('3. GTmetrix: https://gtmetrix.com')

console.log('\n✨ Performance audit complete!')