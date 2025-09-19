// Quick signup test against Supabase project
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

async function run() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  const email = `test-${Date.now()}@example.com`
  const password = 'TestPassword123!'
  console.log('Signing up', email)
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: 'Test User', role: 'buyer' } }
  })
  if (error) {
    console.error('Signup error:', error.message)
    process.exit(1)
  }
  console.log('Signup ok:', !!data.user, data.user?.id)
  process.exit(0)
}

run().catch(err => { console.error(err); process.exit(1) })
