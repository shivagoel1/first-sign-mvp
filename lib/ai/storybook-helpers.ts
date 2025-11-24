import OpenAI from 'openai'
import type { ChatCompletion } from 'openai/resources/chat/completions'

import type { Database } from '@/lib/database.types'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not configured.')
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

type GuidelineRow = {
  milestone_code: string
  category: string | null
  age_months: number | null
  question: string | null
  response: string
  celebration_narrative: string
  concern_narrative: string
  parental_encouragement: string
  red_flag_icon: string | null
  storybook_scene_description: string
}

type VerifiedMilestone = {
  milestone_code: string
  category: string | null
  age_months: number | null
  question: string | null
  status: 'met' | 'missed'
  celebration_narrative: string
  concern_narrative: string
  parental_encouragement: string
  red_flag_icon: string | null
  storybook_scene_description: string
}

type RawAssessmentJoin = {
  response: string
  milestones: {
    milestone_code: string
    category: string | null
    age_months: number | null
    question: string | null
    cdcguidelines: {
      celebrationnarrative: string
      concernnarrative: string
      parental_encouragement: string
      red_flag_icon: string | null
      storybookscenedescription: string
    } | null
  } | null
}

async function getSupabaseClient(): Promise<SupabaseClient> {
  // Use service-role on the server to bypass RLS for backend processing
  try {
    return createServiceClient() as unknown as SupabaseClient
  } catch {
    // Fallback to regular server client if service key missing (will be constrained by RLS)
    return createClient()
  }
}

export async function fetchAssessmentData(
  assessmentId: string
): Promise<GuidelineRow[]> {
  const supabase = await getSupabaseClient()

  const { data, error } = await supabase
    .from('assessment_responses')
    .select(
      `
      response,
      milestones:milestones!inner(
        milestone_code,
        category,
        age_months,
        question,
    cdcguidelines:cdcguidelines!inner(
      celebrationnarrative,
      concernnarrative,
      parental_encouragement,
      red_flag_icon,
      storybookscenedescription
    )
      )
    `
    )
    .eq('assessment_id', assessmentId)
    .returns<RawAssessmentJoin[]>()

  if (error) {
    throw new Error(error.message)
  }

  if (!data || data.length === 0) {
    throw new Error('No responses found for this assessment.')
  }

  const mapped: GuidelineRow[] = data
    .map((row) => {
      const milestone = row.milestones
      if (!milestone || !milestone.cdcguidelines) return null

      return {
        milestone_code: milestone.milestone_code,
        category: milestone.category,
        age_months: milestone.age_months,
        question: milestone.question,
        response: row.response,
        celebration_narrative: milestone.cdcguidelines.celebrationnarrative,
        concern_narrative: milestone.cdcguidelines.concernnarrative,
        parental_encouragement: milestone.cdcguidelines.parental_encouragement,
        red_flag_icon: milestone.cdcguidelines.red_flag_icon,
        storybook_scene_description:
          milestone.cdcguidelines.storybookscenedescription,
      }
    })
    .filter((row): row is GuidelineRow => Boolean(row))

  if (!mapped.length) {
    throw new Error('Milestone guidelines missing for assessment responses.')
  }

  return mapped
}

// Helper function to sanitize text - remove control characters and normalize whitespace
function sanitizeText(text: string | null | undefined): string {
  if (!text) return ''
  return text
    .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Remove control characters
    .replace(/\s+/g, ' ') // Normalize whitespace (multiple spaces/newlines to single space)
    .trim()
}

export function verifyMilestones(guidelines: GuidelineRow[]): VerifiedMilestone[] {
  return guidelines.map((item) => ({
    milestone_code: item.milestone_code,
    category: item.category,
    age_months: item.age_months,
    question: sanitizeText(item.question),
    status: item.response === 'yes' ? 'met' : 'missed',
    celebration_narrative: sanitizeText(item.celebration_narrative),
    concern_narrative: sanitizeText(item.concern_narrative),
    parental_encouragement: sanitizeText(item.parental_encouragement),
    red_flag_icon: sanitizeText(item.red_flag_icon),
    storybook_scene_description: sanitizeText(item.storybook_scene_description),
  }))
}

export async function getVerifiedMilestones(
  assessmentId: string,
  seed?: VerifiedMilestone[]
): Promise<VerifiedMilestone[]> {
  if (Array.isArray(seed) && seed.length) {
    return seed
  }

  const data = await fetchAssessmentData(assessmentId)
  return verifyMilestones(data)
}

