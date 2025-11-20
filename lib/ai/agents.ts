import OpenAI from 'openai'

type SelectorOptions = {
  maxSelected: number
  prioritize: 'missed-first' | 'balanced'
}

export async function callSelectorAgent(
  verified: Array<Record<string, any>>,
  options?: Partial<SelectorOptions>
): Promise<Set<string>> {
  const cfg: SelectorOptions = {
    maxSelected:
      Number(process.env.SELECTOR_MAX_ITEMS) > 0
        ? Number(process.env.SELECTOR_MAX_ITEMS)
        : 20,
    prioritize:
      (process.env.COMBINE_PRIORITIZE as 'missed-first' | 'balanced') ??
      'missed-first',
    ...(options ?? {}),
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const payload = {
      instructions:
        'Choose the most important milestones to visualize. Prefer missed/red-flag items, ensure category coverage, limit total.',
      prioritize: cfg.prioritize,
      maxSelected: cfg.maxSelected,
      items: verified.map((v) => ({
        milestone_code: v.milestone_code,
        category: v.category,
        status: v.status,
        red_flag_icon: v.red_flag_icon ?? null,
        celebration_narrative: v.celebration_narrative ?? null,
        concern_narrative: v.concern_narrative ?? null,
        parental_encouragement: v.parental_encouragement ?? null,
      })),
    }
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      temperature: 0.3,
      messages: [
        {
          role: 'system',
          content:
            'Return strict JSON: {"selected": string[]} where selected are milestone_code values, length <= maxSelected. No extra fields.',
        },
        { role: 'user', content: JSON.stringify(payload) },
      ],
      max_tokens: 200,
    })
    const content = completion.choices[0]?.message?.content
    if (!content) return new Set()
    const parsed = JSON.parse(content)
    const arr: string[] = Array.isArray(parsed.selected) ? parsed.selected : []
    return new Set(arr.filter((s) => typeof s === 'string'))
  } catch (error) {
    console.error('[selector-agent] failed:', error)
    return new Set()
  }
}

export async function callPolishCombinedPage(
  page: {
    category: string | null
    status: 'met' | 'missed'
    items?: Array<{
      milestone_code?: string
      display_text?: string
      micro_narrative?: string
      visual_flag?: string
    }>
    display_text: string
    narrative_text: string
  }
): Promise<{ caption?: string; illustration_prompt?: string } | null> {
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      temperature: 0.4,
      messages: [
        {
          role: 'system',
          content:
            'Refine the page caption and illustration prompt while PRESERVING the CDC narrative style and content. The "narrative" fields in items come from CDC guidelines (celebration_narrative, concern_narrative, parental_encouragement) - maintain their supportive, parent-friendly tone. For illustration_prompt, prioritize any scene descriptions from the narratives. CRITICAL: The illustration_prompt must explicitly state "NO text, words, letters, numbers, or written content in the image - pure visual illustration only." Return strict JSON: {"caption": string, "illustration_prompt": string}. Caption should be 1-2 sentences, supportive tone, matching CDC narrative style.',
        },
        {
          role: 'user',
          content: JSON.stringify(
            {
              category: page.category,
              status: page.status,
              items: (page.items ?? []).map((i) => ({
                display_text: i.display_text,
                narrative: i.micro_narrative,
                visual_flag: i.visual_flag,
              })),
              current: {
                title: page.display_text,
                caption: page.narrative_text,
              },
            },
            null,
            2
          ),
        },
      ],
      max_tokens: 180,
    })
    const content = completion.choices[0]?.message?.content
    if (!content) return null
    const parsed = JSON.parse(content)
    const caption =
      typeof parsed.caption === 'string' && parsed.caption.trim()
        ? parsed.caption.trim()
        : undefined
    const illustration_prompt =
      typeof parsed.illustration_prompt === 'string' &&
      parsed.illustration_prompt.trim()
        ? parsed.illustration_prompt.trim()
        : undefined
    return { caption, illustration_prompt }
  } catch (error) {
    console.error('[polish-agent] failed:', error)
    return null
  }
}


