import { NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { referralId: string } }
) {
  try {
    const supabase = await createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .maybeSingle()

    if (profile?.role !== 'physician') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { action } = (await request.json()) as { action?: string }

    if (!action || !['accept', 'complete', 'decline'].includes(action)) {
      return NextResponse.json({ error: 'Invalid referral action.' }, { status: 400 })
    }

    const updates: Record<string, unknown> = {}

    if (action === 'accept') {
      updates.status = 'accepted'
      updates.review_status = 'in_review'
      updates.approved_at = new Date().toISOString()
    } else if (action === 'complete') {
      updates.status = 'completed'
      updates.review_status = 'completed'
    } else if (action === 'decline') {
      updates.status = 'declined'
      updates.review_status = 'declined'
    }

    const { data, error } = await supabase
      .from('physician_referrals')
      .update(updates)
      .eq('id', params.referralId)
      .select('status, review_status')
      .maybeSingle()

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message ?? 'Unable to update referral.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      status: data.status,
      reviewStatus: data.review_status,
    })
  } catch (error) {
    console.error('[physician referral update] unexpected error', error)
    return NextResponse.json({ error: 'Unable to update referral.' }, { status: 500 })
  }
}


