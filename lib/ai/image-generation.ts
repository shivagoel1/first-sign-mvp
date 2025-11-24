import OpenAI from 'openai'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

type ImagePrompt = {
  milestone_code: string
  scene_description: string
  page_number: number
  category?: string | null // Optional category for fallback prompts
}

type GeneratedImage = {
  page_number: number
  image_url: string
}

export const PLACEHOLDER_IMAGE = '/images/placeholder-milestone.png'
const MAX_RETRIES = 2

// Retry queue for rate-limited image generation requests
type QueuedImageRequest = {
  prompt: ImagePrompt
  assessmentId: string
  supabase: Awaited<ReturnType<typeof createClient>>
  forceRegenerate: boolean
  retryCount: number
  maxRetries: number
}

const rateLimitQueue: QueuedImageRequest[] = []
let isProcessingQueue = false
const RATE_LIMIT_RETRY_DELAY_MS = 5000 // 5 seconds between retries
const MAX_QUEUE_RETRIES = 3 // Maximum retries in queue

async function processRateLimitQueue(): Promise<void> {
  if (isProcessingQueue || rateLimitQueue.length === 0) {
    return
  }
  
  isProcessingQueue = true
  console.log(`[image-generation] Processing rate limit queue: ${rateLimitQueue.length} items`)
  
  while (rateLimitQueue.length > 0) {
    const item = rateLimitQueue.shift()
    if (!item) break
    
    try {
      console.log(`[image-generation] Retrying queued image for page ${item.prompt.page_number} (attempt ${item.retryCount + 1}/${item.maxRetries})`)
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_RETRY_DELAY_MS))
      
      const result = await generateSingleImage(
        item.prompt,
        item.assessmentId,
        item.supabase,
        item.forceRegenerate
      )
      
      console.log(`[image-generation] Successfully generated queued image for page ${item.prompt.page_number}`)
    } catch (error) {
      const isRateLimit = error && typeof error === 'object' && 
        (('status' in error && (error as any).status === 429) ||
         ('code' in error && (error as any).code === 'rate_limit_exceeded') ||
         ('message' in error && String((error as any).message).toLowerCase().includes('rate limit')))
      
      if (isRateLimit && item.retryCount < item.maxRetries) {
        // Re-queue with incremented retry count
        rateLimitQueue.push({
          ...item,
          retryCount: item.retryCount + 1,
        })
        console.warn(`[image-generation] Re-queuing image for page ${item.prompt.page_number} due to rate limit (retry ${item.retryCount + 1}/${item.maxRetries})`)
      } else {
        console.error(`[image-generation] Failed to generate queued image for page ${item.prompt.page_number} after ${item.retryCount} retries:`, error)
      }
    }
  }
  
  isProcessingQueue = false
  console.log(`[image-generation] Rate limit queue processing complete`)
}

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not configured.')
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

/**
 * Sanitize prompt to avoid content policy violations
 * Removes potentially problematic content while preserving the core scene description
 */
function sanitizeImagePrompt(prompt: string): string {
  let sanitized = prompt
  
  // Remove any medical/clinical terminology that might trigger policy violations
  const problematicTerms = [
    'diagnosis', 'diagnostic', 'disorder', 'disease', 'syndrome', 'disability',
    'abnormal', 'deficit', 'impairment', 'delay', 'problem', 'issue', 'concern',
    'red flag', 'warning', 'alert', 'risk', 'danger', 'harm', 'injury', 'trauma'
  ]
  
  // Replace problematic terms with neutral alternatives
  for (const term of problematicTerms) {
    const regex = new RegExp(`\\b${term}\\w*\\b`, 'gi')
    sanitized = sanitized.replace(regex, '')
  }
  
  // Remove any explicit age references that might be problematic
  sanitized = sanitized.replace(/\b\d+\s*(month|year|old)\b/gi, '')
  
  // Remove excessive punctuation and normalize spacing
  sanitized = sanitized.replace(/[!]{2,}/g, '!')
  sanitized = sanitized.replace(/\s+/g, ' ')
  sanitized = sanitized.trim()
  
  // Ensure prompt is not empty after sanitization
  if (!sanitized || sanitized.length < 10) {
    return 'A warm, joyful, child-friendly illustration showing positive developmental activities in a safe, inclusive environment'
  }
  
  return sanitized
}

/**
 * Create a safe fallback prompt when original prompt violates content policy
 */
