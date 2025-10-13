/**
 * Update Existing Creators to be Featured
 */

/* eslint-disable @typescript-eslint/no-require-imports */
require('dotenv').config({ path: '.env.local' })

async function updateCreators() {
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
    // Get existing creators
    const { data: creators } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('role', 'creator')
      .limit(3)

    if (!creators || creators.length === 0) {
      console.log('No creators found')
      return
    }

    console.log(`Found ${creators.length} creators. Updating them to be featured...`)

    // Update each creator to be featured and add avatar if missing
    const creatorImages = {
      0: '/image/AdunniOlorunnisola.jpg',
      1: '/image/AmaraDiallo.jpg',
      2: '/image/KwameAsante.jpg'
    }

    for (let i = 0; i < creators.length; i++) {
      const creator = creators[i]
      const updates = {
        is_featured: true,
        is_verified: true,
        rating: 4.5 + (i * 0.2)
      }

      // Add avatar if missing
      if (!creator.avatar_url) {
        updates.avatar_url = creatorImages[i] || '/image/Creator Avatars.png'
      }

      await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', creator.id)

      console.log(`✅ Updated: ${creator.full_name || creator.email}`)
    }

    console.log('\n✨ Creators updated successfully!')
    console.log('🌐 Refresh http://localhost:3001 to see Featured Creators!')

  } catch (error) {
    console.error('Error:', error.message)
  }
}

updateCreators()
