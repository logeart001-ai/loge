// Fix user profiles - create profiles for existing auth users
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function fixUserProfiles() {
  console.log('🔧 Fixing user profiles...\n')
  
  try {
    // 1. Get all auth users
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (authError) {
      console.log('❌ Error fetching auth users:', authError.message)
      return
    }
    
    // 2. Get existing profiles
    const { data: existingProfiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, email')
    
    if (profileError) {
      console.log('❌ Error fetching profiles:', profileError.message)
      return
    }
    
    const existingProfileIds = new Set(existingProfiles.map(p => p.id))
    
    // 3. Create profiles for users who don't have them
    const usersNeedingProfiles = authUsers.users.filter(user => !existingProfileIds.has(user.id))
    
    console.log(`Found ${usersNeedingProfiles.length} users needing profiles:`)
    
    for (const user of usersNeedingProfiles) {
      console.log(`Creating profile for: ${user.email}`)
      
      const userType = user.user_metadata?.user_type || 'buyer'
      
      const { error: insertError } = await supabase
        .from('user_profiles')
        .insert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email.split('@')[0],
          role: userType === 'creator' ? 'creator' : 'buyer',
          creator_status: userType === 'creator' ? 'pending' : null,
          is_verified: false,
          profile_completed: false,
          created_at: user.created_at,
          updated_at: new Date().toISOString()
        })
      
      if (insertError) {
        console.log(`❌ Error creating profile for ${user.email}:`, insertError.message)
      } else {
        console.log(`✅ Profile created for ${user.email}`)
      }
    }
    
    // 4. Show final status
    console.log('\n📊 Final status:')
    const { data: finalProfiles } = await supabase
      .from('user_profiles')
      .select('email, full_name, role')
      .order('created_at')
    
    finalProfiles.forEach((profile, index) => {
      console.log(`   ${index + 1}. ${profile.email} (${profile.full_name}) - ${profile.role}`)
    })
    
    console.log('\n✅ User profiles fixed!')
    console.log('Now users should be able to sign in and complete their profiles.')
    
  } catch (err) {
    console.error('❌ Unexpected error:', err.message)
  }
}

fixUserProfiles()