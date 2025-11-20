import { NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ assessmentId: string }> }
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

    if (profile?.role !== 'physician' && profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { assessmentId } = await params

    const admin = createAdminClient()

    const { data: assessmentResult, error: assessmentError } = await admin
      .from('assessment_results')
      .select(`
        id,
        assessment_id,
        ai_report,
        ai_processing_status,
        ai_processing_progress,
        ai_generation_cost,
        ai_tokens_used,
        ai_images_generated,
        red_flag_count,
        red_flags,
        physician_notes,
        assessments (
          completed_at,
          parent_id,
          child:children!assessments_child_id_fkey (
            child_name,
            date_of_birth
          ),
          parent_profile:profiles!assessments_parent_id_fkey (
            full_name,
            email
          )
        )
      `)
      .eq('assessment_id', assessmentId)
      .maybeSingle()

    if (assessmentError || !assessmentResult) {
      return NextResponse.json({ error: 'Assessment not found.' }, { status: 404 })
    }

    const { data: responses, error: responsesError } = await admin
      .from('assessment_responses')
      .select(`
        id,
        response,
        notes,
        milestone:milestones (
          id,
          question,
          category
        )
      `)
      .eq('assessment_id', assessmentId)
      .order('created_at', { ascending: true })

    if (responsesError) {
      return NextResponse.json(
        { error: 'Unable to load assessment responses.' },
        { status: 500 }
      )
    }

    const cost =
      assessmentResult.ai_generation_cost !== null &&
      assessmentResult.ai_generation_cost !== undefined
        ? Number(assessmentResult.ai_generation_cost)
        : null

    return NextResponse.json({
      assessmentResultId: assessmentResult.id,
      assessmentId: assessmentResult.assessment_id,
      childName: assessmentResult.assessments?.child?.child_name ?? 'Child',
      parentName: assessmentResult.assessments?.parent_profile?.full_name ?? null,
      parentEmail: assessmentResult.assessments?.parent_profile?.email ?? null,
      childAgeMonths: (() => {
        const dob = assessmentResult.assessments?.child?.date_of_birth
        if (!dob) return null
        const birthDate = new Date(dob)
        if (Number.isNaN(birthDate.getTime())) return null
        const now = new Date()
        let months =
          (now.getFullYear() - birthDate.getFullYear()) * 12 +
          (now.getMonth() - birthDate.getMonth())
        if (now.getDate() < birthDate.getDate()) {
          months -= 1
        }
        return Math.max(months, 0)
      })(),
      completedAt: assessmentResult.assessments?.completed_at ?? null,
      aiReport: assessmentResult.ai_report,
      aiProcessingStatus: assessmentResult.ai_processing_status,
      aiProcessingProgress: assessmentResult.ai_processing_progress ?? 0,
      aiGenerationCost: cost,
      aiTokensUsed: assessmentResult.ai_tokens_used ?? 0,
      aiImagesGenerated: assessmentResult.ai_images_generated ?? 0,
      canViewCost: profile?.role === 'admin',
      redFlags: (assessmentResult.red_flags as string[] | null) ?? [],
      redFlagCount: assessmentResult.red_flag_count ?? 0,
      physicianNotes: assessmentResult.physician_notes ?? null,
      responses: (responses ?? []).map((response) => ({
        id: response.id,
        milestoneId: response.milestone?.id ?? '',
        question: response.milestone?.question ?? 'Milestone question unavailable',
        category: response.milestone?.category ?? 'Uncategorized',
        response: response.response,
        notes: response.notes ?? null,
      })),
    })
  } catch (error) {
    console.error('[physician assessment detail] unexpected error', error)
    return NextResponse.json(
      { error: 'Unable to load assessment details.' },
      { status: 500 }
    )
  }
}


