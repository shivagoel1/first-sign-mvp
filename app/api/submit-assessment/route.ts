'use server'

import { NextRequest, NextResponse } from 'next/server'
import { differenceInMonths } from 'date-fns'

import { createAdminClient } from '@/lib/supabase/admin'

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

    // Insert child record
    console.log('[submit-assessment] inserting child', {
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

    const childId = childData.id
    console.log('[submit-assessment] inserted child id', childId)

    // Insert assessment record
    const assessmentInsertPayload = {
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

    const assessmentId = assessmentData.id
    console.log('[submit-assessment] inserted assessment id', assessmentId)

    const responseEntries = Object.entries(responses).map(
      ([milestoneId, { response, notes }]) => ({
        assessment_id: assessmentId,
        milestone_id: milestoneId,
        response,
        notes: notes ?? null,
      })
    )

    if (responseEntries.length > 0) {
      console.log('[submit-assessment] inserting assessment responses', responseEntries)
      const { error: responsesError } = await supabase
        .from('assessment_responses')
        .insert(responseEntries)

      if (responsesError) {
        console.error('[submit-assessment] responses insert failed:', responsesError)
        return NextResponse.json(
          { error: 'Unable to save assessment responses.' },
          { status: 500 }
        )
      }
    }

    // Fetch milestone details for scoring
    const milestoneIds = Object.keys(responses)
    const { data: milestonesData, error: milestonesError } = await supabase
      .from('milestones')
      .select('id, question, category')
      .in('id', milestoneIds)

    if (milestonesError) {
      console.error('[submit-assessment] milestone fetch failed:', milestonesError)
      return NextResponse.json(
        { error: 'Unable to calculate assessment results.' },
        { status: 500 }
      )
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
    const { data: assessmentResult, error: resultError } = await supabase
      .from('assessment_results')
      .insert({
        assessment_id: assessmentId,
        overall_score: overallScore,
        category_scores: categoryScores,
        red_flags: redFlags,
        red_flag_count: redFlagCount,
        ai_report: null,
        parent_visible: false,
        status: 'generating',
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

    const assessmentResultId = assessmentResult.id
    console.log('[submit-assessment] inserted assessment_result id', assessmentResultId)

    console.log('[submit-assessment] inserting physician referral', {
      assessment_result_id: assessmentResultId,
      parent_id: userId,
      physician_id: null,
      status: 'pending',
      review_status: 'pending',
    })
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

    // Fire-and-forget AI generation
    ;(async () => {
      try {
        const origin =
          process.env.NEXT_PUBLIC_APP_URL ??
          process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}`
            : request.nextUrl.origin
        await fetch(`${origin}/api/generate-storybook`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            assessmentResultId,
            childName,
            ageMonths: ageInMonths,
            disease,
            responses,
          }),
        })
      } catch (error) {
        console.error('[submit-assessment] generate-storybook trigger failed:', error)
      }
    })()

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

