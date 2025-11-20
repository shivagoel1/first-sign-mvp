import { NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

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
      if (profile?.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const { assessmentResultId } = await params

    const { data: assessmentResult, error: assessmentResultError } = await supabase
      .from('assessment_results')
      .select('assessment_id')
      .eq('id', assessmentResultId)
      .maybeSingle()

    if (assessmentResultError || !assessmentResult?.assessment_id) {
      return NextResponse.json({ error: 'Assessment result not found.' }, { status: 404 })
    }

    const origin = request.nextUrl.origin
    const aiResponse = await fetch(`${origin}/api/ai/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assessmentId: assessmentResult.assessment_id,
        forceRegenerate: true,
      }),
    })

    if (!aiResponse.ok) {
      const payload = await aiResponse.json().catch(() => null)
      return NextResponse.json(
        { error: payload?.error ?? 'Failed to trigger AI processing.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[physician retry ai] unexpected error:', error)
    return NextResponse.json({ error: 'Unable to retry AI generation.' }, { status: 500 })
  }
}
