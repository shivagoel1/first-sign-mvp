import express, { Request, Response } from 'express'
import rateLimit from 'express-rate-limit'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  OPENAI_API_KEY,
  OPENAI_MODEL = 'gpt-4o-mini',
  PORT = '3000',
} = process.env

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Supabase credentials are missing.')
}

if (!OPENAI_API_KEY) {
  throw new Error('OpenAI API key is missing.')
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

const openai = new OpenAI({ apiKey: OPENAI_API_KEY })

const app = express()
app.use(express.json())

const tokenAwareLimiter = rateLimit({
  windowMs: 60_000,
  max: (req: Request) => {
    const estimatedTokensHeader = req.headers['x-estimated-tokens']
    const tokens =
      typeof estimatedTokensHeader === 'string'
        ? Number(estimatedTokensHeader)
        : Array.isArray(estimatedTokensHeader)
        ? Number(estimatedTokensHeader[0])
        : 0
    if (!Number.isFinite(tokens) || tokens <= 0) {
      return 20
    }
    return Math.max(1, Math.floor(12_000 / tokens))
  },
  standardHeaders: true,
  legacyHeaders: false,
})

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

const fetchAssessmentData = async (assessmentId: string) => {
  const { data, error } = await supabase
    .from('assessment_responses')
    .select(
      `
      response,
      milestones!inner(
        milestone_code,
        category,
        age_months,
        question,
        cdcguidelines!inner(
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

  if (error) {
    throw new Error(error.message)
  }

  if (!data || data.length === 0) {
    throw new Error('No responses found for this assessment.')
  }

  const mapped: GuidelineRow[] = data
    .map((row) => {
      const milestone = row.milestones as unknown as {
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

      if (!milestone || !milestone.cdcguidelines) {
        return null
      }

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
        storybook_scene_description: milestone.cdcguidelines.storybookscenedescription,
      }
    })
    .filter((row): row is GuidelineRow => Boolean(row))

  if (!mapped.length) {
    throw new Error('Milestone guidelines missing for assessment responses.')
  }

  return mapped
}

const verifyMilestones = (guidelines: GuidelineRow[]): VerifiedMilestone[] =>
  guidelines.map((item) => ({
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

const getVerifiedMilestones = async (
  assessmentId: string,
  seed?: VerifiedMilestone[]
): Promise<VerifiedMilestone[]> => {
  if (Array.isArray(seed) && seed.length) {
    return seed
  }
  const data = await fetchAssessmentData(assessmentId)
  return verifyMilestones(data)
}

const callStorybookAgent = async (milestones: VerifiedMilestone[]) => {
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
    model: OPENAI_MODEL,
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

  let parsed: unknown
  try {
    parsed = JSON.parse(content)
  } catch (error) {
    throw new Error(`Failed to parse storybook JSON: ${(error as Error).message}`)
  }

  return parsed
}

const callValidationAgent = async (storybookJson: unknown, milestones: VerifiedMilestone[]) => {
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
    model: OPENAI_MODEL,
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

const checkStorybookExisting = async (assessmentId: string) => {
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

const storeStorybook = async (assessmentId: string, storybook: unknown) => {
  const { error } = await supabase
    .from('assessment_results')
    .update({ ai_report: storybook })
    .eq('assessment_id', assessmentId)

  if (error) {
    throw new Error(error.message)
  }
}

app.post(
  '/api/assessment/:assessmentId/verify',
  tokenAwareLimiter,
  async (req: Request, res: Response) => {
    try {
      const { assessmentId } = req.params
      if (!assessmentId) {
        return res.status(400).json({ error: 'assessmentId is required.' })
      }

      const verified = await getVerifiedMilestones(assessmentId)
      return res.status(200).json({ assessmentId, milestones: verified })
    } catch (error) {
      console.error('[verify] error:', error)
      return res.status(500).json({ error: (error as Error).message })
    }
  }
)

app.post(
  '/api/assessment/:assessmentId/storybook',
  tokenAwareLimiter,
  async (req: Request, res: Response) => {
    try {
      const { assessmentId } = req.params
      const { verifiedMilestones } = req.body ?? {}
      if (!assessmentId) {
        return res.status(400).json({ error: 'assessmentId is required.' })
      }

      const verified = await getVerifiedMilestones(
        assessmentId,
        Array.isArray(verifiedMilestones) ? verifiedMilestones : undefined
      )
      const storybook = await callStorybookAgent(verified)
      return res.status(200).json({ assessmentId, storybook })
    } catch (error) {
      console.error('[storybook] error:', error)
      return res.status(500).json({ error: (error as Error).message })
    }
  }
)

app.post(
  '/api/assessment/:assessmentId/validate',
  tokenAwareLimiter,
  async (req: Request, res: Response) => {
    try {
      const { assessmentId } = req.params
      const { storybook, verifiedMilestones } = req.body ?? {}
      if (!assessmentId || !storybook) {
        return res
          .status(400)
          .json({ error: 'assessmentId and storybook payload are required.' })
      }

      const verified = await getVerifiedMilestones(
        assessmentId,
        Array.isArray(verifiedMilestones) ? verifiedMilestones : undefined
      )
      const validated = await callValidationAgent(storybook, verified)
      return res.status(200).json({ assessmentId, storybook: validated })
    } catch (error) {
      console.error('[validate] error:', error)
      return res.status(500).json({ error: (error as Error).message })
    }
  }
)

app.post(
  '/api/assessment/:assessmentId/process',
  tokenAwareLimiter,
  async (req: Request, res: Response) => {
    try {
      const { assessmentId } = req.params
      if (!assessmentId) {
        return res.status(400).json({ error: 'assessmentId is required.' })
      }

      const existing = await checkStorybookExisting(assessmentId)
      if (existing) {
        return res.status(200).json({
          assessmentId,
          storybook: existing,
          status: 'already_submitted',
        })
      }

      const verified = await getVerifiedMilestones(assessmentId)
      const draftStorybook = await callStorybookAgent(verified)
      const validatedStorybook = await callValidationAgent(draftStorybook, verified)

      await storeStorybook(assessmentId, validatedStorybook)

      return res.status(200).json({
        assessmentId,
        storybook: validatedStorybook,
        status: 'submitted',
      })
    } catch (error) {
      console.error('[process] error:', error)
      return res.status(500).json({ error: (error as Error).message })
    }
  }
)

app.listen(Number(PORT), () => {
  console.log(`AI pediatric storybook service listening on port ${PORT}`)
})

export default app

