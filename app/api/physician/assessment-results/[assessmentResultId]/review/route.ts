import { NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

type ReviewAction = 'approve' | 'needs_revision' | 'rejected'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ assessmentResultId: string }> }
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

    const body = (await request.json()) as {
      action?: ReviewAction
      notes?: string
    }

    if (!body.action || !['approve', 'needs_revision', 'rejected'].includes(body.action)) {
      return NextResponse.json({ error: 'Invalid review action.' }, { status: 400 })
    }

    const now = new Date().toISOString()
    const admin = createAdminClient()
    const updates: Record<string, unknown> = {
      physician_notes: body.notes ?? null,
      physician_reviewed: true,
      reviewed_by: session.user.id,
      reviewed_at: now,
    }

    if (body.action === 'approve') {
      updates.status = 'approved'
      updates.parent_visible = true
    } else if (body.action === 'needs_revision') {
      updates.status = 'needs_revision'
      updates.parent_visible = false
    } else if (body.action === 'rejected') {
      updates.status = 'rejected'
      updates.parent_visible = false
    }

    const { assessmentResultId } = await params

    const { error: updateError } = await admin
      .from('assessment_results')
      .update(updates)
      .eq('id', assessmentResultId)

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message ?? 'Unable to update assessment.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[physician assessment review] unexpected error', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unable to update assessment.',
      },
      { status: 500 }
    )
  }
}


