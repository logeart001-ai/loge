import { createServerClient } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Navbar } from '@/components/navbar'
import { OptimizedImage } from '@/components/optimized-image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Calendar, ArrowLeft, Share2, Heart } from 'lucide-react'

interface BlogPost {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string
  featured_image_url: string | null
  published_at: string
  tags: string[]
  author: {
    full_name: string
    avatar_url: string | null
    bio: string | null
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

  const { full_name, avatar_url, bio } = author as Record<string, unknown>

  return {
    full_name: typeof full_name === 'string' ? full_name : 'Unknown Author',
    avatar_url: typeof avatar_url === 'string' ? avatar_url : null,
    bio: typeof bio === 'string' ? bio : null,
  }
}

async function getBlogPost(slug: string): Promise<BlogPost | null> {
  try {
    const supabase = await createServerClient()
    
    // First, let's try a simpler query to debug
    const { data, error } = await supabase
      .from('blog_posts')
      .select(`
        id,
        title,
        slug,
        content,
        excerpt,
        featured_image_url,
        published_at,
        tags,
        author_id
      `)
      .eq('slug', slug)
      .eq('is_published', true)
      .single()

    if (error) {
      console.error('Error fetching blog post:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      return null
    }

    if (!data) {
      console.log('No blog post found for slug:', slug)
      return null
    }

    // Now get the author separately
    let author = null
    if (data.author_id) {
      const { data: authorData, error: authorError } = await supabase
        .from('user_profiles')
        .select('full_name, avatar_url, bio')
        .eq('id', data.author_id)
        .single()
      
      if (!authorError && authorData) {
        author = authorData
      }
    }

    const normalizedPost = {
      ...data,
      author: normalizeAuthor((data as { author: unknown }).author),
    } as BlogPost

    return normalizedPost
  } catch (error) {
    console.error('Unexpected error fetching blog post:', error)
    return null
  }
}

async function getRelatedPosts(currentSlug: string, tags: string[]): Promise<BlogPost[]> {
  try {
    const supabase = await createServerClient()
    
    const { data, error } = await supabase
      .from('blog_posts')
      .select(`
        id,
        title,
        slug,
        excerpt,
        content,
        featured_image_url,
        published_at,
        tags,
        author:user_profiles!author_id (
          full_name,
          avatar_url,
          bio
        )
      `)
      .eq('is_published', true)
      .neq('slug', currentSlug)
      .overlaps('tags', tags)
      .limit(3)

    if (error) {
      console.error('Error fetching related posts:', error)
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
    console.error('Unexpected error fetching related posts:', error)
    return []
  }
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getBlogPost(params.slug)
  
  if (!post) {
    notFound()
  }

  const relatedPosts = await getRelatedPosts(post.slug, post.tags)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Article Header */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link href="/blog">
            <Button variant="ghost" className="mb-6 text-orange-600 hover:bg-orange-50">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Articles
            </Button>
          </Link>

          <div className="mb-6">
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">
              {post.title}
            </h1>
            
            <p className="text-xl text-gray-600 mb-6 leading-relaxed">
              {post.excerpt}
            </p>

            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <OptimizedImage
                  src={post.author?.avatar_url || "/image/Blog Author Avatars.png"}
                  alt={post.author?.full_name || 'Author avatar'}
                  width={48}
                  height={48}
                  className="rounded-full object-cover"
                />
                <div>
                  <div className="font-medium text-gray-900">
                    {post.author?.full_name || 'Anonymous'}
                  </div>
                  <div className="text-sm text-gray-600 flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {new Date(post.published_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
                <Button variant="outline" size="sm">
                  <Heart className="w-4 h-4 mr-2" />
                  Save
                </Button>
              </div>
            </div>
          </div>

          {post.featured_image_url && (
            <div className="relative h-64 md:h-96 bg-gray-200 rounded-lg overflow-hidden mb-8">
              <OptimizedImage
                src={post.featured_image_url}
                alt={post.title}
                fill
                className="object-cover rounded-lg"
                sizes="(min-width: 768px) 100vw, 100vw"
                priority
              />
            </div>
          )}
        </div>

        {/* Article Content */}
        <div className="prose prose-lg max-w-none">
          <div className="text-gray-800 leading-relaxed">
            {post.content.split('\n\n').map((paragraph, index) => (
              <p key={index} className="mb-6 text-lg leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
        </div>

        {/* Author Bio */}
        {post.author && (
          <div className="mt-12 p-6 bg-white rounded-lg border">
            <div className="flex items-start gap-4">
              <OptimizedImage
                src={post.author.avatar_url || "/image/Blog Author Avatars.png"}
                alt={post.author.full_name}
                width={64}
                height={64}
                className="rounded-full object-cover"
              />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  About {post.author.full_name}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {post.author.bio || 'Passionate writer and art enthusiast contributing to the L\'oge Arts community.'}
                </p>
              </div>
            </div>
          </div>
        )}
      </article>

      {/* Related Articles */}
      {relatedPosts.length > 0 && (
        <section className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
              Related Articles
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {relatedPosts.map((relatedPost) => (
                <Card key={relatedPost.id} className="hover:shadow-lg transition-transform hover:-translate-y-1">
                  <CardContent className="p-0">
                    <div className="relative h-48 bg-gray-200 rounded-t-lg overflow-hidden">
                      <OptimizedImage
                        src={relatedPost.featured_image_url || "/image/Blog Post Featured Images.png"}
                        alt={relatedPost.title}
                        fill
                        className="object-cover rounded-t-lg"
                        sizes="(min-width: 768px) 33vw, 100vw"
                      />
                    </div>
                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                        {relatedPost.title}
                      </h3>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {relatedPost.excerpt}
                      </p>
                      <Link href={`/blog/${relatedPost.slug}`}>
                        <Button variant="ghost" className="w-full text-orange-600 hover:bg-orange-50">
                          Read Article
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Newsletter CTA */}
  <section className="py-12 bg-linear-to-r from-orange-500 to-red-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Enjoyed this article?
          </h2>
          <p className="text-lg text-orange-100 mb-8">
            Subscribe to our newsletter for more insights into African art and culture
          </p>
          <Link href="/blog">
            <Button className="bg-white text-orange-600 hover:bg-orange-50">
              Explore More Articles
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}

export async function generateStaticParams() {
  try {
    const supabase = await createServerClient()
    
    const { data: posts } = await supabase
      .from('blog_posts')
      .select('slug')
      .eq('is_published', true)

    return posts?.map((post) => ({
      slug: post.slug,
    })) || []
  } catch (error) {
    console.error('Error generating static params:', error)
    return []
  }
}