// Script to update user metadata
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env.local') })

async function updateUserMetadata() {
  try {
    console.log('🔥 Starting user metadata update...')
    
    // Create admin client using service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
    
    // User ID from the logs
    const userId = '1bc82f88-764b-431d-bf1f-71248d7de8ba'
    const userEmail = 'allofus773@gmail.com'
    
    console.log('📧 Updating user:', userEmail)
    console.log('🆔 User ID:', userId)
    
    // Update user metadata using admin API
    const { data, error } = await supabase.auth.admin.updateUserById(
      userId,
      {
        user_metadata: {
          email_verified: true,
          user_type: 'creator',
          role: 'creator',
          full_name: 'All of Us' // Adding full name too
        }
      }
    )
    
    if (error) {
      console.error('❌ Error updating user metadata:', error)
      return
    }
    
    console.log('✅ Successfully updated user metadata!')
    console.log('📄 New metadata:', data.user?.user_metadata)
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

updateUserMetadata()