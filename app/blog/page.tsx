import { createServerClient } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Navbar } from '@/components/navbar'
import { OptimizedImage } from '@/components/optimized-image'
import { BlogSearch } from '@/components/blog/blog-search'
import Link from 'next/link'
import { Search, Calendar, ArrowRight } from 'lucide-react'

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  featured_image_url: string | null
  published_at: string
  tags: string[]
  author: {
    full_name: string
    avatar_url: string | null
  } | null
}

function normalizeAuthor(authorData: unknown): BlogPost['author'] {
  if (!authorData) {
    return null
  }

  const author = Array.isArray(authorData) ? authorData[0] : authorData

  if (!author || typeof author !== 'object') {
    return null
  }

  const { full_name, avatar_url } = author as Record<string, unknown>

  return {
    full_name: typeof full_name === 'string' ? full_name : 'Unknown Author',
    avatar_url: typeof avatar_url === 'string' ? avatar_url : null,
  }
}

async function getBlogPosts(searchQuery?: string, tags?: string[]): Promise<BlogPost[]> {
  try {
    const supabase = await createServerClient()
    
    let query = supabase
      .from('blog_posts')
      .select(`
        id,
        title,
        slug,
        excerpt,
        featured_image_url,
        published_at,
        tags,
        author:user_profiles!author_id (
          full_name,
          avatar_url
        )
      `)
      .eq('is_published', true)

    // Add search filter
    if (searchQuery) {
      query = query.or(`title.ilike.%${searchQuery}%,excerpt.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`)
    }

    // Add tag filter
    if (tags && tags.length > 0) {
      query = query.overlaps('tags', tags)
    }

    const { data, error } = await query.order('published_at', { ascending: false })

    if (error) {
      console.error('Error fetching blog posts:', error)
      return []
    }

    if (!data) {
      return []
    }

    return data.map((item) => ({
      ...item,
      author: normalizeAuthor((item as { author: unknown }).author),
    })) as BlogPost[]
  } catch (error) {
    console.error('Unexpected error fetching blog posts:', error)
    return []
  }
}

export default async function BlogPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ q?: string; tags?: string }> 
}) {
  const { q: searchQuery, tags: tagsParam } = await searchParams
  const tags = tagsParam ? tagsParam.split(',').filter(Boolean) : []
  const posts = await getBlogPosts(searchQuery, tags)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-orange-500 to-red-500 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              Stories & Insights
            </h1>
            <p className="text-xl mb-8 text-orange-100 max-w-2xl mx-auto">
              Explore the rich world of African art, culture, and creativity through our curated articles and insights
            </p>
            <BlogSearch />
          </div>
        </div>
      </section>

      {/* Blog Posts */}
      <section className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {posts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => (
                <Card key={post.id} className="hover:shadow-lg transition-transform hover:-translate-y-1">
                  <CardContent className="p-0">
                    <div className="relative h-48 bg-gray-200 rounded-t-lg overflow-hidden">
                      <OptimizedImage
                        src={post.featured_image_url || "/image/Blog Post Featured Images.png"}
                        alt={post.title}
                        fill
                        className="object-cover rounded-t-lg"
                        sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                      />
                    </div>

                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <OptimizedImage
                          src={post.author?.avatar_url || "/image/Blog Author Avatars.png"}
                          alt={post.author?.full_name || 'Author avatar'}
                          width={32}
                          height={32}
                          className="rounded-full object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {post.author?.full_name || 'Anonymous'}
                          </div>
                          <div className="text-xs text-gray-600 flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(post.published_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
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
                        {post.tags?.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      <Link href={`/blog/${post.slug}`}>
                        <Button variant="ghost" className="w-full text-orange-600 hover:bg-orange-50 group">
                          Read Article
                          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
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
                <Search className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No articles available at the moment.</p>
                <p className="text-sm">Check back soon for inspiring stories and insights!</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="py-12 bg-gradient-to-r from-orange-500 to-red-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Stay Updated with Our Latest Stories
          </h2>
          <p className="text-lg text-orange-100 mb-8">
            Get the latest articles and insights delivered directly to your inbox
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <Input
              type="email"
              placeholder="Enter your email"
              className="flex-1 bg-white"
            />
            <Button className="bg-white text-orange-600 hover:bg-orange-50">
              Subscribe
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}