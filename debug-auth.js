// Debug authentication issue
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

async function debugAuth() {
  console.log('🔍 Debugging Authentication Issue...\n')
  
  try {
    // 1. Check all users in auth.users
    console.log('1. Checking all users in auth.users:')
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (authError) {
      console.log('❌ Error fetching auth users:', authError.message)
      return
    }
    
    console.log(`Found ${authUsers.users.length} users:`)
    authUsers.users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email}`)
      console.log(`      - ID: ${user.id}`)
      console.log(`      - Confirmed: ${!!user.email_confirmed_at}`)
      console.log(`      - Created: ${user.created_at}`)
      console.log(`      - Last sign in: ${user.last_sign_in_at || 'Never'}`)
      console.log('')
    })
    
    // 2. Check user_profiles table
    console.log('2. Checking user_profiles table:')
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(10)
    
    if (profileError) {
      console.log('❌ Error fetching profiles:', profileError.message)
    } else {
      console.log(`Found ${profiles.length} profiles:`)
      profiles.forEach((profile, index) => {
        console.log(`   ${index + 1}. ${profile.email} (${profile.full_name})`)
        console.log(`      - Role: ${profile.role}`)
        console.log(`      - Profile completed: ${profile.profile_completed || 'N/A'}`)
        console.log('')
      })
    }
    
    // 3. Test signup with a new user
    console.log('3. Testing signup with new user:')
    const testEmail = `test-${Date.now()}@example.com`
    const testPassword = 'TestPassword123!'
    
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Test User',
          user_type: 'buyer'
        }
      }
    })
    
    if (signupError) {
      console.log('❌ Signup error:', signupError.message)
    } else {
      console.log('✅ Signup successful!')
      console.log(`   - User ID: ${signupData.user?.id}`)
      console.log(`   - Email: ${signupData.user?.email}`)
      console.log(`   - Confirmed: ${!!signupData.user?.email_confirmed_at}`)
      
      // 4. Try to sign in with the new user immediately
      console.log('\n4. Testing immediate signin with new user:')
      const { data: signinData, error: signinError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword
      })
      
      if (signinError) {
        console.log('❌ Signin error:', signinError.message)
        console.log('   Error code:', signinError.code)
        console.log('   Error status:', signinError.status)
      } else {
        console.log('✅ Signin successful!')
        console.log(`   - User ID: ${signinData.user?.id}`)
        console.log(`   - Email: ${signinData.user?.email}`)
      }
    }
    
    // 5. Test with an existing confirmed user
    console.log('\n5. Testing signin with existing confirmed user:')
    const confirmedUser = authUsers.users.find(u => u.email_confirmed_at)
    
    if (confirmedUser) {
      console.log(`   Trying with: ${confirmedUser.email}`)
      console.log('   ⚠️  Note: We don\'t know the password, so this will likely fail')
      console.log('   This is just to see what error we get')
      
      const { data: existingSignin, error: existingError } = await supabase.auth.signInWithPassword({
        email: confirmedUser.email,
        password: 'WrongPassword123!'
      })
      
      if (existingError) {
        console.log('   Expected error:', existingError.message)
        console.log('   Error code:', existingError.code)
      }
    }
    
  } catch (err) {
    console.error('❌ Unexpected error:', err.message)
  }
}

debugAuth()