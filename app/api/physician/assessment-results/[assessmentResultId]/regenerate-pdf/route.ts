import { NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { generateStorybookPDF } from '@/lib/pdf/storybook-generator'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ assessmentResultId: string }> }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify role = physician
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile || profile.role !== 'physician') {
    return NextResponse.json(
      { error: 'Access denied. This endpoint is for physicians only.' },
      { status: 403 }
    )
  }

  const { assessmentResultId } = await params
  const service = createServiceClient()

  // Get assessment_id and ai_report
  const { data: resultRow, error: resultError } = await service
    .from('assessment_results')
    .select('assessment_id, ai_report')
    .eq('id', assessmentResultId)
    .maybeSingle()

  if (resultError || !resultRow) {
    return NextResponse.json(
      { error: 'Assessment result not found.' },
      { status: 404 }
    )
  }

  const assessmentId = resultRow.assessment_id as string
  let pages: any[] = []
  try {
    const parsed = typeof resultRow.ai_report === 'string'
      ? JSON.parse(resultRow.ai_report)
      : resultRow.ai_report
    pages = Array.isArray(parsed?.pages) ? parsed.pages : []
  } catch {
    // ignore; pages stays empty
  }

  // Fetch child details
  const { data: assessmentRow, error: assessErr } = await service
    .from('assessments')
    .select('child_id')
    .eq('id', assessmentId)
    .maybeSingle()
  if (assessErr || !assessmentRow) {
    return NextResponse.json(
      { error: 'Unable to load assessment details.' },
      { status: 400 }
    )
  }

  const { data: childData, error: childErr } = await service
    .from('children')
    .select('child_name, date_of_birth, gender')
    .eq('id', assessmentRow.child_id)
    .maybeSingle()
  if (childErr || !childData) {
    return NextResponse.json(
      { error: 'Unable to load child profile.' },
      { status: 400 }
    )
  }

  const age_months = Math.floor(
    (Date.now() - new Date(childData.date_of_birth).getTime()) /
      (1000 * 60 * 60 * 24 * 30)
  )

  // Regenerate PDFs from existing pages
  const storybook = { pages }
  const parentPdfUrl = await generateStorybookPDF(
    storybook as any,
    {
      first_name: childData.child_name,
      age_months,
      gender: childData.gender ?? 'Not specified',
    },
    assessmentId,
    'parent'
  )

  const physicianPdfUrl = await generateStorybookPDF(
    storybook as any,
    {
      first_name: childData.child_name,
      age_months,
      gender: childData.gender ?? 'Not specified',
    },
    assessmentId,
    'physician'
  )

  await service
    .from('assessment_results')
    .update({
      parent_pdf_url: parentPdfUrl,
      physician_pdf_url: physicianPdfUrl,
    } as any)
    .eq('id', assessmentResultId)

  return NextResponse.json({
    success: true,
    parentPdfUrl,
    physicianPdfUrl,
  })
}


