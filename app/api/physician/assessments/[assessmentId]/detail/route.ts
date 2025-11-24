import { NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ assessmentId: string }> }
) {
  let assessmentId: string | undefined
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

    const resolvedParams = await params
    assessmentId = resolvedParams.assessmentId

    if (!assessmentId || typeof assessmentId !== 'string') {
      console.error('[physician assessment detail] Missing or invalid assessmentId parameter:', assessmentId)
      return NextResponse.json({ error: 'Assessment ID is required.' }, { status: 400 })
    }

    console.log('[physician assessment detail] Fetching assessment:', assessmentId)

    const admin = createAdminClient()

    const { data: assessmentResult, error: assessmentError } = await admin
      .from('assessment_results')
      .select(`
        id,
        assessment_id,
        status,
        parent_visible,
        ai_report,
        ai_processing_status,
        ai_processing_progress,
        ai_generation_cost,
        ai_tokens_used,
        ai_images_generated,
        red_flag_count,
        red_flags,
        physician_notes,
        reviewed_at,
        created_at,
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

    if (assessmentError) {
      console.error('[physician assessment detail] Database error:', assessmentError)
      return NextResponse.json(
        { error: 'Database error while fetching assessment.', details: assessmentError.message },
        { status: 500 }
      )
    }

    if (!assessmentResult) {
      console.warn('[physician assessment detail] Assessment not found:', assessmentId)
      // Check if assessment exists but has no result yet
      const { data: assessmentExists } = await admin
        .from('assessments')
        .select('id')
        .eq('id', assessmentId)
        .maybeSingle()
      
      if (assessmentExists) {
        console.log('[physician assessment detail] Assessment exists but no result yet')
        return NextResponse.json(
          { error: 'Assessment exists but results are not yet available.' },
          { status: 404 }
        )
      }
      
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
      console.error('[physician assessment detail] Error loading responses:', responsesError)
      return NextResponse.json(
        { 
          error: 'Unable to load assessment responses.',
          details: responsesError.message,
        },
        { status: 500 }
      )
    }

    const cost =
      assessmentResult.ai_generation_cost !== null &&
      assessmentResult.ai_generation_cost !== undefined
        ? Number(assessmentResult.ai_generation_cost)
        : null

    // Use reviewed_at if available, otherwise use created_at for cache-busting
    // Note: updated_at column doesn't exist in assessment_results table
    const updatedAt = assessmentResult.reviewed_at || assessmentResult.created_at

    return NextResponse.json({
      assessmentResultId: assessmentResult.id,
      assessmentId: assessmentResult.assessment_id,
      status: assessmentResult.status,
      parentVisible: assessmentResult.parent_visible,
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
      updatedAt: updatedAt ?? null,
      aiReport: (() => {
        // Validate articles in ai_report if present
        if (!assessmentResult.ai_report) return null
        
        try {
          const parsed = typeof assessmentResult.ai_report === 'string'
            ? JSON.parse(assessmentResult.ai_report)
            : assessmentResult.ai_report
          
          if (parsed && parsed.pages && Array.isArray(parsed.pages)) {
            // Validate articles asynchronously - return promise that will be awaited
            // For now, return the parsed report and validate on client side
            // (Server-side validation would require making this async, which is complex)
            return parsed
          }
          
          return parsed
        } catch {
          return assessmentResult.ai_report
        }
      })(),
      aiProcessingStatus: assessmentResult.ai_processing_status,
      aiProcessingProgress: assessmentResult.ai_processing_progress ?? 0,
      aiGenerationCost: cost,
      aiTokensUsed: assessmentResult.ai_tokens_used ?? 0,
      aiImagesGenerated: assessmentResult.ai_images_generated ?? 0,
      canViewCost: profile?.role === 'admin',
      redFlags: (assessmentResult.red_flags as string[] | null) ?? [],
      redFlagCount: assessmentResult.red_flag_count ?? 0,
      physicianNotes: assessmentResult.physician_notes ?? null,
      responses: (responses ?? []).map((response) => {
        try {
          return {
            id: response.id ?? '',
            milestoneId: response.milestone?.id ?? '',
            question: response.milestone?.question ?? 'Milestone question unavailable',
            category: response.milestone?.category ?? 'Uncategorized',
            response: response.response ?? '',
            notes: response.notes ?? null,
          }
        } catch (mapError) {
          console.error('[physician assessment detail] Error mapping response:', mapError, response)
          return {
            id: response.id ?? '',
            milestoneId: '',
            question: 'Error loading milestone question',
            category: 'Uncategorized',
            response: response.response ?? '',
            notes: response.notes ?? null,
          }
        }
      }),
    })
  } catch (error) {
    console.error('[physician assessment detail] unexpected error', error)
    console.error('[physician assessment detail] error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.error('[physician assessment detail] error details:', {
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : 'Unknown',
      assessmentId: assessmentId || 'unknown',
    })
    return NextResponse.json(
      { 
        error: 'Unable to load assessment details.',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}


