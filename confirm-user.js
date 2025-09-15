// Manually confirm a user's email (admin use only)
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function confirmUser() {
  const email = process.argv[2]
  
  if (!email) {
    console.log('Usage: node confirm-user.js <email>')
    console.log('This will manually confirm the user\'s email address.')
    return
  }
  
  try {
    // Get all users and find the one with matching email
    const { data, error } = await supabaseAdmin.auth.admin.listUsers()
    
    if (error) {
      console.log('Error:', error.message)
      return
    }
    
    const user = data.users.find(u => u.email === email)
    
    if (!user) {
      console.log('User not found')
      return
    }
    
    if (user.email_confirmed_at) {
      console.log('User email is already confirmed')
      return
    }
    
    // Update user to confirm email
    const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { email_confirm: true }
    )
    
    if (updateError) {
      console.log('Error confirming user:', updateError.message)
      return
    }
    
    console.log('✅ User email confirmed successfully!')
    console.log('User can now sign in with their credentials.')
    
  } catch (err) {
    console.error('Error:', err.message)
  }
}

confirmUser()