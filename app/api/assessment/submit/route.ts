'use server'

import { NextRequest, NextResponse } from 'next/server'
import { differenceInMonths } from 'date-fns'

import { createAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/lib/database.types'

type AssessmentPayload = {
  userId?: string
  email?: string
  fullName?: string
  guestSessionId?: string
  childName?: string
  dateOfBirth?: string
  disease?: string
  responses?: Record<
    string,
    {
      response: string
      notes?: string
    }
  >
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as AssessmentPayload
    const {
      userId,
      email,
      fullName,
      guestSessionId,
      childName,
      dateOfBirth,
      disease,
      responses,
    } = body

    if (
      !userId ||
      !email ||
      !fullName ||
      !guestSessionId ||
      !childName ||
      !dateOfBirth ||
      !disease ||
      !responses ||
      Object.keys(responses).length === 0
    ) {
      return NextResponse.json(
        { error: 'Missing required fields.' },
        { status: 400 }
      )
    }

    const parsedDob = new Date(dateOfBirth)
    if (Number.isNaN(parsedDob.getTime())) {
      console.error('[submit-assessment] invalid dateOfBirth', { dateOfBirth })
      return NextResponse.json(
        { error: 'Invalid date of birth provided.' },
        { status: 400 }
      )
    }

    const now = new Date()
    const ageInMonths = differenceInMonths(now, parsedDob)
    console.log('[submit-assessment] calculated age in months', ageInMonths)
    console.log('[submit-assessment] guest session id', guestSessionId)

    const supabase = createAdminClient()

    const { data: existingAssessment, error: existingAssessmentError } = await supabase
      .from('assessments')
      .select('id, child_id')
      .eq('guest_session_id', guestSessionId)
      .order('created_at', { ascending: false })
      .maybeSingle()

    if (existingAssessmentError) {
      console.error('[submit-assessment] existing assessment lookup failed:', existingAssessmentError)
      return NextResponse.json(
        { error: 'Unable to look up existing assessment.' },
        { status: 500 }
      )
    }

    // Upsert profile
    console.log('[submit-assessment] upserting profile', {
      userId,
      email,
      fullName,
    })
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(
        {
          id: userId,
          email,
          full_name: fullName,
          role: 'parent',
        },
        { onConflict: 'id' }
      )

    if (profileError) {
      console.error('[submit-assessment] profile upsert failed:', profileError)
      return NextResponse.json(
        { error: 'Unable to save profile information.' },
        { status: 500 }
      )
    }

    let childId = existingAssessment?.child_id ?? null

    if (!childId) {
      console.log('[submit-assessment] creating child record', {
        parent_id: userId,
        child_name: childName,
        date_of_birth: dateOfBirth,
      })
      const { data: childData, error: childError } = await supabase
        .from('children')
        .insert({
          parent_id: userId,
          child_name: childName,
          date_of_birth: dateOfBirth,
        })
        .select('id')
        .single()

      if (childError || !childData) {
        console.error('[submit-assessment] child insert failed:', childError)
        return NextResponse.json(
          { error: 'Unable to save child information.' },
          { status: 500 }
        )
      }

      childId = childData.id
    } else {
      await supabase
        .from('children')
        .update({ parent_id: userId })
        .eq('id', childId)
    }

    if (!childId) {
      return NextResponse.json(
        { error: 'Unable to associate child record.' },
        { status: 500 }
      )
    }

    let assessmentId: string

    if (existingAssessment?.id) {
      assessmentId = existingAssessment.id
      console.log('[submit-assessment] updating existing assessment', assessmentId)
      const { error: updateAssessmentError } = await supabase
        .from('assessments')
        .update({
          parent_id: userId,
          child_id: childId,
          guest_session_id: null,
          age_at_assessment_months: ageInMonths,
          status: 'completed',
          completed_at: now.toISOString(),
          consent_given: true,
          consent_timestamp: now.toISOString(),
        })
        .eq('id', assessmentId)

      if (updateAssessmentError) {
        console.error('[submit-assessment] assessment update failed:', updateAssessmentError)
        return NextResponse.json(
          { error: 'Unable to update assessment.' },
          { status: 500 }
        )
      }

      await supabase
        .from('assessment_responses')
        .delete()
        .eq('assessment_id', assessmentId)
    } else {
      const assessmentInsertPayload: Database['public']['Tables']['assessments']['Insert'] = {
        child_id: childId,
        parent_id: userId,
        guest_session_id: null,
        age_at_assessment_months: ageInMonths,
        status: 'completed',
        completed_at: now.toISOString(),
        consent_given: true,
        consent_timestamp: now.toISOString(),
      }
      console.log('[submit-assessment] inserting assessment', assessmentInsertPayload)
      const { data: assessmentData, error: assessmentError } = await supabase
        .from('assessments')
        .insert(assessmentInsertPayload)
        .select('id')
        .single()

      if (assessmentError || !assessmentData) {
        console.error('[submit-assessment] assessment insert failed:', assessmentError)
        return NextResponse.json(
          { error: 'Unable to save assessment.' },
          { status: 500 }
        )
      }

      assessmentId = assessmentData.id
    }

    // Validate milestone IDs exist before inserting responses
    const milestoneIds = Object.keys(responses)
    const { data: milestonesData, error: milestonesError } = await supabase
      .from('milestones')
      .select('id, question, category')
      .in('id', milestoneIds)

    if (milestonesError) {
      console.error('[submit-assessment] milestone fetch failed:', milestonesError)
      return NextResponse.json(
        { error: 'Unable to validate milestone IDs.' },
        { status: 500 }
      )
    }

    // Check if all milestone IDs are valid
    const validMilestoneIds = new Set(milestonesData?.map(m => m.id) ?? [])
    const invalidMilestoneIds = milestoneIds.filter(id => !validMilestoneIds.has(id))
    
    if (invalidMilestoneIds.length > 0) {
      console.error('[submit-assessment] invalid milestone IDs:', invalidMilestoneIds)
      return NextResponse.json(
        { error: `Invalid milestone IDs found: ${invalidMilestoneIds.join(', ')}` },
        { status: 400 }
      )
    }

    // Normalize response values to match database constraint
    const normalizeResponse = (value: string): 'yes' | 'no' | 'sometimes' | 'not_sure' => {
      const lower = value.toLowerCase()
      if (lower === 'no' || lower.includes('not yet') || lower.includes('cannot')) {
        return 'no'
      }
      if (lower === 'sometimes') {
        return 'sometimes'
      }
      if (lower === 'not_sure' || lower === 'not sure') {
        return 'not_sure'
      }
      // Default to 'yes' for any positive response
      return 'yes'
    }

    // Only create entries for valid milestone IDs
    const responseEntries: Database['public']['Tables']['assessment_responses']['Insert'][] = Object.entries(responses)
      .filter(([milestoneId]) => validMilestoneIds.has(milestoneId))
      .map(([milestoneId, { response, notes }]) => ({
        assessment_id: assessmentId,
        milestone_id: milestoneId,
        response: normalizeResponse(response),
        notes: notes ?? null,
      }))

    if (responseEntries.length > 0) {
      console.log('[submit-assessment] inserting assessment responses', responseEntries)
      const { error: responsesError } = await supabase
        .from('assessment_responses')
        .insert(responseEntries)

      if (responsesError) {
        console.error('[submit-assessment] responses insert failed:', responsesError)
        console.error('[submit-assessment] response entries that failed:', responseEntries)
        return NextResponse.json(
          { 
            error: 'Unable to save assessment responses.',
            details: responsesError.message 
          },
          { status: 500 }
        )
      }
    }

    const redFlags: string[] = []
    const categoryTotals: Record<string, { yes: number; total: number }> = {}
    let yesCount = 0
    let totalCount = 0

    milestonesData?.forEach((milestone) => {
      const answer = responses[milestone.id]
      if (!answer) return

      totalCount += 1
      const category = milestone.category ?? 'Uncategorized'
      if (!categoryTotals[category]) {
        categoryTotals[category] = { yes: 0, total: 0 }
      }
      categoryTotals[category].total += 1

      if (answer.response === 'yes') {
        yesCount += 1
        categoryTotals[category].yes += 1
      }
      if (answer.response === 'no') {
        redFlags.push(milestone.question ?? '')
      }
    })

    const overallScore =
      totalCount > 0 ? Math.round((yesCount / totalCount) * 100) : null
    const redFlagCount = redFlags.length

    const categoryScores = Object.entries(categoryTotals).reduce<
      Record<string, number>
    >((acc, [category, { yes, total }]) => {
      acc[category] = total > 0 ? Math.round((yes / total) * 100) : 0
      return acc
    }, {})

    console.log('[submit-assessment] inserting assessment result', {
      assessment_id: assessmentId,
      overall_score: overallScore,
      category_scores: categoryScores,
      red_flags: redFlags,
      red_flag_count: redFlagCount,
    })
    const { data: existingResult, error: existingResultError } = await supabase
      .from('assessment_results')
      .select('id')
      .eq('assessment_id', assessmentId)
      .maybeSingle()

    if (existingResultError) {
      console.error('[submit-assessment] assessment_results lookup failed:', existingResultError)
      return NextResponse.json(
        { error: 'Unable to finalize assessment.' },
        { status: 500 }
      )
    }

    let assessmentResultId: string

    const resultPayload: Omit<
      Database['public']['Tables']['assessment_results']['Insert'],
      'assessment_id'
    > = {
      overall_score: overallScore,
      category_scores: categoryScores,
      red_flags: redFlags,
      red_flag_count: redFlagCount,
      ai_report: null,
      parent_visible: false,
      status: 'awaiting_review',
    }

    if (existingResult?.id) {
      const { error: updateResultError } = await supabase
        .from('assessment_results')
        .update(resultPayload)
        .eq('id', existingResult.id)

      if (updateResultError) {
        console.error('[submit-assessment] assessment_results update failed:', updateResultError)
        return NextResponse.json(
          { error: 'Unable to finalize assessment.' },
          { status: 500 }
        )
      }
      assessmentResultId = existingResult.id
    } else {
      const { data: assessmentResult, error: resultError } = await supabase
        .from('assessment_results')
        .insert({
          assessment_id: assessmentId,
          ...resultPayload,
        })
        .select('id')
        .single()

      if (resultError || !assessmentResult) {
        console.error('[submit-assessment] assessment_results insert failed:', resultError)
        return NextResponse.json(
          { error: 'Unable to finalize assessment.' },
          { status: 500 }
        )
      }
      assessmentResultId = assessmentResult.id
    }

    const { data: existingReferral, error: referralLookupError } = await supabase
      .from('physician_referrals')
      .select('id')
      .eq('assessment_result_id', assessmentResultId)
      .maybeSingle()

    if (referralLookupError) {
      console.error('[submit-assessment] referral lookup failed:', referralLookupError)
      return NextResponse.json(
        { error: 'Unable to create physician referral.' },
        { status: 500 }
      )
    }

    if (existingReferral?.id) {
      const { error: updateReferralError } = await supabase
        .from('physician_referrals')
        .update({ parent_id: userId })
        .eq('id', existingReferral.id)

      if (updateReferralError) {
        console.error('[submit-assessment] referral update failed:', updateReferralError)
        return NextResponse.json(
          { error: 'Unable to update physician referral.' },
          { status: 500 }
        )
      }
    } else {
      const { error: referralError } = await supabase
        .from('physician_referrals')
        .insert({
          assessment_result_id: assessmentResultId,
          parent_id: userId,
          physician_id: null,
          status: 'pending',
          review_status: 'pending',
        })

      if (referralError) {
        console.error('[submit-assessment] physician referral insert failed:', referralError)
        return NextResponse.json(
          { error: 'Unable to create physician referral.' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({ success: true, assessmentId })
  } catch (error) {
    console.error('[submit-assessment] unhandled error:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Unable to submit assessment.',
      },
      { status: 500 }
    )
  }
}

