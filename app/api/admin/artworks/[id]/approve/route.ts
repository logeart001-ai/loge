import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { revalidatePath, revalidateTag } from 'next/cache'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient()
    const artworkId = params.id

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Get request body
    const body = await request.json()
    const { review_notes, set_as_featured } = body

    // Get artwork details for notification
    const { data: artwork } = await supabase
      .from('artworks')
      .select('id, title, creator_id, approval_status')
      .eq('id', artworkId)
      .single()

    if (!artwork) {
      return NextResponse.json({ error: 'Artwork not found' }, { status: 404 })
    }

    if (artwork.approval_status === 'approved') {
      return NextResponse.json({ error: 'Artwork already approved' }, { status: 400 })
    }

    // Approve the artwork
    const { error: updateError } = await supabase
      .from('artworks')
      .update({
        approval_status: 'approved',
        is_available: true,
        is_featured: set_as_featured || false,
        approved_by: user.id,
        reviewed_at: new Date().toISOString(),
        review_notes: review_notes || null,
        revision_requested: false
      })
      .eq('id', artworkId)

    if (updateError) {
      console.error('Error approving artwork:', updateError)
      return NextResponse.json({ error: 'Failed to approve artwork' }, { status: 500 })
    }

    // Create notification for creator
    await supabase.rpc('create_notification', {
      p_user_id: artwork.creator_id,
      p_type: 'artwork_approved',
      p_title: '🎉 Artwork Approved!',
      p_message: `Your artwork "${artwork.title}" has been approved and is now live on the marketplace!`,
      p_link: `/art/${artworkId}`,
      p_artwork_id: artworkId,
      p_actor_id: user.id
    })

    // Instant cache revalidation - make approved artwork appear immediately
    revalidatePath('/art')
    revalidatePath(`/art/${artworkId}`)
    revalidatePath('/')
    revalidatePath('/dashboard/creator/artworks')
    revalidateTag('artworks')
    revalidateTag('featured-artworks')

    // TODO: Send email notification to creator
    // await sendEmail({
    //   to: creator.email,
    //   subject: 'Your artwork has been approved!',
    //   template: 'artwork-approved',
    //   data: { artworkTitle: artwork.title, artworkUrl: `/art/${artworkId}` }
    // })

    return NextResponse.json({
      success: true,
      message: 'Artwork approved successfully',
      artwork_id: artworkId
    })
  } catch (error) {
    console.error('Error in approve endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
