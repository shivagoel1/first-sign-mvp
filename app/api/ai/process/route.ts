import { NextRequest, NextResponse } from 'next/server'

import {
  checkStorybookExisting,
  getVerifiedMilestones,
  callStorybookAgent,
  callValidationAgent,
} from '@/lib/ai/storybook-helpers'
import { generateStorybookImages } from '@/lib/ai/image-generation'
import { generateStorybookPDF } from '@/lib/pdf/storybook-generator'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import type { ChatCompletion } from 'openai/resources/chat/completions'
import { combinePages } from '@/lib/ai/combine-pages'
import { callPolishCombinedPage, callSelectorAgent } from '@/lib/ai/agents'

type ProcessRequestBody = {
  assessmentId?: string
  verifiedMilestones?: unknown
  forceRegenerate?: boolean
}

const AI_PROCESSING_TIMEOUT_MS =
  Number(process.env.AI_PROCESSING_TIMEOUT_MS) > 0
    ? Number(process.env.AI_PROCESSING_TIMEOUT_MS)
    : 300_000 // default 5 minutes

async function updateProgress(
  supabase: Awaited<ReturnType<typeof createClient>>,
  assessmentId: string,
  progress: number
) {
  const { error } = await supabase
    .from('assessment_results')
    .update({ ai_processing_progress: progress })
    .eq('assessment_id', assessmentId)
  if (error) {
    console.error('[AI Process] Failed to update progress:', error)
  }
}

function calculateOpenAICost(completion: ChatCompletion | null): number {
  if (!completion) return 0
  const inputTokens = completion.usage?.prompt_tokens ?? 0
  const outputTokens = completion.usage?.completion_tokens ?? 0
  return (inputTokens * 0.150) / 1_000_000 + (outputTokens * 0.600) / 1_000_000
}

