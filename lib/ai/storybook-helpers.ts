import OpenAI from 'openai'

import type { Database } from '@/lib/database.types'
import { createClient } from '@/lib/supabase/server'

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
  recommend_next_step: string
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
  recommend_next_step: string
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
      recommend_next_step: string
      red_flag_icon: string | null
      storybookscenedescription: string
    } | null
  } | null
}

async function getSupabaseClient(): Promise<SupabaseClient> {
  return createClient()
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
          recommend_next_step,
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
        recommend_next_step: milestone.cdcguidelines.recommend_next_step,
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

export function verifyMilestones(guidelines: GuidelineRow[]): VerifiedMilestone[] {
  return guidelines.map((item) => ({
    milestone_code: item.milestone_code,
    category: item.category,
    age_months: item.age_months,
    question: item.question,
    status: item.response === 'yes' ? 'met' : 'missed',
    celebration_narrative: item.celebration_narrative,
    concern_narrative: item.concern_narrative,
    parental_encouragement: item.parental_encouragement,
    recommend_next_step: item.recommend_next_step,
    red_flag_icon: item.red_flag_icon,
    storybook_scene_description: item.storybook_scene_description,
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

export async function callStorybookAgent(
  milestones: VerifiedMilestone[]
): Promise<unknown> {
  const prompt = `
You are a pediatric developmental storyteller AI.

Generate a JSON storybook with the following structure:
[
  {
    "milestone_code": "...",
    "display_text": "...",
    "visual_flag": "...",
    "illustration_prompts": ["...", "..."]
  },
  ...
]

Rules:
- Use a gentle, supportive tone.
- When status is "met": include the celebration narrative only.
- When status is "missed": include the concern narrative, parental encouragement, and recommended next step.
- Include the red flag icon in visual_flag when available; otherwise empty string.
- Suggest 1-2 illustration prompts derived from storybook_scene_description.
- Output valid JSON only with the fields above.
`

  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: prompt },
      {
        role: 'user',
        content: JSON.stringify({ milestones }, null, 2),
      },
    ],
    temperature: 0.6,
  })

  const content = completion.choices[0]?.message?.content
  if (!content) {
    throw new Error('No storybook content returned from OpenAI.')
  }

  try {
    return JSON.parse(content)
  } catch (error) {
    throw new Error(`Failed to parse storybook JSON: ${(error as Error).message}`)
  }
}

export async function callValidationAgent(
  storybookJson: unknown,
  milestones: VerifiedMilestone[]
): Promise<unknown> {
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
  "storybook": {...}
}
`

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
    throw new Error('No validation response from OpenAI.')
  }

  let parsed: { approved: boolean; issues?: string[]; storybook: unknown }
  try {
    parsed = JSON.parse(content)
  } catch (error) {
    throw new Error(`Failed to parse validation JSON: ${(error as Error).message}`)
  }

  if (!parsed.approved) {
    throw new Error(`Storyboard validation failed: ${(parsed.issues ?? []).join('; ')}`)
  }

  return parsed.storybook
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

export type { GuidelineRow, VerifiedMilestone }

