/**
 * Verify Homepage Data
 * Checks if artworks and creators exist in the database
 */

/* eslint-disable @typescript-eslint/no-require-imports */
require('dotenv').config({ path: '.env.local' })

async function verifyData() {
  const { createClient } = require('@supabase/supabase-js')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  try {
    console.log('🔍 Checking database for homepage data...\n')

    // Check artworks
    const { data: artworks, error: artworksError } = await supabase
      .from('artworks')
      .select('id, title, is_featured, is_available, image_urls, thumbnail_url')
      .eq('is_featured', true)
      .eq('is_available', true)

    console.log('📊 Featured Artworks:')
    if (artworksError) {
      console.log('   ❌ Error:', artworksError.message)
    } else if (!artworks || artworks.length === 0) {
      console.log('   ⚠️  No featured artworks found!')
      console.log('   💡 Run: node seed-sample-data.js')
    } else {
      console.log(`   ✅ Found ${artworks.length} featured artworks:`)
      artworks.forEach(art => {
        console.log(`      • ${art.title}`)
        console.log(`        - Image: ${art.thumbnail_url || art.image_urls?.[0] || 'MISSING'}`)
      })
    }

    // Check all artworks
    const { data: allArtworks } = await supabase
      .from('artworks')
      .select('id, title, is_featured, is_available')
      .limit(10)

    console.log(`\n   Total artworks in DB: ${allArtworks?.length || 0}`)

    // Check creators
    const { data: creators, error: creatorsError } = await supabase
      .from('user_profiles')
      .select('id, full_name, email, role, is_featured, avatar_url')
      .eq('role', 'creator')
      .eq('is_featured', true)

    console.log('\n👥 Featured Creators:')
    if (creatorsError) {
      console.log('   ❌ Error:', creatorsError.message)
    } else if (!creators || creators.length === 0) {
      console.log('   ⚠️  No featured creators found!')
      console.log('   💡 Run: node update-featured-creators.js')
    } else {
      console.log(`   ✅ Found ${creators.length} featured creators:`)
      creators.forEach(creator => {
        console.log(`      • ${creator.full_name || creator.email}`)
        console.log(`        - Avatar: ${creator.avatar_url || 'MISSING'}`)
      })
    }

    // Check all creators
    const { data: allCreators } = await supabase
      .from('user_profiles')
      .select('id, full_name, role, is_featured')
      .eq('role', 'creator')

    console.log(`\n   Total creators in DB: ${allCreators?.length || 0}`)

    console.log('\n' + '='.repeat(60))
    if (artworks && artworks.length > 0 && creators && creators.length > 0) {
      console.log('✅ Database has data! Images should be visible.')
      console.log('\n💡 If images still not showing:')
      console.log('   1. Hard refresh browser: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)')
      console.log('   2. Clear Next.js cache: Delete .next folder and restart')
      console.log('   3. Check browser console for image loading errors')
      console.log('   4. Verify dev server is running on http://localhost:3001')
    } else {
      console.log('⚠️  Missing data! Run these commands:')
      if (!artworks || artworks.length === 0) {
        console.log('   • node seed-sample-data.js')
      }
      if (!creators || creators.length === 0) {
        console.log('   • node update-featured-creators.js')
      }
    }
    console.log('='.repeat(60))

  } catch (error) {
    console.error('\n❌ Error:', error.message)
  }
}

verifyData()
