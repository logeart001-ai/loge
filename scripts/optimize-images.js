#!/usr/bin/env node

const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const imageDir = path.join(__dirname, '../public/image')
const outputDir = path.join(__dirname, '../public/image/optimized')

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

async function optimizeImage(inputPath, outputPath) {
  try {
    const stats = fs.statSync(inputPath)
    const fileSizeInMB = stats.size / (1024 * 1024)
    
    console.log(`Processing: ${path.basename(inputPath)} (${fileSizeInMB.toFixed(2)}MB)`)
    
    // Generate WebP version
    await sharp(inputPath)
      .webp({ quality: 85, effort: 6 })
      .toFile(outputPath.replace(/\.[^.]+$/, '.webp'))
    
    // Generate optimized JPEG version
    await sharp(inputPath)
      .jpeg({ quality: 85, progressive: true })
      .toFile(outputPath.replace(/\.[^.]+$/, '.jpg'))
    
    // Generate different sizes for responsive images
    const sizes = [400, 800, 1200, 1600]
    
    for (const size of sizes) {
      const resizedPath = outputPath.replace(/(\.[^.]+)$/, `_${size}w$1`)
      
      await sharp(inputPath)
        .resize(size, null, { 
          withoutEnlargement: true,
          fit: 'inside'
        })
        .webp({ quality: 85 })
        .toFile(resizedPath.replace(/\.[^.]+$/, '.webp'))
    }
    
    const optimizedStats = fs.statSync(outputPath.replace(/\.[^.]+$/, '.webp'))
    const optimizedSizeInMB = optimizedStats.size / (1024 * 1024)
    const savings = ((fileSizeInMB - optimizedSizeInMB) / fileSizeInMB * 100).toFixed(1)
    
    console.log(`✅ Optimized: ${savings}% smaller (${optimizedSizeInMB.toFixed(2)}MB)`)
    
  } catch (error) {
    console.error(`❌ Error processing ${inputPath}:`, error.message)
  }
}

async function optimizeAllImages() {
  console.log('🖼️  Starting image optimization...\n')
  
  const files = fs.readdirSync(imageDir)
  const imageFiles = files.filter(file => 
    /\.(jpg|jpeg|png|webp)$/i.test(file)
  )
  
  console.log(`Found ${imageFiles.length} images to optimize\n`)
  
  for (const file of imageFiles) {
    const inputPath = path.join(imageDir, file)
    const outputPath = path.join(outputDir, file)
    
    await optimizeImage(inputPath, outputPath)
  }
  
  console.log('\n✨ Image optimization complete!')
  console.log(`📁 Optimized images saved to: ${outputDir}`)
  console.log('\n💡 Next steps:')
  console.log('1. Update your components to use optimized images')
  console.log('2. Set up a CDN for faster delivery')
  console.log('3. Consider using next/image for automatic optimization')
}

// Run if called directly
if (require.main === module) {
  optimizeAllImages().catch(console.error)
}

module.exports = { optimizeImage, optimizeAllImages }