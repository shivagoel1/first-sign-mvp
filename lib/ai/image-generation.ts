import OpenAI from 'openai'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

type ImagePrompt = {
  milestone_code: string
  scene_description: string
  page_number: number
}

type GeneratedImage = {
  page_number: number
  image_url: string
}

export const PLACEHOLDER_IMAGE = '/images/placeholder-milestone.png'
const MAX_RETRIES = 2

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not configured.')
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

async function generateSingleImage(
  prompt: ImagePrompt,
  assessmentId: string,
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<GeneratedImage> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      // Append explicit "no text" instruction to ensure DALL-E doesn't add text
      const enhancedPrompt = `${prompt.scene_description} IMPORTANT: This image must contain NO text, words, letters, numbers, or any written content whatsoever. Pure visual illustration only.`
      
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

      const storagePath = `${assessmentId}/${prompt.page_number}.png`
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
      console.error(
        `[image-generation] attempt ${attempt} failed for page ${prompt.page_number}:`,
        error
      )

      if (attempt === MAX_RETRIES) {
        throw error
      }
    }
  }

  throw new Error('Unreachable image generation error.')
}

export async function generateStorybookImages(
  imagePrompts: ImagePrompt[],
  assessmentId: string
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
  const promptsToProcess = imagePrompts

  const generationResults = await Promise.allSettled(
    promptsToProcess.map((prompt) =>
      generateSingleImage(prompt, assessmentId, supabase)
    )
  )

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

