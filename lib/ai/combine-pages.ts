type RawPage = {
  page_number?: number
  milestone_code?: string
  category?: string | null
  display_text?: string
  narrative_text?: string
  visual_flag?: string
  status?: string
  illustration_prompts?: string[]
}

export type VerifiedLite = {
  milestone_code: string
  celebration_narrative?: string
  concern_narrative?: string
  parental_encouragement?: string
  red_flag_icon?: string | null
  storybook_scene_description?: string
}

export type CombinedPage = {
  page_number: number
  category: string | null
  status: 'met' | 'missed'
  display_text: string
  narrative_text: string
  visual_flag?: string
  illustration_prompts?: string[]
  items?: Array<{
    milestone_code?: string
    display_text?: string
    micro_narrative?: string
    visual_flag?: string
  }>
}

type CombineOptions = {
  maxPages: number
  maxItemsPerPage: number
  prioritize: 'missed-first' | 'balanced'
}

const DEFAULTS: CombineOptions = {
  maxPages: Number(process.env.STORYBOOK_MAX_PAGES) > 0
    ? Number(process.env.STORYBOOK_MAX_PAGES)
    : 15,
  maxItemsPerPage:
    Number(process.env.COMBINE_MAX_ITEMS_PER_PAGE) > 0
      ? Number(process.env.COMBINE_MAX_ITEMS_PER_PAGE)
      : 3,
  prioritize:
    (process.env.COMBINE_PRIORITIZE as 'missed-first' | 'balanced') ??
    'missed-first',
}

function normalizeStatus(status?: string): 'met' | 'missed' {
  const s = String(status ?? '').toLowerCase()
  return s === 'met' ? 'met' : 'missed'
}

function isValidText(text?: string | null): boolean {
  if (!text) return false
  const t = text.trim()
  if (!t) return false
  const upper = t.toUpperCase()
  if (upper.includes('TBD') || upper.includes('T.B.D')) return false
  if (t.length < 3) return false
  return true
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size))
  }
  return out
}

function buildIllustrationPrompt(
  category: string | null,
  items: RawPage[],
  lookup?: Map<string, VerifiedLite>
) {
  // PRIMARY: Collect CDC storybook_scene_description from all items
  const sceneSnippets: string[] = []
  if (lookup) {
    for (const it of items) {
      const v = it.milestone_code ? lookup.get(it.milestone_code) : undefined
      if (v?.storybook_scene_description) {
        sceneSnippets.push(v.storybook_scene_description)
      }
    }
  }

  const parts: string[] = []

  // If we have CDC scene descriptions, use them as the PRIMARY content
  if (sceneSnippets.length > 0) {
    // Combine multiple scene descriptions into one coherent visual
    const combined = sceneSnippets.slice(0, 3).join('; ')
    parts.push(`Cozy, joyful scene: ${combined}.`)
  } else {
    // Fallback: Use display text labels if no CDC descriptions available
    const labels = items
      .map((i) => i.display_text)
      .filter(Boolean)
      .slice(0, 3)
      .join(', ')
    if (labels) {
      parts.push(`Cozy, joyful playroom scene depicting: ${labels}.`)
    } else {
      parts.push('Cozy, joyful playroom scene with inclusive, child-safe visuals.')
    }
  }

  // Add consistent styling elements
  parts.push('Inclusive, child-safe visuals with natural light.')
  if (category) {
    parts.push(`Theme: ${category}.`)
  }
  parts.push('Warm colors, gentle composition.')
  // CRITICAL: Explicitly forbid text in images
  parts.push('IMPORTANT: No text, words, letters, numbers, or written content of any kind should appear in this image. Pure visual illustration only.')
  return parts.join(' ')
}