async function processAssessment(
  assessmentId: string,
  supabase: Awaited<ReturnType<typeof createClient>>,
  seed?: never[],
  forceRegenerate?: boolean
) {
  // cost and tokens are computed after generation/validation steps

  const existing = await checkStorybookExisting(assessmentId)
  console.log('[AI Process] Existing storybook?', Boolean(existing))

  if (existing && !forceRegenerate) {
    console.log('[AI Process] Existing report found, skipping generation.')
    return {
      success: true,
      assessmentId,
      storybook: existing,
      images: [],
      pdfs: {
        parent: undefined,
        physician: undefined,
      },
      status: 'already_submitted',
      skipUpdate: true,
      aiGenerationCost: 0,
      aiTokensUsed: 0,
      aiImagesGenerated: 0,
    }
  }

  const verified = await getVerifiedMilestones(assessmentId, seed)
  console.log('[AI Process] Verified milestones:', verified.length)
  await updateProgress(supabase, assessmentId, 20)

  // Optional: Selector Agent to reduce the set before combining
  let filteredVerified = verified
  if (process.env.USE_SELECTOR_AGENT === 'true') {
    const selected = await callSelectorAgent(verified as any)
    if (selected.size) {
      filteredVerified = verified.filter((v: any) =>
        selected.has(v.milestone_code)
      )
      console.log(
        '[AI Process] Selector agent reduced items:',
        filteredVerified.length,
        '/',
        verified.length
      )
    }
  }

  const storybookResult = await callStorybookAgent(verified)
  const draftStorybook = storybookResult.storybook
  console.log('[AI Process] Storybook agent complete')
  await updateProgress(supabase, assessmentId, 40)

  const storybookCost = calculateOpenAICost(storybookResult.completion)
  const storybookTokens =
    (storybookResult.completion.usage?.prompt_tokens ?? 0) +
    (storybookResult.completion.usage?.completion_tokens ?? 0)

  let validationResult: Awaited<ReturnType<typeof callValidationAgent>> | null = null
  let validationCost = 0
  let validationTokens = 0
  let validatedStorybook = draftStorybook

  if (process.env.SKIP_AI_VALIDATION === 'true') {
    console.log('[AI Process] Validation skipped (SKIP_AI_VALIDATION=true)')
  } else {
    validationResult = await callValidationAgent(draftStorybook, verified)
    console.log('[AI Process] Validation agent complete')
    validationCost = calculateOpenAICost(validationResult.completion)
    validationTokens =
      (validationResult.completion.usage?.prompt_tokens ?? 0) +
      (validationResult.completion.usage?.completion_tokens ?? 0)
    validatedStorybook = validationResult.storybook
  }

  await updateProgress(supabase, assessmentId, 50)

  const rawPages = Array.isArray(validatedStorybook?.pages)
    ? validatedStorybook.pages
    : []

  // Combine multiple small milestones into compact pages
  // If selector ran, prefer that filtered set when combining by filtering rawPages
  const selectedCodes =
    process.env.USE_SELECTOR_AGENT === 'true'
      ? new Set((filteredVerified as any[]).map((v) => v.milestone_code))
      : null
  const pagesForCombine =
    selectedCodes && selectedCodes.size
      ? (rawPages as any[]).filter((p) =>
          p?.milestone_code ? selectedCodes.has(p.milestone_code) : true
        )
      : (rawPages as any[])

  let combinedPages = combinePages(
    pagesForCombine as any,
    undefined,
    (filteredVerified as any) ?? (verified as any)
  )

  // Optional: Polish agent to refine caption/prompt per page
  if (process.env.USE_POLISH_AGENT === 'true') {
    const results = await Promise.allSettled(
      combinedPages.map((p) => callPolishCombinedPage(p as any))
    )
    combinedPages = combinedPages.map((p, i) => {
      const r = results[i]
      if (r.status === 'fulfilled' && r.value) {
        const next = { ...p }
        if (r.value.caption) next.narrative_text = r.value.caption
        if (r.value.illustration_prompt) {
          next.illustration_prompts = [r.value.illustration_prompt]
        }
        return next
      }
      return p
    })
  }

  const imagePrompts = combinedPages.map((page: any, index: number) => ({
    milestone_code: page.milestone_code ?? `page-${index + 1}`,
    scene_description:
      page.illustration_prompts?.[0] ??
      page.display_text ??
      'Supportive family combined illustration',
    page_number: page.page_number ?? index + 1,
  }))

  const generatedImages = await generateStorybookImages(imagePrompts, assessmentId)
  console.log('[AI Process] Images generated:', generatedImages.length)
  await updateProgress(supabase, assessmentId, 75)

  const successfulImages = generatedImages.filter((image) =>
    image.image_url && !image.image_url.includes('placeholder')
  )
  const imageCost = successfulImages.length * 0.04
  const totalTokensUsed = storybookTokens + validationTokens
  const totalCost = storybookCost + validationCost + imageCost
  const roundedCost = Number(totalCost.toFixed(4))

  const storybookWithImages = combinedPages.map((page: any, index: number) => {
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

  console.log('[AI Process] Child details loaded:', {
    child: childData.child_name,
    age_months,
  })

  console.log('[AI Process] Starting PDF generation')
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

  if (!parentPdfUrl) {
    console.error('[AI Process] Parent PDF generation failed!')
  }

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

  if (!physicianPdfUrl) {
    console.error('[AI Process] Physician PDF generation failed!')
  }

  console.log('[AI Process] PDF generation complete:', {
    parentPdfUrl: parentPdfUrl || 'FAILED',
    physicianPdfUrl: physicianPdfUrl || 'FAILED',
  })
  await updateProgress(supabase, assessmentId, 90)

  return {
    success: true,
    assessmentId,
    storybook: { pages: storybookWithImages },
    images: generatedImages,
    pdfs: {
      parent: parentPdfUrl,
      physician: physicianPdfUrl,
    },
    status: 'submitted',
    skipUpdate: false,
    childData,
    age_months,
    aiGenerationCost: roundedCost,
    aiTokensUsed: totalTokensUsed,
    aiImagesGenerated: successfulImages.length,
  }
}

export async function POST(request: NextRequest) {
  const startedAt = Date.now()

  // Use service-role to bypass RLS for backend processing
  let supabase: Awaited<ReturnType<typeof createClient>>
  try {
    supabase = createServiceClient() as unknown as Awaited<
      ReturnType<typeof createClient>
    >
  } catch {
    supabase = await createClient()
  }
  let assessmentId: string | undefined

  try {
    const body = (await request.json()) as ProcessRequestBody
    assessmentId = body.assessmentId
    const force = Boolean(body.forceRegenerate)

    console.log('[AI Process] Starting processing for assessment:', assessmentId)

    if (!assessmentId || typeof assessmentId !== 'string') {
      return NextResponse.json(
        { error: 'assessmentId is required.' },
        { status: 400 }
      )
    }

    const { error: setProcessingError } = await supabase
      .from('assessment_results')
      .update({ ai_processing_status: 'processing', ai_processing_progress: 0 } as any)
      .eq('assessment_id', assessmentId)
    if (setProcessingError) {
      console.error('[AI Process] Failed to set processing status:', setProcessingError)
    }

    const seed = Array.isArray(body.verifiedMilestones)
      ? (body.verifiedMilestones as never[])
      : undefined

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error('AI report generation timed out after 3 minutes')),
        AI_PROCESSING_TIMEOUT_MS
      )
    )

    const result = (await Promise.race([
      processAssessment(assessmentId, supabase, seed, force),
      timeoutPromise,
    ])) as Awaited<ReturnType<typeof processAssessment>>

    if (result.skipUpdate) {
      const elapsedMs = Date.now() - startedAt
      console.log('[AI Process] Completed in ms:', elapsedMs)
      return NextResponse.json(result)
    }

    // Only update PDF URLs if they were successfully generated
    const updateData: any = {
      ai_report: JSON.stringify({ pages: (result.storybook as any).pages }),
      status: 'awaiting_review',
      ai_processing_status: 'completed',
      ai_processing_progress: 100,
      ai_generation_cost: result.aiGenerationCost,
      ai_tokens_used: result.aiTokensUsed,
      ai_images_generated: result.aiImagesGenerated,
    }

    // Only set PDF URLs if they exist (don't overwrite with null)
    if (result.pdfs.parent) {
      updateData.parent_pdf_url = result.pdfs.parent
      console.log('[AI Process] Setting parent_pdf_url:', result.pdfs.parent)
    } else {
      console.warn('[AI Process] Parent PDF not generated, keeping existing URL or null')
    }

    if (result.pdfs.physician) {
      updateData.physician_pdf_url = result.pdfs.physician
      console.log('[AI Process] Setting physician_pdf_url:', result.pdfs.physician)
    } else {
      console.warn('[AI Process] Physician PDF not generated, keeping existing URL or null')
    }

    const { error: updateError } = await supabase
      .from('assessment_results')
      .update(updateData)
      .eq('assessment_id', assessmentId)

    if (updateError) {
      console.error('[AI Process] Database update error:', updateError)
      throw updateError
    }

    console.log('[AI Process] Database updated successfully')

    const elapsedMs = Date.now() - startedAt
    console.log('[AI Process] Completed in ms:', elapsedMs)

    return NextResponse.json(result)
  } catch (error) {
    const elapsedMs = Date.now() - startedAt
    console.error('[AI Process] Error (elapsed ms:', elapsedMs, '):', error)
    if (error instanceof Error) {
      console.error(error.stack)
    }

    if (assessmentId) {
      const { error: setFailedError } = await supabase
        .from('assessment_results')
        .update({ ai_processing_status: 'failed' } as any)
        .eq('assessment_id', assessmentId)
      if (setFailedError) {
        console.error('[AI Process] Failed to update error status:', setFailedError)
      }
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Unable to process assessment.',
      },
      { status: 500 }
    )
  }
}