function createFallbackPrompt(category: string | null, pageNumber: number): string {
  const categoryThemes: Record<string, string> = {
    'Motor': 'A joyful scene of a child engaging in physical play and movement activities',
    'Language/Communication': 'A warm scene of a child and caregiver communicating and interacting together',
    'Social-Emotional': 'A positive scene showing emotional connection and social interaction',
    'Cognitive': 'A playful scene of a child exploring and learning through age-appropriate activities',
  }
  
  const theme = category ? categoryThemes[category] || 'A warm, joyful scene of child development' : 'A warm, joyful scene of child development'
  
  return `${theme}. Inclusive, child-safe illustration with natural light, warm colors, and gentle composition. No text, words, or written content. Pure visual illustration only.`
}

async function generateSingleImage(
  prompt: ImagePrompt,
  assessmentId: string,
  supabase: Awaited<ReturnType<typeof createClient>>,
  forceRegenerate: boolean = false
): Promise<GeneratedImage> {
  const storagePath = `${assessmentId}/${prompt.page_number}.png`
  
  // Check if image already exists and we're not forcing regeneration
  if (!forceRegenerate) {
    const { data: existingFile, error: listError } = await supabase.storage
      .from('storybook-images')
      .list(assessmentId, {
        limit: 100,
        offset: 0,
      })
    
    // If file exists, return the existing URL
    if (!listError && existingFile && existingFile.some(file => file.name === `${prompt.page_number}.png`)) {
      const {
        data: { publicUrl },
      } = supabase.storage
        .from('storybook-images')
        .getPublicUrl(storagePath)
      
      console.log(`[image-generation] Reusing existing image for page ${prompt.page_number}`)
      return {
        page_number: prompt.page_number,
        image_url: publicUrl ?? PLACEHOLDER_IMAGE,
      }
    }
  }

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      // Sanitize the prompt to avoid content policy violations
      const sanitizedScene = sanitizeImagePrompt(prompt.scene_description)
      
      // Append explicit "no text" instruction to ensure DALL-E doesn't add text
      const enhancedPrompt = `${sanitizedScene} IMPORTANT: This image must contain NO text, words, letters, numbers, or any written content whatsoever. Pure visual illustration only.`
      
      // Log the prompt for debugging (truncated to avoid log spam)
      console.log(`[image-generation] Generating image for page ${prompt.page_number} with prompt: ${enhancedPrompt.substring(0, 100)}...`)
      
      const generation = await openai.images.generate({
        model: 'dall-e-3',
        prompt: enhancedPrompt,
        size: '1024x1024',
        quality: 'standard',
        n: 1,
      })

      const openAiUrl = generation.data?.[0]?.url
      if (!openAiUrl) {
        throw new Error('OpenAI returned no image URL.')
      }

      const response = await fetch(openAiUrl)
      if (!response.ok) {
        throw new Error(`Image download failed with status ${response.status}`)
      }

      const arrayBuffer = await response.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      const { error: uploadError } = await supabase.storage
        .from('storybook-images')
        .upload(storagePath, buffer, {
          contentType: 'image/png',
          upsert: true,
        })

      if (uploadError) {
        throw uploadError
      }

      const {
        data: { publicUrl },
      } = supabase.storage
        .from('storybook-images')
        .getPublicUrl(storagePath)

      return {
        page_number: prompt.page_number,
        image_url: publicUrl ?? PLACEHOLDER_IMAGE,
      }
    } catch (error) {
      // Check if it's a content policy violation
      const isContentPolicyViolation = error && typeof error === 'object' && 
        (('code' in error && (error as any).code === 'content_policy_violation') ||
         ('type' in error && String((error as any).type) === 'image_generation_user_error'))
      
      // Check if it's a rate limit error
      const isRateLimit = error && typeof error === 'object' && 
        (('status' in error && (error as any).status === 429) ||
         ('code' in error && (error as any).code === 'rate_limit_exceeded') ||
         ('message' in error && String((error as any).message).toLowerCase().includes('rate limit')))
      
      if (isContentPolicyViolation) {
        console.warn(
          `[image-generation] Content policy violation on attempt ${attempt} for page ${prompt.page_number}. Using fallback prompt...`
        )
        
        // Try with a safe fallback prompt
        if (attempt < MAX_RETRIES) {
          try {
            // Use category from prompt if available, otherwise try to extract from milestone_code
            let category = prompt.category
            if (!category) {
              const categoryMatch = prompt.milestone_code.match(/^(MOTOR|LANGUAGE|SOCIAL|COGNITIVE)/i)
              category = categoryMatch ? categoryMatch[1].charAt(0) + categoryMatch[1].slice(1).toLowerCase() : null
            }
            
            const fallbackPrompt = createFallbackPrompt(category, prompt.page_number)
            console.log(`[image-generation] Retrying with fallback prompt for page ${prompt.page_number}`)
            
            const generation = await openai.images.generate({
              model: 'dall-e-3',
              prompt: fallbackPrompt,
              size: '1024x1024',
              quality: 'standard',
              n: 1,
            })

            const openAiUrl = generation.data?.[0]?.url
            if (!openAiUrl) {
              throw new Error('OpenAI returned no image URL.')
            }

            const response = await fetch(openAiUrl)
            if (!response.ok) {
              throw new Error(`Image download failed with status ${response.status}`)
            }

            const arrayBuffer = await response.arrayBuffer()
            const buffer = Buffer.from(arrayBuffer)

            const { error: uploadError } = await supabase.storage
              .from('storybook-images')
              .upload(storagePath, buffer, {
                contentType: 'image/png',
                upsert: true,
              })

            if (uploadError) {
              throw uploadError
            }

            const {
              data: { publicUrl },
            } = supabase.storage
              .from('storybook-images')
              .getPublicUrl(storagePath)

            console.log(`[image-generation] Successfully generated image with fallback prompt for page ${prompt.page_number}`)
            return {
              page_number: prompt.page_number,
              image_url: publicUrl ?? PLACEHOLDER_IMAGE,
            }
          } catch (fallbackError) {
            console.error(
              `[image-generation] Fallback prompt also failed for page ${prompt.page_number}:`,
              fallbackError
            )
            // Continue to throw the original error if fallback also fails
          }
        }
      } else if (isRateLimit) {
        console.warn(
          `[image-generation] Rate limit hit on attempt ${attempt} for page ${prompt.page_number}. Adding to retry queue...`
        )
        // Add to retry queue instead of immediate retry
        rateLimitQueue.push({
          prompt,
          assessmentId,
          supabase,
          forceRegenerate,
          retryCount: 0,
          maxRetries: MAX_QUEUE_RETRIES,
        })
        // Start processing queue if not already processing
        processRateLimitQueue().catch(err => {
          console.error('[image-generation] Error processing rate limit queue:', err)
        })
        // For immediate retry, wait before continuing
        if (attempt < MAX_RETRIES) {
          const waitTime = 2000 * attempt // 2s, 4s
          await new Promise(resolve => setTimeout(resolve, waitTime))
        }
      } else {
        console.error(
          `[image-generation] attempt ${attempt} failed for page ${prompt.page_number}:`,
          error
        )
      }

      if (attempt === MAX_RETRIES) {
        throw error
      }
    }
  }

  throw new Error('Unreachable image generation error.')
}

