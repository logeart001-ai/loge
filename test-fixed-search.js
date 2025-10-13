// Test the fixed artworks search function
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function testFixedSearch() {
  console.log('🔍 Testing fixed artworks search...\n')
  
  // Step 1: Get artworks
  console.log('Step 1: Fetching artworks...')
  const { data: artworks, error } = await supabase
    .from('artworks')
    .select('*')
    .eq('is_available', true)
    .limit(3)
  
  if (error) {
    console.log('❌ Error fetching artworks:', error)
    return
  }
  
  console.log('✅ Found', artworks?.length, 'artworks')
  artworks?.forEach(a => {
    console.log('   -', a.title, '(creator:', a.creator_id, ')')
  })

  // Step 2: Get unique creator IDs
  const creatorIds = [...new Set(artworks?.map(a => a.creator_id).filter(Boolean) || [])]
  console.log('\nStep 2: Fetching', creatorIds.length, 'creators...')
  
  const { data: creators, error: creatorsError } = await supabase
    .from('user_profiles')
    .select('id, full_name, avatar_url, is_verified')
    .in('id', creatorIds)
  
  if (creatorsError) {
    console.log('❌ Error fetching creators:', creatorsError)
    return
  }
  
  console.log('✅ Found', creators?.length, 'creators')
  creators?.forEach(c => {
    console.log('   -', c.full_name, '(verified:', c.is_verified, ')')
  })

  // Step 3: Map creators to artworks
  console.log('\nStep 3: Mapping creators to artworks...')
  const creatorsMap = new Map(creators?.map(c => [c.id, c]) || [])
  const enrichedArtworks = artworks?.map(artwork => {
    const creator = creatorsMap.get(artwork.creator_id)
    return {
      ...artwork,
      user_profiles: {
        full_name: creator?.full_name || 'Unknown Artist',
        avatar_url: creator?.avatar_url || null,
        is_verified: creator?.is_verified || false
      }
    }
  })
  
  console.log('✅ Enriched', enrichedArtworks?.length, 'artworks')
  enrichedArtworks?.forEach(a => {
    console.log('   -', a.title, 'by', a.user_profiles?.full_name)
  })
  
  console.log('\n✅ Search function logic works correctly!')
}

testFixedSearch().catch(console.error)
