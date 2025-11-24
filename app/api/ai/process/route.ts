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
  console.log(`[AI Process] Updating progress to ${progress}% for assessment ${assessmentId}`)
  const { error, data } = await supabase
    .from('assessment_results')
    .update({ ai_processing_progress: progress })
    .eq('assessment_id', assessmentId)
    .select()
  if (error) {
    console.error('[AI Process] Failed to update progress:', error)
  } else {
    console.log(`[AI Process] Successfully updated progress to ${progress}% (rows affected: ${data?.length ?? 0})`)
    // Longer delay to ensure database write is committed and visible to frontend polling
    // This helps the frontend polling catch intermediate progress values
    await new Promise(resolve => setTimeout(resolve, 200))
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

  // Clean up old data if forcing regeneration
  if (forceRegenerate && existing) {
    console.log('[AI Process] Force regeneration requested. Cleaning up old data...')
    
    try {
      // Get service client for cleanup operations
      const serviceSupabase = createServiceClient() as unknown as Awaited<ReturnType<typeof createClient>>
      
      // Clean up old PDFs from storage
      const { data: assessmentResult } = await supabase
        .from('assessment_results')
        .select('parent_pdf_url, physician_pdf_url')
        .eq('assessment_id', assessmentId)
        .maybeSingle()
      
      if (assessmentResult) {
        const pdfsToDelete: string[] = []
        if (assessmentResult.parent_pdf_url) {
          // Extract path from URL (format: /storage/v1/object/public/storybook-pdfs/path/to/file.pdf)
          const parentPath = assessmentResult.parent_pdf_url.split('/storybook-pdfs/')[1]
          if (parentPath) pdfsToDelete.push(parentPath)
        }
        if (assessmentResult.physician_pdf_url) {
          const physicianPath = assessmentResult.physician_pdf_url.split('/storybook-pdfs/')[1]
          if (physicianPath) pdfsToDelete.push(physicianPath)
        }
        
        if (pdfsToDelete.length > 0) {
          const { error: deleteError } = await serviceSupabase.storage
            .from('storybook-pdfs')
            .remove(pdfsToDelete)
          
          if (deleteError) {
            console.warn('[AI Process] Error deleting old PDFs:', deleteError)
          } else {
            console.log(`[AI Process] Cleaned up ${pdfsToDelete.length} old PDF(s)`)
          }
        }
      }
      
      // Clear PDF URLs in database
      await supabase
        .from('assessment_results')
        .update({
          parent_pdf_url: null,
          physician_pdf_url: null,
          ai_report: null,
        })
        .eq('assessment_id', assessmentId)
      
      console.log('[AI Process] Cleaned up old PDF URLs and AI report from database')
    } catch (cleanupError) {
      console.error('[AI Process] Error during cleanup:', cleanupError)
      // Continue with regeneration even if cleanup fails
    }
  }

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

  // Update progress immediately when starting
  await updateProgress(supabase, assessmentId, 5)
  console.log('[AI Process] Progress updated to 5% - starting milestone verification')

  const verified = await getVerifiedMilestones(assessmentId, seed)
  console.log('[AI Process] Verified milestones:', verified.length)
  if (verified.length === 0) {
    throw new Error('No verified milestones found for this assessment. Cannot generate storybook.')
  }
  console.log('[AI Process] Sample verified milestone:', {
    milestone_code: verified[0]?.milestone_code,
    category: verified[0]?.category,
    status: verified[0]?.status,
  })
  await updateProgress(supabase, assessmentId, 10)
  console.log('[AI Process] Progress updated to 10% - milestones verified')

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

  await updateProgress(supabase, assessmentId, 20)

  // Use all verified milestones for storybook generation (not filtered)
  // The selector agent is optional and only for reducing input, but we want full storybook
  const storybookResult = await callStorybookAgent(verified)
  const draftStorybook = storybookResult.storybook
  console.log('[AI Process] Storybook agent complete')
  await updateProgress(supabase, assessmentId, 35)

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

  await updateProgress(supabase, assessmentId, 45)

  const rawPages = Array.isArray(validatedStorybook?.pages)
    ? validatedStorybook.pages
    : []

  console.log('[AI Process] Raw pages from storybook agent:', rawPages.length)
  console.log('[AI Process] Verified milestones count:', verified.length)
  console.log('[AI Process] Filtered verified milestones count:', filteredVerified.length)

  // Always use ALL verified milestones for page creation, not just filtered ones
  // The selector agent is only for storybook agent input, not for limiting final pages
  let pagesForCombine = rawPages
  const expectedPages = verified.length // Use all verified milestones, not filtered
  const threshold = Math.max(1, Math.floor(expectedPages * 0.8))
  
  if (rawPages.length < threshold) {
    console.warn(`[AI Process] Storybook agent only generated ${rawPages.length} pages for ${expectedPages} milestones (threshold: ${threshold}). Creating pages from ALL verified milestones.`)
    
    // Helper function to sanitize text - remove control characters and normalize whitespace
    const sanitizeText = (text: string | null | undefined): string => {
      if (!text) return ''
      return text
        .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Remove control characters
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim()
    }

    // Create pages directly from ALL verified milestones (not filteredVerified)
    // This ensures we get pages for all milestones, not just the selected subset
    const milestonePages = (verified as any[]).map((milestone: any, index: number) => {
      let narrativeText = ''
      if (milestone.status === 'met') {
        narrativeText = sanitizeText(milestone.celebration_narrative) || 'Great progress on this milestone!'
      } else {
        const concern = sanitizeText(milestone.concern_narrative)
        const encouragement = sanitizeText(milestone.parental_encouragement)
        narrativeText = [concern, encouragement].filter(Boolean).join(' ').trim() || 'Gentle support and practice will help with this milestone.'
      }

      return {
        page_number: index + 1,
        milestone_code: milestone.milestone_code,
        category: milestone.category || 'General',
        display_text: sanitizeText(milestone.question) || `Milestone ${milestone.milestone_code}`,
        narrative_text: narrativeText,
        visual_flag: sanitizeText(milestone.red_flag_icon) || '',
        illustration_prompts: milestone.storybook_scene_description 
          ? [sanitizeText(milestone.storybook_scene_description)]
          : ['Supportive family scene with inclusive, child-safe visuals'],
        status: milestone.status || 'missed',
      }
    })
    
    pagesForCombine = milestonePages
    console.log(`[AI Process] Created ${pagesForCombine.length} pages from ${verified.length} verified milestones`)
  } else {
    // Use raw pages from storybook agent
    // Don't filter based on selector agent - use all pages generated
    console.log(`[AI Process] Using ${pagesForCombine.length} pages from storybook agent`)
  }

  console.log('[AI Process] Pages for combining:', pagesForCombine.length)

  // Ensure we have pages to combine
  if (pagesForCombine.length === 0) {
    throw new Error('No pages available to combine. Cannot generate storybook.')
  }

  // Ensure missed-first prioritization for page ordering
  let combinedPages = await combinePages(
    pagesForCombine as any,
    { prioritize: 'missed-first' }, // Explicitly set to show needs support first, then celebrations
    (filteredVerified as any) ?? (verified as any)
  )

  console.log('[AI Process] Combined pages count:', combinedPages.length)
  console.log('[AI Process] Page order:')
  combinedPages.forEach((p: any) => {
    console.log(`  Page ${p.page_number}: ${p.status} - ${p.category} - "${p.display_text}"`)
  })
  if (combinedPages.length === 0) {
    throw new Error('combinePages returned 0 pages. Cannot generate storybook.')
  }
  
  // Log sample combined page
  if (combinedPages.length > 0) {
    console.log('[AI Process] Sample combined page:', {
      page_number: combinedPages[0]?.page_number,
      category: combinedPages[0]?.category,
      status: combinedPages[0]?.status,
      has_image_prompt: !!combinedPages[0]?.illustration_prompts?.[0],
    })
  }

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

  // Create image prompts using the properly ordered and numbered pages
  // The page_number from combinedPages is already correctly set (1, 2, 3, ...)
  // with missed pages first, then met pages
  const imagePrompts = combinedPages.map((page: any) => ({
    milestone_code: page.milestone_code ?? `page-${page.page_number}`,
    scene_description:
      page.illustration_prompts?.[0] ??
      page.display_text ??
      'Supportive family combined illustration',
    page_number: page.page_number, // Use the properly ordered page number
    category: page.category ?? null, // Include category for fallback prompts
  }))
  
  console.log('[AI Process] Image prompts created:', imagePrompts.length)
  console.log('[AI Process] Image prompt order:')
  imagePrompts.forEach((prompt) => {
    console.log(`  Page ${prompt.page_number}: ${prompt.scene_description.substring(0, 50)}...`)
  })

  // Generate images with progress updates (50% to 80%)
  // This is the longest step, so we give it 30% of the progress bar
  const totalImages = imagePrompts.length
  await updateProgress(supabase, assessmentId, 50)
  
  const generatedImages = await generateStorybookImages(
    imagePrompts,
    assessmentId,
    async (completed, total) => {
      // Progress from 50% to 80% based on image completion
      // This gives us 30% range for image generation, making it very visible
      const imageProgress = completed / total
      // Use Math.ceil to ensure we get at least 51% when first image completes
      const progress = Math.min(80, 50 + Math.ceil(imageProgress * 30)) // 50% to 80%
      await updateProgress(supabase, assessmentId, progress)
      console.log(`[AI Process] Image generation progress: ${completed}/${total} (${progress}%)`)
    },
    forceRegenerate ?? false // Pass forceRegenerate flag to reuse existing images unless forced
  )
  console.log('[AI Process] Images generated:', generatedImages.length)
  await updateProgress(supabase, assessmentId, 80)

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
  await updateProgress(supabase, assessmentId, 82)
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

  await updateProgress(supabase, assessmentId, 88)
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
  await updateProgress(supabase, assessmentId, 95)
  
  // Final progress update before completion
  await updateProgress(supabase, assessmentId, 99)

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
      .update({ ai_processing_status: 'processing', ai_processing_progress: 5 } as any)
      .eq('assessment_id', assessmentId)
    if (setProcessingError) {
      console.error('[AI Process] Failed to set processing status:', setProcessingError)
    } else {
      console.log('[AI Process] Initialized progress at 5%')
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

