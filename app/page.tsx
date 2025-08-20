import Link from 'next/link'
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
import { Users, BookOpen, Shirt, Calendar, Upload, MessageCircle, FileText, Instagram, Facebook, Twitter, Star, Heart, MapPin, Clock, ArrowRight, TrendingUp, Award, Globe } from 'lucide-react'

export default async function HomePage() {
  // Fetch dynamic data from Supabase with fallbacks
  const [featuredArtworks, featuredCreators, upcomingEvents, blogPosts] = await Promise.allSettled([
    getFeaturedArtworks(6),
    getFeaturedCreators(3),
    getUpcomingEvents(3),
    getBlogPosts(3)
  ])

  // Extract data with fallbacks for failed promises
  const artworks = featuredArtworks.status === 'fulfilled' ? featuredArtworks.value : []
  const creators = featuredCreators.status === 'fulfilled' ? featuredCreators.value : []
  const events = upcomingEvents.status === 'fulfilled' ? upcomingEvents.value : []
  const posts = blogPosts.status === 'fulfilled' ? blogPosts.value : []

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero Section with Video Background */}
      <section className="relative bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50 py-12 md:py-20 overflow-hidden">
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
        <div className="absolute inset-0 bg-[url('/placeholder.svg?height=800&width=1200&text=African+Art+Pattern')] opacity-5 z-10"></div>

        {/* Content - positioned above the video */}
        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-4 md:mb-6 drop-shadow-lg">
              <span className="text-orange-400">African Creativity</span>{" "}
              <br className="hidden sm:block" />
              <span className="text-white">Across All Mediums</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-100 mb-8 md:mb-12 max-w-3xl mx-auto drop-shadow-md">
              Discover authentic art, fashion, and literature from Africa&apos;s most talented creators.
              Support artists while building your collection of unique cultural treasures.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/art">
                <Button className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white px-6 md:px-8 py-3 text-base md:text-lg">
                  Explore Gallery
                </Button>
              </Link>
              <Link href="/auth/signup?type=creator">
                <Button variant="outline" className="w-full sm:w-auto border-white text-white hover:bg-white hover:text-orange-500 px-6 md:px-8 py-3 text-base md:text-lg backdrop-blur-sm">
                  Join as Artist
                </Button>
              </Link>
              <Link href="/events">
                <Button variant="outline" className="w-full sm:w-auto border-white text-white hover:bg-white hover:text-gray-700 px-6 md:px-8 py-3 text-base md:text-lg backdrop-blur-sm">
                  Attend Events
                </Button>
              </Link>
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

      {/* Stats Section */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {[
              { icon: Users, value: '500+', label: 'African Artists', color: 'orange' },
              { icon: BookOpen, value: '1,200+', label: 'Artworks', color: 'red' },
              { icon: Globe, value: '50+', label: 'Countries', color: 'blue' },
              { icon: Award, value: '98%', label: 'Satisfaction', color: 'green' }
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 bg-orange-100 rounded-lg mb-3 md:mb-4">
                  <stat.icon className="h-6 w-6 md:h-8 md:w-8 text-orange-600" />
                </div>
                <div className="text-2xl md:text-3xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm md:text-base text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Artworks */}
      <section className="py-12 md:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 md:mb-12">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Featured Artworks</h2>
              <p className="text-gray-600">Handpicked pieces from our most talented creators</p>
            </div>
            <Link href="/art" className="mt-4 md:mt-0">
              <Button variant="outline" className="flex items-center gap-2">
                View All <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {artworks.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {artworks.map((artwork) => (
                <Card key={artwork.id} className="group cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  <CardContent className="p-0">
                    <div className="relative overflow-hidden">
                      <img
                        src={artwork.thumbnail_url || artwork.image_urls?.[0] || "/placeholder.svg?height=300&width=400&text=Artwork"}
                        alt={artwork.title}
                        className="w-full h-48 md:h-64 object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <Button size="sm" variant="secondary" className="rounded-full w-10 h-10 p-0">
                          <Heart className="w-4 h-4" />
                        </Button>
                      </div>
                      {artwork.original_price && (
                        <Badge className="absolute top-4 left-4 bg-red-500 text-white">
                          Sale
                        </Badge>
                      )}
                    </div>

                    <div className="p-4 md:p-6">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-gray-900 group-hover:text-orange-600 transition-colors line-clamp-1">
                            {artwork.title}
                          </h3>
                          <p className="text-gray-600 text-sm">by {artwork.creator?.full_name}</p>
                        </div>
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {artwork.category.replace('_', ' ')}
                        </Badge>
                      </div>

                      <div className="flex items-center mb-3">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${i < Math.floor(artwork.creator?.rating || 0)
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                                }`}
                            />
                          ))}
                          <span className="ml-2 text-sm text-gray-600">
                            {artwork.creator?.rating?.toFixed(1) || 'New'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xl md:text-2xl font-bold text-gray-900">
                            ₦{artwork.price?.toLocaleString()}
                          </span>
                          {artwork.original_price && (
                            <span className="text-lg text-gray-500 line-through">
                              ₦{artwork.original_price.toLocaleString()}
                            </span>
                          )}
                        </div>
                        <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
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
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Featured Creators</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Meet the talented artists who are shaping the future of African creativity
            </p>
          </div>

          {creators.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {creators.map((creator) => (
                <Card key={creator.id} className="text-center hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 md:p-8">
                    <div className="relative mb-6">
                      <img
                        src={creator.avatar_url || "/placeholder.svg?height=120&width=120&text=Creator"}
                        alt={creator.full_name}
                        className="w-20 h-20 md:w-24 md:h-24 rounded-full mx-auto object-cover"
                      />
                      {creator.is_verified && (
                        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                          <Badge className="bg-blue-500 text-white text-xs">Verified</Badge>
                        </div>
                      )}
                    </div>

                    <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">
                      {creator.full_name}
                    </h3>

                    <div className="flex items-center justify-center gap-1 mb-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{creator.location}</span>
                    </div>

                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {creator.bio || creator.discipline}
                    </p>

                    <div className="flex items-center justify-center gap-4 mb-6">
                      <div className="text-center">
                        <div className="font-bold text-gray-900">{creator.artworks?.length || 0}</div>
                        <div className="text-xs text-gray-600">Artworks</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-gray-900 flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          {creator.rating?.toFixed(1) || 'New'}
                        </div>
                        <div className="text-xs text-gray-600">Rating</div>
                      </div>
                    </div>

                    <Link href={`/creators/${creator.id}`}>
                      <Button variant="outline" className="w-full text-orange-500 border-orange-500 hover:bg-orange-50">
                        View Profile
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">
                <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No featured creators available at the moment.</p>
                <p className="text-sm">We're working on bringing you amazing artists!</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="py-12 md:py-16 bg-gradient-to-r from-orange-500 to-red-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Upcoming Events</h2>
            <p className="text-orange-100 max-w-2xl mx-auto">
              Join exhibitions, workshops, and cultural celebrations
            </p>
          </div>

          {events.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {events.map((event) => (
                <Card key={event.id} className="bg-white hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
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
                      <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                        Register
                      </Button>
                    </div>
                  </CardContent>
                </Card>
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
              {posts.map((post) => (
                <Card key={post.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-0">
                    <div className="h-48 bg-gray-200 rounded-t-lg">
                      {post.featured_image_url && (
                        <img
                          src={post.featured_image_url || "/placeholder.svg"}
                          alt={post.title}
                          className="w-full h-48 object-cover rounded-t-lg"
                        />
                      )}
                    </div>

                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <img
                          src={post.author?.avatar_url || "/placeholder.svg?height=32&width=32&text=Author"}
                          alt={post.author?.full_name}
                          className="w-8 h-8 rounded-full object-cover"
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
                        {post.tags?.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      <Link href={`/blog/${post.slug}`}>
                        <Button variant="ghost" className="w-full text-orange-600 hover:bg-orange-50">
                          Read Article
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No blog posts available at the moment.</p>
                <p className="text-sm">We're working on bringing you inspiring stories!</p>
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
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-lg mb-4">
                  <feature.icon className="h-8 w-8 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>

          <div className="mb-12">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Follow Us for Daily Updates</h3>
            <div className="flex justify-center space-x-4">
              {[
                { icon: Instagram, name: 'Instagram', href: '#' },
                { icon: Facebook, name: 'Facebook', href: '#' },
                { icon: Twitter, name: 'Twitter', href: '#' }
              ].map((social) => (
                <Button key={social.name} variant="outline" className="flex items-center space-x-2">
                  <social.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{social.name}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="py-12 md:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Stay Updated</h2>
          <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Subscribe to our newsletter for new artist announcements, exclusive offers,
            and event invitations
          </p>
          <div className="max-w-md mx-auto flex flex-col sm:flex-row gap-4">
            <Input
              type="email"
              placeholder="Enter your email"
              className="flex-1"
            />
            <Button className="bg-orange-500 hover:bg-orange-600 text-white">
              Subscribe
            </Button>
          </div>
        </div>
      </section>

      {/* Creator CTA */}
      <section className="py-12 md:py-16 bg-gradient-to-br from-yellow-50 to-orange-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Are You An African Creator?</h2>
          <p className="text-lg md:text-xl text-gray-600 mb-8 md:mb-12 max-w-3xl mx-auto">
            Join our platform to showcase and sell your work to a global audience.
            We provide the tools, community, and support you need to thrive as a creative professional.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-12">
            {[
              {
                icon: Upload,
                title: 'Easy Upload',
                description: 'Simple process to showcase your art and reach global buyers with our intuitive platform.',
                color: 'yellow'
              },
              {
                icon: MessageCircle,
                title: 'Community Support',
                description: 'Connect with fellow artists and creative professionals in our supportive community.',
                color: 'red'
              },
              {
                icon: FileText,
                title: 'Resources & Guides',
                description: 'Access comprehensive guides for pricing, marketing, and growing your creative business.',
                color: 'blue'
              }
            ].map((feature, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-lg mb-4">
                  <feature.icon className="h-8 w-8 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>

          <Link href="/auth/signup?type=creator">
            <Button className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 text-lg">
              Start Selling Today
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-1">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">L</span>
                </div>
                <span className="font-semibold text-lg">L'oge Arts</span>
              </div>
              <p className="text-gray-400 text-sm mb-6">
                Celebrating contemporary African artistry across visual art,
                fashion, and literature. Connecting creators with global audiences.
              </p>
              <div className="flex space-x-4">
                {[Instagram, Facebook, Twitter].map((Icon, index) => (
                  <Button key={index} variant="ghost" size="sm" className="text-gray-400 hover:text-white p-2">
                    <Icon className="h-5 w-5" />
                  </Button>
                ))}
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
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link href="/careers" className="hover:text-white transition-colors">Careers</Link></li>
                <li><Link href="/press" className="hover:text-white transition-colors">Press</Link></li>
              </ul>
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
