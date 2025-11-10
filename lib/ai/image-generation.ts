import OpenAI from 'openai'

import { createClient } from '@/lib/supabase/server'

type ImagePrompt = {
  milestone_code: string
  scene_description: string
  page_number: number
}

type GeneratedImage = {
  page_number: number
  image_url: string
}

const PLACEHOLDER_IMAGE = '/images/placeholder-milestone.png'
const MAX_IMAGES = 4
const MAX_RETRIES = 2

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not configured.')
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function generateStorybookImages(
  imagePrompts: ImagePrompt[],
  assessmentId: string
): Promise<GeneratedImage[]> {
  const supabase = await createClient()
  const promptsToProcess = imagePrompts.slice(0, MAX_IMAGES)
  const results: GeneratedImage[] = []

  for (const prompt of promptsToProcess) {
    let finalImageUrl = PLACEHOLDER_IMAGE

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
      try {
        const generation = await openai.images.generate({
          model: 'dall-e-3',
          prompt: prompt.scene_description,
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

        finalImageUrl = publicUrl ?? PLACEHOLDER_IMAGE
        break
      } catch (error) {
        console.error(
          `[image-generation] attempt ${attempt} failed for page ${prompt.page_number}:`,
          error
        )
        finalImageUrl = PLACEHOLDER_IMAGE
      }
    }

    results.push({
      page_number: prompt.page_number,
      image_url: finalImageUrl,
    })
  }

  return results
}

