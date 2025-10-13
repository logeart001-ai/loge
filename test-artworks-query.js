// Test the artworks search query
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function testArtworksQuery() {
  console.log('🔍 Testing artworks query...\n')
  
  // Test 1: Simple artworks query
  console.log('Test 1: Simple artworks query')
  const { data: artworks1, error: error1 } = await supabase
    .from('artworks')
    .select('*')
    .limit(1)
  
  if (error1) {
    console.log('❌ Simple query failed:', error1)
  } else {
    console.log('✅ Simple query works:', artworks1?.length, 'records')
    if (artworks1?.[0]) {
      console.log('   Sample:', { 
        id: artworks1[0].id, 
        title: artworks1[0].title,
        creator_id: artworks1[0].creator_id 
      })
    }
  }

  // Test 2: Query with user_profiles join (implicit foreign key)
  console.log('\nTest 2: Query with user_profiles join (implicit)')
  const { data: artworks2, error: error2 } = await supabase
    .from('artworks')
    .select(`
      *,
      user_profiles(
        full_name,
        avatar_url,
        is_verified
      )
    `)
    .limit(1)
  
  if (error2) {
    console.log('❌ Implicit join failed:', JSON.stringify(error2, null, 2))
  } else {
    console.log('✅ Implicit join works:', artworks2?.length, 'records')
    if (artworks2?.[0]) {
      console.log('   Sample:', { 
        id: artworks2[0].id, 
        title: artworks2[0].title,
        creator: artworks2[0].user_profiles 
      })
    }
  }

  // Test 3: Query with explicit foreign key name
  console.log('\nTest 3: Query with explicit foreign key name')
  const { data: artworks3, error: error3 } = await supabase
    .from('artworks')
    .select(`
      *,
      user_profiles!artworks_creator_id_fkey(
        full_name,
        avatar_url,
        is_verified
      )
    `)
    .limit(1)
  
  if (error3) {
    console.log('❌ Explicit FK join failed:', JSON.stringify(error3, null, 2))
  } else {
    console.log('✅ Explicit FK join works:', artworks3?.length, 'records')
    if (artworks3?.[0]) {
      console.log('   Sample:', { 
        id: artworks3[0].id, 
        title: artworks3[0].title,
        creator: artworks3[0].user_profiles 
      })
    }
  }

  // Test 4: Check if foreign key exists
  console.log('\nTest 4: Checking database structure...')
  const { data: fks, error: error4 } = await supabase
    .rpc('get_foreign_keys', { table_name: 'artworks' })
  
  if (error4) {
    console.log('⚠️  Cannot query foreign keys (expected):', error4.message)
  } else {
    console.log('✅ Foreign keys:', fks)
  }
}

testArtworksQuery().catch(console.error)
