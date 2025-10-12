/**
 * Create Sample Analytics Data
 * Generates test orders and views to demonstrate the analytics dashboard
 */

require('dotenv').config({ path: '.env.local' })

async function createSampleData() {
  const { createClient } = require('@supabase/supabase-js')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials')
    process.exit(1)
  }

  console.log('🔄 Creating sample analytics data...\n')
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  try {
    // Get a creator user
    const { data: creators } = await supabase
      .from('user_profiles')
      .select('id, full_name, email')
      .eq('role', 'creator')
      .limit(1)

    if (!creators || creators.length === 0) {
      console.log('⚠️  No creator users found.')
      console.log('💡 Create a creator account first at: http://localhost:3000/auth/signup')
      return
    }

    const creator = creators[0]
    console.log(`✅ Found creator: ${creator.full_name} (${creator.email})`)

    // Get a collector user (or create orders as guest)
    const { data: collectors } = await supabase
      .from('user_profiles')
      .select('id, full_name, email')
      .eq('role', 'collector')
      .limit(1)

    const collector = collectors?.[0]
    if (collector) {
      console.log(`✅ Found collector: ${collector.full_name} (${collector.email})`)
    }

    // Get creator's artworks
    const { data: artworks } = await supabase
      .from('artworks')
      .select('*')
      .eq('creator_id', creator.id)

    if (!artworks || artworks.length === 0) {
      console.log('\n⚠️  No artworks found for this creator.')
      console.log('💡 Upload some artworks first to generate analytics data')
      return
    }

    console.log(`✅ Found ${artworks.length} artworks\n`)

    // Update artwork view counts
    console.log('📊 Step 1: Adding view counts to artworks...')
    for (const artwork of artworks) {
      const views = Math.floor(Math.random() * 500) + 50 // 50-550 views
      await supabase
        .from('artworks')
        .update({ views_count: views })
        .eq('id', artwork.id)
      
      console.log(`   ✓ ${artwork.title}: ${views} views`)
    }

    // Create sample orders (last 60 days)
    console.log('\n📊 Step 2: Creating sample orders...')
    const ordersToCreate = Math.min(15, artworks.length * 3) // Create up to 15 orders

    for (let i = 0; i < ordersToCreate; i++) {
      // Random artwork
      const artwork = artworks[Math.floor(Math.random() * artworks.length)]
      
      // Random date within last 60 days
      const daysAgo = Math.floor(Math.random() * 60)
      const orderDate = new Date()
      orderDate.setDate(orderDate.getDate() - daysAgo)
      
      // Create order
      const orderData = {
        creator_id: creator.id,
        buyer_id: collector?.id || null,
        buyer_email: collector?.email || 'guest@example.com',
        buyer_name: collector?.full_name || 'Guest Buyer',
        total_amount: parseFloat(artwork.price),
        status: 'delivered',
        payment_status: 'paid',
        payment_reference: `SAMPLE_${Date.now()}_${i}`,
        created_at: orderDate.toISOString(),
        updated_at: orderDate.toISOString()
      }

      const { data: newOrder, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single()

      if (orderError) {
        console.log(`   ❌ Error creating order: ${orderError.message}`)
        continue
      }

      // Create order item
      const { error: itemError } = await supabase
        .from('order_items')
        .insert({
          order_id: newOrder.id,
          artwork_id: artwork.id,
          creator_id: creator.id,
          quantity: 1
        })

      if (itemError) {
        console.log(`   ⚠️  Order item error: ${itemError.message}`)
      } else {
        console.log(`   ✓ Order #${i + 1}: ${artwork.title} - ₦${artwork.price} (${daysAgo} days ago)`)
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log('✨ Sample Analytics Data Created!')
    console.log('='.repeat(60))
    console.log('\n📊 Summary:')
    console.log(`   • Updated ${artworks.length} artworks with view counts`)
    console.log(`   • Created ${ordersToCreate} sample orders`)
    console.log(`   • Orders span last 60 days`)
    console.log(`   • All orders marked as delivered`)
    
    console.log('\n🚀 Next Steps:')
    console.log('   1. Start your development server: npm run dev')
    console.log('   2. Login as the creator: ' + creator.email)
    console.log('   3. Visit: http://localhost:3000/dashboard/creator/analytics')
    console.log('   4. See your analytics dashboard in action!')
    
    console.log('\n💡 Analytics Features:')
    console.log('   ✅ Sales trends chart (last 30 days)')
    console.log('   ✅ Revenue by category breakdown')
    console.log('   ✅ Top performing artworks')
    console.log('   ✅ Growth metrics and conversion rates')
    console.log('   ✅ Performance summary statistics')

  } catch (error) {
    console.error('\n❌ Error:', error.message)
    console.log('\n💡 Troubleshooting:')
    console.log('   1. Make sure your database is running')
    console.log('   2. Check your .env.local credentials')
    console.log('   3. Ensure orders and order_items tables exist')
    process.exit(1)
  }
}

// Run the script
createSampleData().catch(console.error)
