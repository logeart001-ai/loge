/**
 * Seed Sample Data for L'oge Arts
 * Creates sample artworks and creators to populate the homepage
 */

/* eslint-disable @typescript-eslint/no-require-imports */
require('dotenv').config({ path: '.env.local' })

async function seedData() {
  const { createClient } = require('@supabase/supabase-js')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials')
    process.exit(1)
  }

  console.log('🔄 Connecting to Supabase...\n')
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  try {
    // Create sample creators first
    console.log('📝 Creating sample creators...')
    
    const creators = [
      {
        full_name: 'Adunni Olorunnisola',
        email: `adunni.${Date.now()}@example.com`,
        role: 'creator',
        bio: 'Contemporary Nigerian artist exploring identity and culture through mixed media',
        location: 'Lagos, Nigeria',
        discipline: 'painting',
        is_featured: true,
        is_verified: true,
        rating: 4.8,
        avatar_url: '/image/AdunniOlorunnisola.jpg'
      },
      {
        full_name: 'Amara Diallo',
        email: `amara.${Date.now()}@example.com`,
        role: 'creator',
        bio: 'Sculptor and painter celebrating African heritage',
        location: 'Dakar, Senegal',
        discipline: 'sculpture',
        is_featured: true,
        is_verified: true,
        rating: 4.9,
        avatar_url: '/image/AmaraDiallo.jpg'
      },
      {
        full_name: 'Kwame Asante',
        email: `kwame.${Date.now()}@example.com`,
        role: 'creator',
        bio: 'Digital artist merging traditional African motifs with modern design',
        location: 'Accra, Ghana',
        discipline: 'digital_art',
        is_featured: true,
        is_verified: true,
        rating: 4.7,
        avatar_url: '/image/KwameAsante.jpg'
      }
    ]

    const createdCreators = []
    for (const creator of creators) {
      const { data, error } = await supabase
        .from('user_profiles')
        .insert(creator)
        .select()
        .single()

      if (error) {
        console.log(`   ⚠️  Could not create ${creator.full_name}: ${error.message}`)
      } else {
        console.log(`   ✅ Created creator: ${creator.full_name}`)
        createdCreators.push(data)
      }
    }

    if (createdCreators.length === 0) {
      console.log('⚠️  No creators were created. Trying to use existing creators...')
      const { data: existingCreators } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('role', 'creator')
        .limit(3)

      if (existingCreators && existingCreators.length > 0) {
        createdCreators.push(...existingCreators)
        console.log(`   ✅ Found ${existingCreators.length} existing creators`)
      }
    }

    if (createdCreators.length === 0) {
      console.log('❌ No creators available. Please create a creator account first.')
      return
    }

    // Create sample artworks
    console.log('\n📝 Creating sample artworks...')
    
    const artworks = [
      {
        title: 'Ancestral Echoes',
        description: 'A powerful exploration of heritage and tradition through abstract forms',
        category: 'painting',
        price: 150000,
        original_price: 180000,
        currency: 'NGN',
        image_urls: ['/image/AncestralEchoes.jpg'],
        thumbnail_url: '/image/AncestralEchoes.jpg',
        is_featured: true,
        is_available: true,
        views_count: 245,
        creator_id: createdCreators[0].id
      },
      {
        title: 'Urban Rhythm',
        description: 'Dynamic representation of city life and modern African identity',
        category: 'painting',
        price: 125000,
        currency: 'NGN',
        image_urls: ['/image/urbanRythym.jpg'],
        thumbnail_url: '/image/urbanRythym.jpg',
        is_featured: true,
        is_available: true,
        views_count: 189,
        creator_id: createdCreators[1].id
      },
      {
        title: 'Mother Earth',
        description: 'Celebrating the connection between nature and humanity',
        category: 'sculpture',
        price: 200000,
        currency: 'NGN',
        image_urls: ['/image/Mother Earth.jpg'],
        thumbnail_url: '/image/Mother Earth.jpg',
        is_featured: true,
        is_available: true,
        views_count: 312,
        creator_id: createdCreators[2].id
      },
      {
        title: 'Sunset Over Lagos',
        description: 'Stunning depiction of Lagos skyline at golden hour',
        category: 'painting',
        price: 95000,
        currency: 'NGN',
        image_urls: ['/image/Sunset Over Lagos.png'],
        thumbnail_url: '/image/Sunset Over Lagos.png',
        is_featured: true,
        is_available: true,
        views_count: 156,
        creator_id: createdCreators[0].id
      },
      {
        title: 'Rhythms of the Sahel',
        description: 'Abstract interpretation of West African musical traditions',
        category: 'painting',
        price: 110000,
        currency: 'NGN',
        image_urls: ['/image/Rhythms of the Sahel.png'],
        thumbnail_url: '/image/Rhythms of the Sahel.png',
        is_featured: true,
        is_available: true,
        views_count: 178,
        creator_id: createdCreators[1].id
      },
      {
        title: 'Lagos Noir',
        description: 'Moody exploration of urban nightlife and contemporary culture',
        category: 'photography',
        price: 75000,
        currency: 'NGN',
        image_urls: ['/image/Lagos Noir.png'],
        thumbnail_url: '/image/Lagos Noir.png',
        is_featured: true,
        is_available: true,
        views_count: 203,
        creator_id: createdCreators[2].id
      }
    ]

    let artworkCount = 0
    for (const artwork of artworks) {
      const { error } = await supabase
        .from('artworks')
        .insert(artwork)

      if (error) {
        console.log(`   ⚠️  Could not create ${artwork.title}: ${error.message}`)
      } else {
        console.log(`   ✅ Created artwork: ${artwork.title}`)
        artworkCount++
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log('✨ Sample Data Seeded Successfully!')
    console.log('='.repeat(60))
    console.log(`\n📊 Summary:`)
    console.log(`   • Created ${createdCreators.length} creators`)
    console.log(`   • Created ${artworkCount} artworks`)
    
    console.log('\n🚀 Next Steps:')
    console.log('   1. Visit http://localhost:3001')
    console.log('   2. Scroll to "Featured Art Expressions" section')
    console.log('   3. See your artworks and creators displayed!')
    console.log('\n✨ Your homepage should now show beautiful art!')

  } catch (error) {
    console.error('\n❌ Error:', error.message)
    process.exit(1)
  }
}

seedData().catch(console.error)
