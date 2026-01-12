import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient()
    const { id } = await params
    const artworkId = id

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
    const { revision_notes } = body

    if (!revision_notes || revision_notes.trim() === '') {
      return NextResponse.json(
        { error: 'Revision notes are required' },
        { status: 400 }
      )
    }

    // Get artwork details for notification
    const { data: artwork } = await supabase
      .from('artworks')
      .select('id, title, creator_id')
      .eq('id', artworkId)
      .single()

    if (!artwork) {
      return NextResponse.json({ error: 'Artwork not found' }, { status: 404 })
    }

    // Request revision
    const { error: updateError } = await supabase
      .from('artworks')
      .update({
        revision_requested: true,
        revision_notes: revision_notes,
        approved_by: user.id,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', artworkId)

    if (updateError) {
      console.error('Error requesting revision:', updateError)
      return NextResponse.json({ error: 'Failed to request revision' }, { status: 500 })
    }

    // Create notification for creator
    await supabase.rpc('create_notification', {
      p_user_id: artwork.creator_id,
      p_type: 'revision_requested',
      p_title: '✏️ Revision Requested',
      p_message: `Please make some changes to your artwork "${artwork.title}" and resubmit for review.`,
      p_link: `/dashboard/creator/artworks`,
      p_artwork_id: artworkId,
      p_actor_id: user.id
    })

    // Revalidate cache
    revalidatePath('/dashboard/creator/artworks')

    // TODO: Send email notification to creator
    // await sendEmail({
    //   to: creator.email,
    //   subject: 'Revision Requested for Your Artwork',
    //   template: 'revision-requested',
    //   data: { artworkTitle: artwork.title, revisionNotes: revision_notes }
    // })

    return NextResponse.json({
      success: true,
      message: 'Revision requested',
      artwork_id: artworkId
    })
  } catch (error) {
    console.error('Error in request-revision endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
