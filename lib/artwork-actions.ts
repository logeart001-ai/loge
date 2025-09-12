'use server'

import { createServerClient } from '@/lib/supabase'
import { redirect } from 'next/navigation'

export async function uploadArtwork(prevState: any, formData: FormData) {
  const userId = formData.get('userId') as string
  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const category = formData.get('category') as string
  const medium = formData.get('medium') as string
  const price = parseFloat(formData.get('price') as string)
  const originalPrice = formData.get('originalPrice') as string
  const dimensions = formData.get('dimensions') as string
  const weight = formData.get('weight') as string
  const stockQuantity = parseInt(formData.get('stockQuantity') as string) || 1
  const isLimitedEdition = formData.get('isLimitedEdition') === 'on'
  const tags = JSON.parse(formData.get('tags') as string || '[]')

  // Validation
  if (!title || !category || !price || price <= 0) {
    return {
      error: 'Please fill in all required fields with valid values'
    }
  }

  try {
    const supabase = await createServerClient()
    
    // Create artwork record
    const artworkData = {
      creator_id: userId,
      title,
      description,
      category,
      medium,
      price,
      original_price: originalPrice ? parseFloat(originalPrice) : null,
      dimensions,
      weight: weight ? parseFloat(weight) : null,
      stock_quantity: stockQuantity,
      is_limited_edition: isLimitedEdition,
      tags,
      is_available: true,
      is_featured: false,
      // For now, we'll use placeholder images until we implement file upload
      image_urls: ['/image/AncestralEchoes.jpg'],
      thumbnail_url: '/image/AncestralEchoes.jpg'
    }

    const { data, error } = await supabase
      .from('artworks')
      .insert(artworkData)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return {
        error: 'Failed to upload artwork: ' + error.message
      }
    }

    return {
      success: true,
      message: 'Artwork uploaded successfully!',
      artworkId: data.id
    }
  } catch (error) {
    console.error('Upload error:', error)
    return {
      error: 'An unexpected error occurred while uploading your artwork'
    }
  }
}

export async function updateArtwork(artworkId: string, prevState: any, formData: FormData) {
  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const category = formData.get('category') as string
  const price = parseFloat(formData.get('price') as string)
  const isAvailable = formData.get('isAvailable') === 'on'

  if (!title || !category || !price || price <= 0) {
    return {
      error: 'Please fill in all required fields with valid values'
    }
  }

  try {
    const supabase = await createServerClient()
    
    const { error } = await supabase
      .from('artworks')
      .update({
        title,
        description,
        category,
        price,
        is_available: isAvailable,
        updated_at: new Date().toISOString()
      })
      .eq('id', artworkId)

    if (error) {
      return {
        error: 'Failed to update artwork: ' + error.message
      }
    }

    return {
      success: true,
      message: 'Artwork updated successfully!'
    }
  } catch (error) {
    return {
      error: 'An unexpected error occurred while updating your artwork'
    }
  }
}

export async function deleteArtwork(artworkId: string) {
  try {
    const supabase = await createServerClient()
    
    const { error } = await supabase
      .from('artworks')
      .delete()
      .eq('id', artworkId)

    if (error) {
      throw new Error(error.message)
    }

    redirect('/dashboard/creator/artworks')
  } catch (error) {
    throw new Error('Failed to delete artwork')
  }
}

export async function toggleArtworkAvailability(artworkId: string, isAvailable: boolean) {
  try {
    const supabase = await createServerClient()
    
    const { error } = await supabase
      .from('artworks')
      .update({ 
        is_available: isAvailable,
        updated_at: new Date().toISOString()
      })
      .eq('id', artworkId)

    if (error) {
      throw new Error(error.message)
    }

    return { success: true }
  } catch (error) {
    throw new Error('Failed to update artwork availability')
  }
}