export function combinePages(
  rawPages: RawPage[],
  options?: Partial<CombineOptions>,
  verified?: VerifiedLite[]
): CombinedPage[] {
  const cfg: CombineOptions = { ...DEFAULTS, ...(options ?? {}) }
  const lookup =
    verified && verified.length
      ? new Map<string, VerifiedLite>(
          verified
            .filter((v) => v && v.milestone_code)
            .map((v) => [v.milestone_code, v])
        )
      : undefined

  // Group by category and status
  const buckets: Record<
    string,
    { met: RawPage[]; missed: RawPage[] }
  > = {}
  for (const p of rawPages) {
    const category = p.category ?? 'General'
    if (!buckets[category]) buckets[category] = { met: [], missed: [] }
    buckets[category][normalizeStatus(p.status)].push(p)
  }

  const orderedCategories = Object.keys(buckets)
  const output: CombinedPage[] = []
  // Track narratives used across ALL pages to ensure uniqueness
  const usedNarratives = new Set<string>()

  // Helper to push combined groups respecting maxPages
  const pushGroups = (category: string, status: 'met' | 'missed') => {
    if (output.length >= cfg.maxPages) return
    const items = buckets[category][status]
    if (!items.length) return
    const groups = chunk(items, cfg.maxItemsPerPage)
    let seq = 1
    for (const group of groups) {
      if (output.length >= cfg.maxPages) break
      const baseTitle =
        status === 'missed' ? `${category}: Needs Support` : `${category}: Celebrations`
      const title = groups.length > 1 ? `${baseTitle} (${seq})` : baseTitle
      const labelList = group
        .map((g) => g.display_text)
        .filter(Boolean)
        .slice(0, cfg.maxItemsPerPage)
        .join(', ')
      // Build caption from verified narratives when possible
      // Ensure uniqueness by tracking used narratives and prioritizing distinct ones
      let caption = ''
      
      if (status === 'missed') {
        const phrases: string[] = []
        for (const g of group) {
          const v = g.milestone_code ? lookup?.get(g.milestone_code) : undefined
          // Only add narratives that haven't been used before
          if (isValidText(v?.concern_narrative) && !usedNarratives.has(v.concern_narrative)) {
            phrases.push(v.concern_narrative)
            usedNarratives.add(v.concern_narrative)
          }
          if (isValidText(v?.parental_encouragement) && !usedNarratives.has(v.parental_encouragement)) {
            phrases.push(v.parental_encouragement)
            usedNarratives.add(v.parental_encouragement)
          }
          if (phrases.length >= 2) break
        }
        // If we still don't have enough unique content, use milestone-specific text
        if (phrases.length === 0 && labelList) {
          caption = `Focus areas: ${labelList}. Gentle daily practice and caregiver engagement will help.`
        } else if (phrases.length === 0) {
          caption = 'Gentle areas to support right now. Try daily play and caregiver engagement.'
        } else {
          caption = phrases.slice(0, 2).join(' ')
        }
      } else {
        const wins: string[] = []
        for (const g of group) {
          const v = g.milestone_code ? lookup?.get(g.milestone_code) : undefined
          // Only add narratives that haven't been used before
          if (isValidText(v?.celebration_narrative) && !usedNarratives.has(v.celebration_narrative)) {
            wins.push(v.celebration_narrative)
            usedNarratives.add(v.celebration_narrative)
          }
          if (wins.length >= 2) break
        }
        // If we still don't have enough unique content, use milestone-specific text
        if (wins.length === 0 && labelList) {
          caption = `Highlights: ${labelList}. Keep encouraging these moments.`
        } else if (wins.length === 0) {
          caption = 'Wonderful progress to celebrate! Keep encouraging these moments.'
        } else {
          caption = wins.slice(0, 2).join(' ')
        }
      }

      output.push({
        page_number: 0, // will reindex later
        category,
        status,
        display_text: title,
        narrative_text: caption,
        illustration_prompts: [buildIllustrationPrompt(category, group, lookup)],
        items: group.map((g) => ({
          milestone_code: g.milestone_code,
          display_text: g.display_text,
          micro_narrative: (() => {
            const v = g.milestone_code ? lookup?.get(g.milestone_code) : undefined
            if (isValidText(v?.celebration_narrative)) return v!.celebration_narrative!
            if (isValidText(v?.concern_narrative)) return v!.concern_narrative!
            if (isValidText(v?.parental_encouragement)) return v!.parental_encouragement!
            return g.narrative_text
          })(),
          visual_flag: g.visual_flag,
        })),
      })
      seq += 1
    }
  }

  // Strategy: missed-first or balanced
  if (cfg.prioritize === 'missed-first') {
    for (const c of orderedCategories) {
      pushGroups(c, 'missed')
    }
    for (const c of orderedCategories) {
      pushGroups(c, 'met')
    }
  } else {
    for (const c of orderedCategories) {
      pushGroups(c, 'missed')
      pushGroups(c, 'met')
    }
  }

  // Reindex page numbers
  return output.map((p, idx) => ({ ...p, page_number: idx + 1 }))
}