/**
 * Clean up old images for an assessment before regeneration
 */
async function cleanupOldImages(
  assessmentId: string,
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<void> {
  try {
    console.log(`[image-generation] Cleaning up old images for assessment ${assessmentId}`)
    
    // List all files in the assessment folder
    const { data: files, error: listError } = await supabase.storage
      .from('storybook-images')
      .list(assessmentId, {
        limit: 1000,
        offset: 0,
      })
    
    if (listError) {
      console.warn(`[image-generation] Error listing files for cleanup:`, listError)
      return
    }
    
    if (!files || files.length === 0) {
      console.log(`[image-generation] No old images to clean up for assessment ${assessmentId}`)
      return
    }
    
    // Delete all files in the assessment folder
    const filePaths = files.map(file => `${assessmentId}/${file.name}`)
    const { error: deleteError } = await supabase.storage
      .from('storybook-images')
      .remove(filePaths)
    
    if (deleteError) {
      console.error(`[image-generation] Error deleting old images:`, deleteError)
      throw deleteError
    }
    
    console.log(`[image-generation] Successfully cleaned up ${filePaths.length} old images for assessment ${assessmentId}`)
  } catch (error) {
    console.error(`[image-generation] Failed to cleanup old images:`, error)
    // Don't throw - allow generation to continue even if cleanup fails
  }
}

export async function generateStorybookImages(
  imagePrompts: ImagePrompt[],
  assessmentId: string,
  onProgress?: (current: number, total: number) => Promise<void> | void,
  forceRegenerate: boolean = false
): Promise<GeneratedImage[]> {
  // Use service-role for storage uploads (bypass RLS on storage)
  let supabase: Awaited<ReturnType<typeof createClient>>
  try {
    supabase = createServiceClient() as unknown as Awaited<
      ReturnType<typeof createClient>
    >
  } catch {
    supabase = await createClient()
  }
  
  // Clean up old images if forcing regeneration
  if (forceRegenerate) {
    await cleanupOldImages(assessmentId, supabase)
  }
  
  const promptsToProcess = imagePrompts

  // Optimized parallel generation with adaptive rate limiting
  // Start with larger batches and reduce if we hit rate limits
  const INITIAL_BATCH_SIZE = 10 // Start with 10 images in parallel
  const MIN_BATCH_SIZE = 5 // Minimum batch size if we hit rate limits
  const INITIAL_DELAY_MS = 1000 // Start with 1 second delay (faster)
  const MAX_DELAY_MS = 3000 // Maximum delay if we hit rate limits
  
  let currentBatchSize = INITIAL_BATCH_SIZE
  let currentDelay = INITIAL_DELAY_MS
  const generationResults: PromiseSettledResult<GeneratedImage>[] = []

  console.log(`[image-generation] Generating ${promptsToProcess.length} images with adaptive batching (starting with ${currentBatchSize} per batch)`)

  // Process images in batches with adaptive rate limiting
  for (let i = 0; i < promptsToProcess.length; i += currentBatchSize) {
    const batch = promptsToProcess.slice(i, i + currentBatchSize)
    const batchNumber = Math.floor(i / currentBatchSize) + 1
    const totalBatches = Math.ceil(promptsToProcess.length / currentBatchSize)

    console.log(`[image-generation] Processing batch ${batchNumber}/${totalBatches} (${batch.length} images in parallel)`)

    const batchStartTime = Date.now()

    // Generate all images in the current batch in parallel
    const batchResults = await Promise.allSettled(
      batch.map((prompt) => {
        return generateSingleImage(prompt, assessmentId, supabase, forceRegenerate)
      })
  )

    // Track successful and failed images in this batch
    let successCount = 0
    let failCount = 0
    let rateLimitErrors = 0
    
    batchResults.forEach((result, batchIndex) => {
      if (result.status === 'fulfilled') {
        successCount++
      } else {
        failCount++
        const error = result.reason
        // Check if it's a rate limit error
        if (error && typeof error === 'object' && 'status' in error) {
          const status = (error as any).status
          if (status === 429 || (error as any).message?.toLowerCase().includes('rate limit')) {
            rateLimitErrors++
          }
        }
      }
    })

    const batchDuration = Date.now() - batchStartTime
    generationResults.push(...batchResults)
    console.log(`[image-generation] Batch ${batchNumber} complete: ${successCount} succeeded, ${failCount} failed (took ${batchDuration}ms)`)
    
    // Update progress callback after each batch completes
    // This provides smooth, visible progress updates
    if (onProgress) {
      const completed = Math.min(i + batch.length, promptsToProcess.length)
      try {
        await onProgress(completed, promptsToProcess.length)
      } catch (error) {
        console.error('[image-generation] Progress callback error:', error)
        // Don't fail image generation if progress update fails
      }
    }

    // Adaptive rate limiting: if we hit rate limits, reduce batch size and increase delay
    if (rateLimitErrors > 0) {
      console.warn(`[image-generation] Rate limit detected (${rateLimitErrors} errors). Reducing batch size and increasing delay.`)
      currentBatchSize = Math.max(MIN_BATCH_SIZE, Math.floor(currentBatchSize * 0.7))
      currentDelay = Math.min(MAX_DELAY_MS, Math.floor(currentDelay * 1.5))
      console.log(`[image-generation] Adjusted: batch size=${currentBatchSize}, delay=${currentDelay}ms`)
    } else if (failCount === 0 && currentBatchSize < INITIAL_BATCH_SIZE) {
      // If no errors, gradually increase batch size back up
      currentBatchSize = Math.min(INITIAL_BATCH_SIZE, currentBatchSize + 1)
      currentDelay = Math.max(INITIAL_DELAY_MS, Math.floor(currentDelay * 0.9))
    }

    // Add delay between batches (except after the last batch)
    if (i + currentBatchSize < promptsToProcess.length) {
      await new Promise(resolve => setTimeout(resolve, currentDelay))
    }
  }

  console.log(`[image-generation] All batches complete. Processing ${generationResults.length} results`)

  return generationResults.map((result, index) => {
    const pageNumber = promptsToProcess[index]?.page_number ?? index + 1

    if (result.status === 'fulfilled') {
      return result.value
    }

    console.error(
      `[image-generation] final failure for page ${pageNumber}:`,
      result.reason
    )

    return {
      page_number: pageNumber,
      image_url: PLACEHOLDER_IMAGE,
    }
  })
}

