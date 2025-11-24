import { getHybridArticleRecommendations } from '@/lib/articles/article-agent'

type RawPage = {
  page_number?: number
  milestone_code?: string
  category?: string | null
  display_text?: string
  narrative_text?: string
  visual_flag?: string
  status?: string
  illustration_prompts?: string[]
  age_months?: number | null
}

export type VerifiedLite = {
  milestone_code: string
  celebration_narrative?: string
  concern_narrative?: string
  parental_encouragement?: string
  red_flag_icon?: string | null
  storybook_scene_description?: string
  age_months?: number | null
}

export type CombinedPage = {
  page_number: number
  category: string | null
  status: 'met' | 'missed'
  display_text: string
  narrative_text: string
  visual_flag?: string
  illustration_prompts?: string[]
  recommended_articles?: Array<{
    title: string
    url: string
    source: string
    description?: string
  }>
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

// Helper function to sanitize text - remove control characters and normalize whitespace
function sanitizeText(text: string | null | undefined): string {
  if (!text) return ''
  return text
    .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Remove control characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
}

function isValidText(text?: string | null): boolean {
  if (!text) return false
  const t = sanitizeText(text)
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

export async function combinePages(
  rawPages: RawPage[],
  options?: Partial<CombineOptions>,
  verified?: VerifiedLite[]
): Promise<CombinedPage[]> {
  const cfg: CombineOptions = { ...DEFAULTS, ...(options ?? {}) }
  
  console.log(`[combine-pages] Input: ${rawPages.length} raw pages, maxPages: ${cfg.maxPages}, maxItemsPerPage: ${cfg.maxItemsPerPage}`)
  
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
  
  console.log(`[combine-pages] Buckets: ${Object.keys(buckets).length} categories`)
  for (const [category, statusGroups] of Object.entries(buckets)) {
    console.log(`[combine-pages] Category "${category}": ${statusGroups.met.length} met, ${statusGroups.missed.length} missed`)
  }

  const orderedCategories = Object.keys(buckets)
  const output: CombinedPage[] = []
  // Track narratives used across ALL pages to ensure uniqueness
  const usedNarratives = new Set<string>()

  // Helper to push combined groups respecting maxPages
  const pushGroups = async (category: string, status: 'met' | 'missed') => {
    if (output.length >= cfg.maxPages) {
      console.log(`[combine-pages] Max pages (${cfg.maxPages}) reached, skipping ${category} ${status}`)
      return
    }
    const items = buckets[category][status]
    if (!items.length) return
    const groups = chunk(items, cfg.maxItemsPerPage)
    console.log(`[combine-pages] Creating ${groups.length} page(s) for ${category} ${status} (${items.length} items, ${cfg.maxItemsPerPage} per page)`)
    let seq = 1
    for (const group of groups) {
      if (output.length >= cfg.maxPages) {
        console.log(`[combine-pages] Max pages reached at group ${seq} of ${groups.length}`)
        break
      }
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
          // Only add narratives that haven't been used before (sanitize before using)
          if (v && isValidText(v.concern_narrative)) {
            const sanitized = sanitizeText(v.concern_narrative!)
            if (!usedNarratives.has(sanitized)) {
              phrases.push(sanitized)
              usedNarratives.add(sanitized)
            }
          }
          if (v && isValidText(v.parental_encouragement)) {
            const sanitized = sanitizeText(v.parental_encouragement!)
            if (!usedNarratives.has(sanitized)) {
              phrases.push(sanitized)
              usedNarratives.add(sanitized)
            }
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
          // Only add narratives that haven't been used before (sanitize before using)
          if (v && isValidText(v.celebration_narrative)) {
            const sanitized = sanitizeText(v.celebration_narrative!)
            if (!usedNarratives.has(sanitized)) {
              wins.push(sanitized)
              usedNarratives.add(sanitized)
            }
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

      // Get recommended articles for "needs support" pages using AI agent
      let recommendedArticles: CombinedPage['recommended_articles'] = undefined
      if (status === 'missed' && category) {
        try {
          // Get age from first verified milestone in the group
          const firstMilestone = group[0]
          const firstVerified = firstMilestone?.milestone_code ? lookup?.get(firstMilestone.milestone_code) : undefined
          const ageMonths = firstVerified?.age_months ?? group[0]?.age_months ?? undefined
          
          // Build comprehensive milestone description from group items
          // Include both display_text and any narrative text for better context
          const milestoneDescriptions: string[] = []
          
          for (const g of group) {
            if (g.display_text) {
              milestoneDescriptions.push(g.display_text)
            }
            // Also include narrative text if available for more context
            if (g.narrative_text && milestoneDescriptions.length < 5) {
              const narrative = g.narrative_text.substring(0, 50) // First 50 chars
              if (narrative && !milestoneDescriptions.includes(narrative)) {
                milestoneDescriptions.push(narrative)
              }
            }
          }
          
          // Get verified milestone details for even better context
          const verifiedDetails: string[] = []
          for (const g of group) {
            const v = g.milestone_code ? lookup?.get(g.milestone_code) : undefined
            if (v) {
              // Add concern narrative if available
              if (v.concern_narrative && verifiedDetails.length < 3) {
                const concern = v.concern_narrative.substring(0, 60)
                if (concern && !verifiedDetails.includes(concern)) {
                  verifiedDetails.push(concern)
                }
              }
            }
          }
          
          // Combine all context for the AI agent
          const milestoneDescription = [
            ...milestoneDescriptions.slice(0, 3),
            ...verifiedDetails.slice(0, 2)
          ].filter(Boolean).join('. ')
          
          // Get milestone code from first item in group (for database article lookup)
          const firstMilestoneCode = group[0]?.milestone_code
          
          // Use AI agent to get recommended articles with comprehensive context
          const articles = await getHybridArticleRecommendations(
            {
              category,
              ageMonths,
              milestoneCode: firstMilestoneCode, // Pass milestone code for database lookup
              milestoneDescription: milestoneDescription || `${category} development support needed`,
              status: 'missed',
            },
            1, // Minimum 1 article
            3  // Maximum 3 articles
          )
          
          if (articles.length > 0) {
            recommendedArticles = articles.map(a => ({
              title: a.title,
              url: a.url,
              source: a.source,
              description: a.description,
            }))
            console.log(`[combine-pages] AI agent added ${articles.length} recommended articles for ${category} (needs support)`)
          }
        } catch (error) {
          console.error(`[combine-pages] Error fetching articles for ${category}:`, error)
          // Continue without articles if AI agent fails
        }
      }

      output.push({
        page_number: 0, // will reindex later
        category,
        status,
        display_text: title,
        narrative_text: caption,
        illustration_prompts: [buildIllustrationPrompt(category, group, lookup)],
        recommended_articles: recommendedArticles,
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
  // Always prioritize missed (needs support) pages first, then celebration (met) pages
  if (cfg.prioritize === 'missed-first') {
    // Process all missed pages first across all categories
    for (const c of orderedCategories) {
      await pushGroups(c, 'missed')
    }
    // Then process all met (celebration) pages across all categories
    for (const c of orderedCategories) {
      await pushGroups(c, 'met')
    }
  } else {
    // Balanced: alternate between missed and met within each category
    for (const c of orderedCategories) {
      await pushGroups(c, 'missed')
      await pushGroups(c, 'met')
    }
  }

  // Log the order before reindexing
  console.log(`[combine-pages] Page order before reindexing:`)
  output.forEach((p, idx) => {
    console.log(`  ${idx + 1}. ${p.category} - ${p.status} - "${p.display_text}"`)
  })

  // Reindex page numbers sequentially (1, 2, 3, ...)
  // This ensures proper numbering: all "missed" pages first, then all "met" pages
  const finalPages = output.map((p, idx) => ({ ...p, page_number: idx + 1 }))
  console.log(`[combine-pages] Output: ${finalPages.length} combined pages`)
  console.log(`[combine-pages] Final page order:`)
  finalPages.forEach((p) => {
    console.log(`  Page ${p.page_number}: ${p.category} - ${p.status} - "${p.display_text}"`)
  })
  return finalPages
}


