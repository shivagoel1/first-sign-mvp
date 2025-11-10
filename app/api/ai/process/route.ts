import { NextRequest, NextResponse } from 'next/server'

import {
  checkStorybookExisting,
  getVerifiedMilestones,
  callStorybookAgent,
  callValidationAgent,
  storeStorybook,
} from '@/lib/ai/storybook-helpers'
import { generateStorybookImages } from '@/lib/ai/image-generation'
import { generateStorybookPDF } from '@/lib/pdf/storybook-generator'
import { createClient } from '@/lib/supabase/server'

type ProcessRequestBody = {
  assessmentId?: string
  verifiedMilestones?: unknown
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ProcessRequestBody
    const assessmentId = body.assessmentId

    if (!assessmentId || typeof assessmentId !== 'string') {
      return NextResponse.json(
        { error: 'assessmentId is required.' },
        { status: 400 }
      )
    }

    const existing = await checkStorybookExisting(assessmentId)
    if (existing) {
      return NextResponse.json({
        assessmentId,
        storybook: existing,
        status: 'already_submitted',
      })
    }

    const seed = Array.isArray(body.verifiedMilestones)
      ? (body.verifiedMilestones as never[])
      : undefined

    const verified = await getVerifiedMilestones(assessmentId, seed)
    const draftStorybook = await callStorybookAgent(verified)
    const validatedStorybook = await callValidationAgent(draftStorybook, verified)

    const storybookArray = Array.isArray(validatedStorybook)
      ? validatedStorybook
      : []

    const imagePrompts = storybookArray.slice(0, 4).map((page, index) => ({
      milestone_code: page.milestone_code ?? `page-${index + 1}`,
      scene_description:
        page.illustration_prompts?.[0] ??
        page.story_scene_description ??
        page.display_text ??
        'Supportive family storybook illustration',
      page_number: page.page_number ?? index + 1,
    }))

    const generatedImages = await generateStorybookImages(imagePrompts, assessmentId)

    const storybookWithImages = storybookArray.map((page, index) => {
      const match = generatedImages.find(
        (image) =>
          image.page_number === (page.page_number ?? index + 1)
      )

      return {
        ...page,
        image_url: match?.image_url ?? page.image_url ?? null,
        page_number: page.page_number ?? index + 1,
      }
    })

    const supabase = await createClient()

    const { data: assessmentRow, error: assessmentError } = await supabase
      .from('assessments')
      .select('child_id')
      .eq('id', assessmentId)
      .maybeSingle()

    if (assessmentError || !assessmentRow) {
      throw new Error('Unable to load assessment details.')
    }

    const { data: childData, error: childError } = await supabase
      .from('children')
      .select('child_name, date_of_birth, gender')
      .eq('id', assessmentRow.child_id)
      .maybeSingle()

    if (childError || !childData) {
      throw new Error('Unable to load child profile.')
    }

    const age_months = Math.floor(
      (Date.now() - new Date(childData.date_of_birth).getTime()) /
        (1000 * 60 * 60 * 24 * 30)
    )

    const parentPdfUrl = await generateStorybookPDF(
      { pages: storybookWithImages },
      {
        first_name: childData.child_name,
        age_months,
        gender: childData.gender ?? 'Not specified',
      },
      assessmentId,
      'parent'
    )

    const physicianPdfUrl = await generateStorybookPDF(
      { pages: storybookWithImages },
      {
        first_name: childData.child_name,
        age_months,
        gender: childData.gender ?? 'Not specified',
      },
      assessmentId,
      'physician'
    )

    await supabase
      .from('assessment_results')
      .update({
        ai_report: JSON.stringify({
          pages: storybookWithImages,
          images: generatedImages,
        }),
        parent_pdf_url: parentPdfUrl,
        physician_pdf_url: physicianPdfUrl,
        status: 'awaiting_review',
      })
      .eq('assessment_id', assessmentId)

    return NextResponse.json({
      success: true,
      assessmentId,
      storybook: storybookWithImages,
      images: generatedImages,
      pdfs: {
        parent: parentPdfUrl,
        physician: physicianPdfUrl,
      },
      status: 'submitted',
    })
  } catch (error) {
    console.error('[api/ai/process] error:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Unable to process assessment.',
      },
      { status: 500 }
    )
  }
}

