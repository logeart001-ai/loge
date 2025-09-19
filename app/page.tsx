import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Navbar } from '@/components/navbar'
import { BackgroundVideo } from '@/components/background-video'
import {
  getFeaturedArtworks,
  getFeaturedCreators,
  getUpcomingEvents,
  getBlogPosts
} from '@/lib/supabase-queries'
import { Users, BookOpen, Calendar, CalendarDays, MessageCircle, FileText, Instagram, Facebook, Twitter, Star, Heart, MapPin, Clock, ArrowRight, TrendingUp } from 'lucide-react'
import { Reveal } from '@/components/reveal'

export default async function HomePage() {
  // Local image mapping for Featured Artworks (filenames named after their cards)
  const localArtworkImages: Record<string, string> = {
    'ancestral-echoes': '/image/AncestralEchoes.jpg',
    'urban-rythym': '/image/urbanRythym.jpg',
    'resilience-ii': '/image/resilence2.jpg',
    'resilence-2': '/image/resilence2.jpg',
    'ankara-blazers': '/image/ankarablazers.jpg',
    'kente': '/image/kente.jpg',
  }
  // Local image mapping for Featured Creators (filenames named after creator full name, no spaces)
  // Example files detected in /public/image: AdunniOlorunnisola.jpg, AmaraDiallo.jpg, KwameAsante.jpg
  const localCreatorImages: Record<string, string> = {
    adunniolorunnisola: '/image/AdunniOlorunnisola.jpg',
    amaradiallo: '/image/AmaraDiallo.jpg',
    kwameasante: '/image/KwameAsante.jpg',
  }

  const getCreatorImageSrc = (creator: { full_name?: string | null; avatar_url?: string | null }): string => {
    const name = (creator.full_name || '').normalize('NFKD').replace(/[^\p{L}\p{N}]+/gu, '')
    const key = name.toLowerCase()
    if (localCreatorImages[key]) return localCreatorImages[key]
    // Fallback to remote avatar or placeholder
    return creator.avatar_url || '/image/Creator Avatars.png'
  }

  type ArtworkLike = { title?: string; thumbnail_url?: string | null; image_urls?: string[] | null }
  const getArtworkImageSrc = (artwork: ArtworkLike): string => {
    const title: string = artwork?.title || ''
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    if (localArtworkImages[slug]) return localArtworkImages[slug]
    for (const key of Object.keys(localArtworkImages)) {
      if (slug.includes(key) || key.includes(slug)) return localArtworkImages[key]
    }
    return artwork?.thumbnail_url || artwork?.image_urls?.[0] || "/image/AncestralEchoes.jpg"
  }
  // Fetch dynamic data from Supabase with fallbacks
  const [featuredArtworks, featuredCreators, upcomingEvents, blogPosts] = await Promise.allSettled([
    getFeaturedArtworks(3),
    getFeaturedCreators(3),
    getUpcomingEvents(3),
    getBlogPosts(3)
  ])

  // Extract data with fallbacks for failed promises
  let artworks = featuredArtworks.status === 'fulfilled' ? featuredArtworks.value : []
  const creators = featuredCreators.status === 'fulfilled' ? featuredCreators.value : []
  const events = upcomingEvents.status === 'fulfilled' ? upcomingEvents.value : []
  const posts = blogPosts.status === 'fulfilled' ? blogPosts.value : []

  // Add dummy data if we don't have enough artworks to show 3 cards
  const dummyArtworks = [
    {
      id: 'dummy-1',
      title: 'Desert Mirage',
      price: 85000,
      original_price: 95000,
      category: 'painting',
      thumbnail_url: '/image/Sunset Over Lagos.png',
      creator: {
        id: 'dummy-creator-1',
        full_name: 'Fatima Al-Rashid',
        avatar_url: '/image/Creator Avatars female.png',
        location: 'Cairo, Egypt',
        rating: 4.6
      }
    },
    {
      id: 'dummy-2',
      title: 'Ocean Waves',
      price: 72000,
      category: 'art_design',
      thumbnail_url: '/image/Urban Dreams.png',
      creator: {
        id: 'dummy-creator-2',
        full_name: 'Kofi Mensah',
        avatar_url: '/image/Creator Avatars male.png',
        location: 'Cape Coast, Ghana',
        rating: 4.8
      }
    },
    {
      id: 'dummy-3',
      title: 'Mountain Spirit',
      price: 110000,
      category: 'sculpture',
      thumbnail_url: '/image/Mother Earth.jpg',
      creator: {
        id: 'dummy-creator-3',
        full_name: 'Amina Hassan',
        avatar_url: '/image/Creator Avatars female.png',
        location: 'Marrakech, Morocco',
        rating: 4.7
      }
    }
  ]

  // Ensure we have exactly 3 artworks by adding dummy data if needed
  while (artworks.length < 3) {
    const dummyIndex = (artworks.length - (featuredArtworks.status === 'fulfilled' ? featuredArtworks.value.length : 0)) % dummyArtworks.length
    const dummyArtwork = { ...dummyArtworks[dummyIndex] }
    // Make each dummy artwork unique by adding the current length to the ID
    dummyArtwork.id = `${dummyArtwork.id}-${artworks.length}`
    artworks.push(dummyArtwork)
  }

  // Limit to exactly 3 artworks
  artworks = artworks.slice(0, 3)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero Section with Video Background */}
      <section className="relative bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50 overflow-hidden h-screen flex items-center">
        {/* Background Video */}
        <div className="absolute inset-0 w-full h-full">
          <BackgroundVideo
            src="/video/Nigerian_Art_Gallery_Video_Backdrop.mp4"
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Video Overlay for better text readability */}
          <div className="absolute inset-0 bg-black/50"></div>
        </div>

        {/* Pattern overlay (optional - you can remove this if you prefer just the video) */}
        <div className="absolute inset-0 bg-[url('/image/African Art Pattern Background.png')] opacity-5 z-10"></div>

        {/* Content - positioned above the video */}
        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Reveal>
              <h1 className="hero-title text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-4 md:mb-6 drop-shadow-lg">
                <span className="text-orange-400">African Creativity</span>{" "}
                <br className="hidden sm:block" />
                <span className="text-white">Across All Mediums</span>
              </h1>
            </Reveal>
            <Reveal delay={100}>
              <p className="text-lg md:text-xl text-gray-100 mb-4 max-w-3xl mx-auto drop-shadow-md">
                Discover authentic art, fashion, and literature from Africa&apos;s most talented creators.
                Support artists while building your collection of unique cultural treasures.
              </p>
              <p className="accent-text text-lg md:text-xl text-orange-200 mb-8 md:mb-12 drop-shadow-md">
                Where creativity meets culture
              </p>
            </Reveal>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Reveal>
                <Link href="/art">
                  <Button className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white px-6 md:px-8 py-3 text-base md:text-lg">
                    Explore Gallery
                  </Button>
                </Link>
              </Reveal>
              <Reveal delay={100}>
                <Link href="/auth/signup?type=creator">
                  <Button className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white px-6 md:px-8 py-3 text-base md:text-lg">
                    Join as Artist
                  </Button>
                </Link>
              </Reveal>
              <Reveal delay={200}>
                <Link href="/events">
                  <Button className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white px-6 md:px-8 py-3 text-base md:text-lg">
                    Attend Events
                  </Button>
                </Link>
              </Reveal>
            </div>

            {/* Quick Category Links */}
            <div className="flex flex-wrap justify-center gap-3 md:gap-4">
              {[
                { name: 'Art Designs', href: '/art?category=art_design', icon: '🎨' },
                { name: 'Paintings', href: '/art?category=painting', icon: '🖼️' },
                { name: 'Sculptures', href: '/art?category=sculpture', icon: '🗿' },
                { name: 'Books', href: '/books', icon: '📚' },
                { name: 'Fashion', href: '/fashion', icon: '👗' }
              ].map((category) => (
                <Link key={category.name} href={category.href}>
                  <Badge
                    variant="secondary"
                    className="px-3 md:px-4 py-2 text-sm md:text-base bg-white bg-opacity-20 text-white hover:bg-orange-500 hover:text-white cursor-pointer transition-colors backdrop-blur-sm"
                  >
                    <span className="mr-2">{category.icon}</span>
                    {category.name}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>



      {/* Featured Art Expression */}
      <section className="py-12 md:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 md:mb-12">
            <div>
              <h2 className="section-title text-2xl md:text-3xl font-bold text-gray-900 mb-2">Featured Art Expressions</h2>
              <p className="text-gray-600">Handpicked pieces from our most talented creators</p>
            </div>
            <Link href="/art" className="mt-4 md:mt-0">
              <Button variant="outline" className="flex items-center gap-2">
                View All <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {artworks.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {artworks.map((artwork, idx) => (
                <Reveal key={artwork.id} delay={([0, 100, 200] as const)[idx % 3]}>
                  <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 pt-0">
                    <CardContent className="p-0">
                      <div className="relative overflow-hidden h-40 md:h-48 bg-white">
                        {(() => {
                          const src = getArtworkImageSrc(artwork)
                          return (
                            <>
                              {/* Background cover layer for a full, rich fill without cropping the foreground */}
                              <Image
                                src={src}
                                alt=""
                                fill
                                aria-hidden="true"
                                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                                className="object-cover scale-110 blur-xl opacity-40"
                                priority={false}
                              />
                              {/* Foreground full image, never cropped */}
                              <Image
                                src={src}
                                alt={artwork.title}
                                fill
                                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                                className="object-contain object-center drop-shadow-sm"
                                priority={idx < 6}
                              />
                            </>
                          )
                        })()}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <Button size="sm" variant="secondary" className="rounded-full w-8 h-8 p-0">
                            <Heart className="w-3 h-3" />
                          </Button>
                        </div>
                        {artwork.original_price && (
                          <Badge className="absolute top-2 left-2 bg-red-500 text-white text-xs">
                            Sale
                          </Badge>
                        )}
                      </div>

                      <div className="p-3 md:p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="card-title font-bold text-sm md:text-base text-gray-900 group-hover:text-orange-600 transition-colors line-clamp-1">
                              {artwork.title}
                            </h3>
                            <p className="text-gray-600 text-xs">by {artwork.creator?.full_name}</p>
                          </div>
                          <Badge variant="secondary" className="ml-2 text-xs">
                            {artwork.category.replace('_', ' ')}
                          </Badge>
                        </div>

                        <div className="flex items-center mb-2">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3 h-3 ${i < Math.floor(artwork.creator?.rating || 0)
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                                  }`}
                              />
                            ))}
                            <span className="ml-1 text-xs text-gray-600">
                              {artwork.creator?.rating?.toFixed(1) || 'New'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <span className="text-base md:text-lg font-bold text-gray-900">
                              ₦{artwork.price?.toLocaleString()}
                            </span>
                            {artwork.original_price && (
                              <span className="text-sm text-gray-500 line-through">
                                ₦{artwork.original_price.toLocaleString()}
                              </span>
                            )}
                          </div>
                          <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-xs px-2 py-1">
                            View
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Reveal>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">
                <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No featured artworks available at the moment.</p>
                <p className="text-sm">Check back soon for amazing pieces from our creators!</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Creator Spotlight */}
      <section className="py-8 md:py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6 md:mb-8">
            <h2 className="section-title text-xl md:text-2xl font-bold text-gray-900 mb-2">Featured Creators</h2>
            <p className="text-gray-600 text-sm max-w-xl mx-auto">
              Meet the talented artists shaping African creativity
            </p>
          </div>

          {creators.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              {creators.map((creator, idx) => (
                <Reveal key={creator.id} delay={([0, 100, 200] as const)[idx % 3]}>
                  <Card className="text-center hover:shadow-md transition-transform hover:-translate-y-1">
                    <CardContent className="p-4 md:p-5">
                      <div className="relative mb-4 w-16 h-16 md:w-18 md:h-18 mx-auto">
                        <Image
                          src={getCreatorImageSrc(creator)}
                          alt={creator.full_name}
                          fill
                          className="rounded-full object-cover"
                          sizes="(min-width: 768px) 72px, 64px"
                        />
                        {creator.is_verified && (
                          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                            <Badge className="bg-brand-red text-white text-xs px-1 py-0">Verified</Badge>
                          </div>
                        )}
                      </div>

                      <h3 className="card-title text-base md:text-lg font-semibold text-gray-900 mb-1">
                        {creator.full_name}
                      </h3>

                      <div className="flex items-center justify-center gap-1 mb-2">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-600">{creator.location}</span>
                      </div>

                      <p className="text-gray-600 text-xs mb-3 line-clamp-1">
                        {creator.bio || creator.discipline}
                      </p>

                      <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="text-center">
                          <div className="font-bold text-sm text-gray-900">{creator.artworks?.length || 0}</div>
                          <div className="text-xs text-gray-600">Works</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-sm text-gray-900 flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-400 fill-current" />
                            {creator.rating?.toFixed(1) || 'New'}
                          </div>
                          <div className="text-xs text-gray-600">Rating</div>
                        </div>
                      </div>

                      <Link href={`/creators/${creator.id}`}>
                        <Button variant="outline" size="sm" className="w-full text-orange-500 border-orange-500 hover:bg-orange-50 text-xs">
                          View Profile
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                </Reveal>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">
                <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No featured creators available at the moment.</p>
                <p className="text-sm">We&apos;re working on bringing you amazing artists!</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="py-12 md:py-16 bg-gradient-to-r from-orange-500 to-red-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="section-title text-2xl md:text-3xl font-bold text-white mb-4">Upcoming Events</h2>
            <p className="text-orange-100 max-w-2xl mx-auto">
              Join exhibitions, workshops, and cultural celebrations
            </p>
          </div>

          {events.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {events.map((event, idx) => (
                <Reveal key={event.id} delay={([0, 100, 200] as const)[idx % 3]}>
                  <Card className="bg-white hover:shadow-xl transition-transform hover:-translate-y-1 pt-0">
                    <CardContent className="p-6">
                      {event.banner_image_url && (
                        <div className="relative h-40 rounded-md overflow-hidden mb-4">
                          <Image
                            src={event.banner_image_url}
                            alt={event.title}
                            fill
                            className="object-cover"
                            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                          />
                        </div>
                      )}
                      <div className="text-center mb-4">
                        <div className="text-2xl md:text-3xl font-bold text-gray-900">
                          {new Date(event.start_date).getDate()}
                        </div>
                        <div className="text-gray-600">
                          {new Date(event.start_date).toLocaleDateString('en-US', { month: 'short' })}
                        </div>
                      </div>

                      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                        {event.title}
                      </h3>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <CalendarDays className="w-5 h-5 text-orange-600" strokeWidth={2.5} aria-hidden="true" />
                          {new Date(event.start_date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          {new Date(event.start_date).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit'
                          })}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4" />
                          {event.event_type === 'virtual' ? 'Virtual Event' : `${event.city}, ${event.country}`}
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-900">
                          {event.is_free ? 'Free' : `₦${event.ticket_price?.toLocaleString()}`}
                        </span>
                        <Button className="bg-orange-500 hover:bg-orange-600 text-white transition-transform hover:-translate-y-0.5">
                          Register
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </Reveal>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-white mb-4">
                <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No upcoming events at the moment.</p>
                <p className="text-sm text-orange-100">Stay tuned for exciting cultural events!</p>
              </div>
            </div>
          )}

          <div className="text-center mt-8">
            <Link href="/events">
              <Button variant="secondary" className="bg-white text-orange-600 hover:bg-orange-50">
                View All Events
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Blog/Journal Section */}
      <section className="py-12 md:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 md:mb-12">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Stories & Insights</h2>
              <p className="text-gray-600">Behind-the-scenes stories and cultural deep-dives</p>
            </div>
            <Link href="/blog" className="mt-4 md:mt-0">
              <Button variant="outline" className="flex items-center gap-2">
                Read More <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {posts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {posts.map((post, idx) => (
                <Reveal key={post.id} delay={([0, 100, 200] as const)[idx % 3]}>
                  <Card className="hover:shadow-lg transition-transform hover:-translate-y-1 pt-0">
                    <CardContent className="p-0">
                      <div className="relative h-48 bg-gray-200 rounded-t-lg overflow-hidden">
                        <Image
                          src={post.featured_image_url || "/image/Blog Post Featured Images.png"}
                          alt={post.title}
                          fill
                          className="object-cover rounded-t-lg"
                          sizes="(min-width: 768px) 33vw, 100vw"
                        />
                      </div>

                      <div className="p-6">
                        <div className="flex items-center gap-2 mb-3">
                          <Image
                            src={post.author?.avatar_url || "/image/Blog Author Avatars.png"}
                            alt={post.author?.full_name || 'Author avatar'}
                            width={32}
                            height={32}
                            className="rounded-full object-cover"
                          />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {post.author?.full_name}
                            </div>
                            <div className="text-xs text-gray-600">
                              {new Date(post.published_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>

                        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                          {post.title}
                        </h3>

                        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                          {post.excerpt}
                        </p>

                        <div className="flex flex-wrap gap-2 mb-4">
                          {post.tags?.slice(0, 2).map((tag: string) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>

                        <Link href={`/blog/${post.slug}`}>
                          <Button variant="ghost" className="w-full text-orange-600 hover:bg-orange-50 transition-transform hover:-translate-y-0.5">
                            Read Article
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </Reveal>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No blog posts available at the moment.</p>
                <p className="text-sm">We&apos;re working on bringing you inspiring stories!</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Community Features */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Join Our Growing Community</h2>
          <p className="text-lg md:text-xl text-gray-600 mb-8 md:mb-12 max-w-3xl mx-auto">
            Connect with artists and art lovers across Africa and beyond. Share your passion,
            discover new talents, and be part of a vibrant creative ecosystem.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-12">
            {[
              {
                icon: MessageCircle,
                title: 'Artist Q&A Sessions',
                description: 'Join live conversations with featured artists and learn about their creative process.',
                color: 'blue'
              },
              {
                icon: Users,
                title: 'Virtual Hangouts',
                description: 'Connect with fellow art enthusiasts in our monthly virtual meetups.',
                color: 'green'
              },
              {
                icon: TrendingUp,
                title: 'Featured Artist Program',
                description: 'Get spotlighted as our Artist of the Month and reach new audiences.',
                color: 'purple'
              }
            ].map((feature, index) => (
              <Reveal key={index} delay={([0, 100, 200] as const)[index % 3]}>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-lg mb-4">
                    <feature.icon className="h-8 w-8 text-orange-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              </Reveal>
            ))}
          </div>


        </div>
      </section>



      {/* Creator CTA */}
      <section className="py-8 md:py-12 bg-gradient-to-br from-yellow-50 to-orange-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">Are You An African Creator?</h2>
          <p className="text-lg text-gray-600 mb-6">
            Join our platform to showcase and sell your work to a global audience.
          </p>

          <Link href="/auth/signup?type=creator">
            <Reveal>
              <Button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2">
                Start Selling Today
              </Button>
            </Reveal>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-1">
              <div className="flex items-center space-x-2 mb-4">
                <Image src="/image/logelogo.png" alt="L&apos;oge Arts logo" width={64} height={64} />
                <span className="font-semibold text-lg">L&apos;oge Arts</span>
              </div>
              <p className="text-gray-400 text-sm mb-6">
                Celebrating contemporary African artistry across visual art,
                fashion, and literature. Connecting creators with global audiences.
              </p>
              <div className="flex space-x-4">
                <Link href="https://www.instagram.com/loge_arts?igsh=cXAydGVqc3V0cmNn&utm_source=" target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white p-2">
                    <Instagram className="h-5 w-5" />
                  </Button>
                </Link>
                <Link href="https://www.facebook.com/share/1BAepZxJou/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white p-2">
                    <Facebook className="h-5 w-5" />
                  </Button>
                </Link>
                <Link href="https://x.com/logeafrica?s=21" target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white p-2">
                    <Twitter className="h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Marketplace</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/art" className="hover:text-white transition-colors">Art & Designs</Link></li>
                <li><Link href="/fashion" className="hover:text-white transition-colors">Fashion</Link></li>
                <li><Link href="/books" className="hover:text-white transition-colors">Books</Link></li>
                <li><Link href="/events" className="hover:text-white transition-colors">Events</Link></li>
                <li><Link href="/creators" className="hover:text-white transition-colors">Featured Creators</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">For Creators</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/creator-application" className="hover:text-white transition-colors">Apply to Join</Link></li>
                <li><Link href="/resources" className="hover:text-white transition-colors">Resources</Link></li>
                <li><Link href="/community" className="hover:text-white transition-colors">Community</Link></li>
                <li><Link href="/pricing-guide" className="hover:text-white transition-colors">Pricing Guide</Link></li>
                <li><Link href="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Stay Updated</h3>
              <p className="text-gray-400 text-sm mb-4">
                Subscribe to our newsletter for new artist announcements, exclusive offers, and event invitations.
              </p>
              <div className="space-y-3">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-orange-500"
                />
                <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                  Subscribe
                </Button>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm mb-4 md:mb-0">
              © 2024 L&apos;oge Arts. All rights reserved.
            </p>
            <div className="flex space-x-6 text-sm text-gray-400">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
              <Link href="/cookies" className="hover:text-white transition-colors">Cookie Policy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
