import { createServerClient } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Navbar } from '@/components/navbar'
import { OptimizedImage } from '@/components/optimized-image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Calendar, ArrowRight, BookOpen } from 'lucide-react'
import { getUserSavedArticles } from '@/lib/blog-actions'

export default async function SavedArticlesPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin?redirect=/blog/saved')
  }

  const savedArticles = await getUserSavedArticles()

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Header */}
      <section className="bg-linear-to-r from-orange-500 to-red-500 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              Saved Articles
            </h1>
            <p className="text-xl mb-8 text-orange-100 max-w-2xl mx-auto">
              Your personal collection of inspiring stories and insights
            </p>
          </div>
        </div>
      </section>

      {/* Saved Articles */}
      <section className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">
              {savedArticles.length} Saved Article{savedArticles.length !== 1 ? 's' : ''}
            </h2>
            <Link href="/blog">
              <Button variant="outline" className="flex items-center gap-2">
                Browse Articles <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {savedArticles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {savedArticles.map((savedItem: any) => {
                const post = savedItem.article
                return (
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
                              Saved {new Date(savedItem.saved_at).toLocaleDateString()}
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
                          {post.tags?.slice(0, 3).map((tag: string) => (
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
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">
                <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No saved articles yet.</p>
                <p className="text-sm mb-6">Start exploring and save articles you want to read later!</p>
                <Link href="/blog">
                  <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                    Browse Articles
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}