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
    const { review_notes } = body

    if (!review_notes || review_notes.trim() === '') {
      return NextResponse.json(
        { error: 'Review notes are required for rejection' },
        { status: 400 }
      )
    }

    // Get artwork details for notification
    const { data: artwork } = await supabase
      .from('artworks')
      .select('id, title, creator_id, approval_status')
      .eq('id', artworkId)
      .single()

    if (!artwork) {
      return NextResponse.json({ error: 'Artwork not found' }, { status: 404 })
    }

    // Reject the artwork
    const { error: updateError } = await supabase
      .from('artworks')
      .update({
        approval_status: 'rejected',
        is_available: false,
        is_featured: false,
        approved_by: user.id,
        reviewed_at: new Date().toISOString(),
        review_notes: review_notes,
        revision_requested: false
      })
      .eq('id', artworkId)

    if (updateError) {
      console.error('Error rejecting artwork:', updateError)
      return NextResponse.json({ error: 'Failed to reject artwork' }, { status: 500 })
    }

    // Create notification for creator
    await supabase.rpc('create_notification', {
      p_user_id: artwork.creator_id,
      p_type: 'artwork_rejected',
      p_title: 'Artwork Not Approved',
      p_message: `Your artwork "${artwork.title}" was not approved. Please review the feedback and consider resubmitting.`,
      p_link: `/dashboard/creator/artworks`,
      p_artwork_id: artworkId,
      p_actor_id: user.id
    })

    // Revalidate cache
    revalidatePath('/dashboard/creator/artworks')
    revalidateTag('artworks')

    // TODO: Send email notification to creator with feedback
    // await sendEmail({
    //   to: creator.email,
    //   subject: 'Artwork Review Feedback',
    //   template: 'artwork-rejected',
    //   data: { artworkTitle: artwork.title, feedback: review_notes }
    // })

    return NextResponse.json({
      success: true,
      message: 'Artwork rejected',
      artwork_id: artworkId
    })
  } catch (error) {
    console.error('Error in reject endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