export type StorybookAgentResult = {
  completion: ChatCompletion
  storybook: { pages: unknown[] }
}

export type ValidationAgentResult = {
  completion: ChatCompletion
  approved: boolean
  issues: string[]
  storybook: { pages: unknown[] }
}

export async function callStorybookAgent(
  milestones: VerifiedMilestone[]
): Promise<StorybookAgentResult> {
  const prompt = `
You are a pediatric developmental storyteller AI. Generate a JSON storybook that helps parents understand their child's progress.

CRITICAL: Generate pages for ALL milestones provided
- You MUST create a page for EACH milestone in the input array
- The number of pages in your output MUST match the number of milestones provided
- Do NOT skip any milestones or combine multiple milestones into a single page at this stage
- Each milestone should get its own dedicated page with unique content

Output Requirements:
- Return a JSON object with a single key "pages" whose value is an array.
- The array MUST contain one page object for each milestone in the input
- Each array item must be an object with exactly these fields:
  - "page_number" (integer, sequential starting at 1)
  - "milestone_code" (string) - MUST match one of the milestone codes from input
  - "display_text" (string; milestone heading)
  - "narrative_text" (string; 2-3 supportive sentences summarizing the child's status)
  - "visual_flag" (string; red-flag description or empty string)
  - "illustration_prompts" (array of 1-2 positive, child-friendly illustration prompts)
  - "status" (string; either "met" or "missed")
  - "category" (string; the milestone category)

CRITICAL: UNIQUE CONTENT FOR EACH PAGE
- Each page MUST have completely unique narrative_text that is specific to that milestone
- DO NOT repeat the same narrative across multiple pages, even if milestones have similar statuses
- Each milestone_code must receive its own distinct narrative based on its specific question and context
- If multiple milestones share similar narratives, adapt each one to be unique while maintaining accuracy
- Vary sentence structure, word choice, and emphasis to ensure each page feels fresh and distinct

CRITICAL: Use CDC-Provided Narratives as Primary Source
- Each milestone in the input includes structured narratives from CDC guidelines:
  - "celebration_narrative": Use this EXACTLY or adapt minimally when status is "met"
  - "concern_narrative": Use this EXACTLY or adapt minimally when status is "missed"
  - "parental_encouragement": Incorporate this when status is "missed" to maintain supportive tone
  - "storybook_scene_description": Use this as the PRIMARY source for illustration_prompts
- DO NOT generate new narratives from scratch. Your role is to:
  1. Select the appropriate CDC narrative based on status (met → celebration, missed → concern)
  2. Optionally combine concern_narrative + parental_encouragement for missed items (keep to 2-3 sentences)
  3. Use storybook_scene_description directly or adapt slightly for illustration_prompts
  4. Only generate new text if CDC narratives are missing or incomplete
  5. IMPORTANT: If a milestone's CDC narrative is identical to a previous milestone's narrative, adapt it to be unique while preserving the core message

Narrative Guidance:
- Keep each narrative_text to two or three sentences.
- Maintain the warm, encouraging tone from the CDC narratives.
- Avoid alarming or diagnostic language; focus on gentle guidance.
- When combining narratives, ensure smooth flow between sentences.
- Ensure each narrative is specific to the milestone's question and context, not generic

Illustration Prompt Guidance:
- PRIMARY: Use the "storybook_scene_description" field from each milestone as the base for illustration_prompts
- Each illustration_prompt should be unique and specific to that milestone's scene description
- If multiple milestones are combined, merge their scene descriptions into one coherent visual
- Prompts should depict joyful, inclusive, and child-safe scenes
- Avoid medical or negative imagery; focus on supportive, hopeful visuals
- Vary the scene composition and elements to ensure visual diversity

Additional Rules:
- Pages must be numbered sequentially without gaps.
- Red flag content goes in visual_flag and narrative_text, but keep tone calm.
- Status must strictly match "met" or "missed" and align with the supplied milestone data.
- Ensure illustration_prompts are concise, descriptive scenes based on storybook_scene_description.
- Review all pages before finalizing to ensure no duplicate narratives exist

Respond with valid JSON only, following the structure above.`

  // Sanitize milestones before JSON stringify to prevent issues with special characters
  const sanitizedMilestones = milestones.map((m) => ({
    ...m,
    question: sanitizeText(m.question),
    celebration_narrative: sanitizeText(m.celebration_narrative),
    concern_narrative: sanitizeText(m.concern_narrative),
    parental_encouragement: sanitizeText(m.parental_encouragement),
    red_flag_icon: sanitizeText(m.red_flag_icon),
    storybook_scene_description: sanitizeText(m.storybook_scene_description),
  }))

  let milestonesJson: string
  try {
    milestonesJson = JSON.stringify({ milestones: sanitizedMilestones }, null, 2)
  } catch (error) {
    console.error('[storybook-agent] Failed to stringify milestones:', error)
    throw new Error(`Failed to serialize milestones for storybook generation: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: prompt },
      {
        role: 'user',
        content: milestonesJson,
      },
    ],
    temperature: 0.8, // Increased from 0.6 to encourage more diverse, unique outputs
  })

  const content = completion.choices[0]?.message?.content
  if (!content) {
    throw new Error('No storybook content returned from OpenAI.')
  }

  try {
    // Sanitize the content before parsing to handle any control characters
    const sanitizedContent = content.replace(/[\x00-\x1F\x7F-\x9F]/g, '')
    const parsed = JSON.parse(sanitizedContent)
    const pages = Array.isArray(parsed.pages) ? parsed.pages : []
    
    // Sanitize page content to prevent issues downstream
    const sanitizedPages = pages.map((page: any) => ({
      ...page,
      display_text: sanitizeText(page.display_text),
      narrative_text: sanitizeText(page.narrative_text),
      visual_flag: sanitizeText(page.visual_flag),
      illustration_prompts: Array.isArray(page.illustration_prompts)
        ? page.illustration_prompts.map((p: string) => sanitizeText(p))
        : [],
    }))
    
    console.log(`[storybook-agent] Generated ${sanitizedPages.length} pages for ${milestones.length} milestones`)
    
    if (sanitizedPages.length < milestones.length) {
      console.warn(`[storybook-agent] WARNING: Generated only ${sanitizedPages.length} pages but ${milestones.length} milestones were provided`)
    }
    
    return { completion, storybook: { pages: sanitizedPages } }
  } catch (error) {
    console.error('[storybook-agent] JSON parse error:', error)
    console.error('[storybook-agent] Content length:', content.length)
    console.error('[storybook-agent] Content preview:', content.substring(0, 500))
    throw new Error(`Failed to parse storybook JSON: ${(error as Error).message}`)
  }
}

export async function callValidationAgent(
  storybookJson: { pages: unknown[] },
  milestones: VerifiedMilestone[]
): Promise<ValidationAgentResult> {
  const prompt = `
You are an editorial validation AI for pediatric developmental narratives.

Review the provided storybook JSON to ensure:
- Tone is supportive and parent-friendly.
- Statements align with milestone status and supplied narratives.
- Red flag icons are present when status is "missed" and red_flag_icon is provided.
- Illustration prompts are relevant.

Respond with JSON:
{
  "approved": true|false,
  "issues": ["..."],
  "storybook": { "pages": [...] }
}`

  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: prompt },
      {
        role: 'user',
        content: JSON.stringify(
          {
            storybook: storybookJson,
            milestones,
          },
          null,
          2
        ),
      },
    ],
    temperature: 0.4,
  })

  const content = completion.choices[0]?.message?.content
  if (!content) {
    throw new Error('No validation content returned from OpenAI.')
  }

  try {
    const parsed = JSON.parse(content)
    const pages = Array.isArray(parsed.storybook?.pages)
      ? parsed.storybook.pages
      : []
    return {
      completion,
      approved: Boolean(parsed.approved),
      issues: Array.isArray(parsed.issues) ? parsed.issues : [],
      storybook: { pages },
    }
  } catch (error) {
    throw new Error(`Failed to parse validation JSON: ${(error as Error).message}`)
  }
}

export async function checkStorybookExisting(
  assessmentId: string
): Promise<unknown> {
  const supabase = await getSupabaseClient()

  const { data, error } = await supabase
    .from('assessment_results')
    .select('ai_report')
    .eq('assessment_id', assessmentId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data?.ai_report ?? null
}

export async function storeStorybook(
  assessmentId: string,
  storybook: unknown
): Promise<void> {
  const supabase = await getSupabaseClient()
  const serialized =
    typeof storybook === 'string' ? storybook : JSON.stringify(storybook)

  const { error } = await supabase
    .from('assessment_results')
    .update({ ai_report: serialized })
    .eq('assessment_id', assessmentId)

  if (error) {
    throw new Error(error.message)
  }
}

export type {
  GuidelineRow,
  VerifiedMilestone,
}

