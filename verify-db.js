// Simple script to verify database setup
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function verifyDatabase() {
  console.log('🔍 Verifying database setup...\n')
  
  try {
    // Check artworks
    const { data: artworks, error: artworkError } = await supabase
      .from('artworks')
      .select('id, title, creator:user_profiles!creator_id(full_name)')
      .limit(3)
    
    if (artworkError) {
      if (artworkError.message.includes('does not exist')) {
        console.error('❌ Artworks table does not exist. Please run the database setup first.')
      } else {
        console.error('❌ Artworks table error:', artworkError.message)
      }
    } else {
      console.log(`✅ Artworks table: ${artworks.length} records found`)
      artworks.forEach(artwork => {
        console.log(`   - "${artwork.title}" by ${artwork.creator?.full_name}`)
      })
    }
    
    // Check creators
    const { data: creators, error: creatorError } = await supabase
      .from('user_profiles')
      .select('id, full_name, role')
      .eq('role', 'creator')
      .limit(3)
    
    if (creatorError) {
      console.error('❌ User profiles table error:', creatorError.message)
    } else {
      console.log(`\n✅ Creators: ${creators.length} records found`)
      creators.forEach(creator => {
        console.log(`   - ${creator.full_name}`)
      })
    }
    
    // Check events
    const { data: events, error: eventError } = await supabase
      .from('events')
      .select('id, title, start_date')
      .limit(3)
    
    if (eventError) {
      console.error('❌ Events table error:', eventError.message)
    } else {
      console.log(`\n✅ Events: ${events.length} records found`)
      events.forEach(event => {
        console.log(`   - "${event.title}" on ${new Date(event.start_date).toLocaleDateString()}`)
      })
    }
    
    // Check blog posts
    const { data: posts, error: postError } = await supabase
      .from('blog_posts')
      .select('id, title, author:user_profiles!author_id(full_name)')
      .limit(3)
    
    if (postError) {
      console.error('❌ Blog posts table error:', postError.message)
    } else {
      console.log(`\n✅ Blog posts: ${posts.length} records found`)
      posts.forEach(post => {
        console.log(`   - "${post.title}" by ${post.author?.full_name}`)
      })
    }
    
    console.log('\n🎉 Database verification complete!')
    console.log('If all tables show ✅, your database is ready!')
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message)
  }
}

verifyDatabase()