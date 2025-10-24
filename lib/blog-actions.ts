'use server'

import { createServerClient } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

export async function saveArticle(articleId: string) {
  try {
    const supabase = await createServerClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'User not authenticated' }
    }

    const { error } = await supabase
      .from('saved_articles')
      .insert({
        user_id: user.id,
        article_id: articleId
      })

    if (error) {
      // If it's a unique constraint violation, the article is already saved
      if (error.code === '23505') {
        return { success: false, error: 'Article already saved' }
      }
      throw error
    }

    revalidatePath('/blog')
    return { success: true }
  } catch (error) {
    console.error('Error saving article:', error)
    return { success: false, error: 'Failed to save article' }
  }
}

export async function unsaveArticle(articleId: string) {
  try {
    const supabase = await createServerClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'User not authenticated' }
    }

    const { error } = await supabase
      .from('saved_articles')
      .delete()
      .eq('user_id', user.id)
      .eq('article_id', articleId)

    if (error) {
      throw error
    }

    revalidatePath('/blog')
    return { success: true }
  } catch (error) {
    console.error('Error unsaving article:', error)
    return { success: false, error: 'Failed to unsave article' }
  }
}

export async function checkIfArticleSaved(articleId: string) {
  try {
    const supabase = await createServerClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { isSaved: false }
    }

    const { data, error } = await supabase
      .from('saved_articles')
      .select('id')
      .eq('user_id', user.id)
      .eq('article_id', articleId)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    return { isSaved: !!data }
  } catch (error) {
    console.error('Error checking if article is saved:', error)
    return { isSaved: false }
  }
}

export async function getUserSavedArticles() {
  try {
    const supabase = await createServerClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return []
    }

    const { data, error } = await supabase
      .from('saved_articles')
      .select(`
        saved_at,
        article:blog_posts (
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
        )
      `)
      .eq('user_id', user.id)
      .order('saved_at', { ascending: false })

    if (error) {
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Error fetching saved articles:', error)
    return []
  }
}