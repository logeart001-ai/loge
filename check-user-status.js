// Check user confirmation status
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkUserStatus() {
  const email = process.argv[2]
  
  if (!email) {
    console.log('Usage: node check-user-status.js <email>')
    return
  }
  
  try {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers()
    
    if (error) {
      console.log('Error:', error.message)
      return
    }
    
    const user = data.users.find(u => u.email === email)
    
    if (error) {
      console.log('Error:', error.message)
      return
    }
    
    if (!user) {
      console.log('User not found')
      return
    }
    
    console.log('User found:')
    console.log('- Email:', user.email)
    console.log('- Confirmed:', !!user.email_confirmed_at)
    console.log('- Created:', user.created_at)
    console.log('- Last sign in:', user.last_sign_in_at || 'Never')
    
    if (!user.email_confirmed_at) {
      console.log('\n⚠️  This user needs to confirm their email before they can sign in.')
      console.log('You can resend confirmation email from the app or manually confirm in Supabase dashboard.')
    }
    
  } catch (err) {
    console.error('Error:', err.message)
  }
}

checkUserStatus()