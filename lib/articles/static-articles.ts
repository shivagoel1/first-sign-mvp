/**
 * Static article resources for milestone support
 * These articles are shown when a milestone needs support (status: 'missed')
 * Articles are matched by category (Motor, Language/Communication, Social-Emotional, Cognitive)
 */

export type ArticleResource = {
  title: string
  url: string
  source: 'CDC' | 'HealthyChildren' | 'AAP' | 'Other'
  description?: string
  ageRange?: {
    minMonths?: number
    maxMonths?: number
  }
}

export const STATIC_ARTICLES: Record<string, ArticleResource[]> = {
  'Motor': [
    {
      title: 'CDC: Learn the Signs. Act Early.',
      url: 'https://www.cdc.gov/ncbddd/actearly/index.html',
      source: 'CDC',
      description: 'Resources to help you track your child\'s developmental milestones',
    },
    {
      title: 'CDC: Act Early - Milestones',
      url: 'https://www.cdc.gov/ncbddd/actearly/',
      source: 'CDC',
      description: 'Learn about developmental milestones and when to act early',
    },
    {
      title: 'Supporting Your Baby\'s Motor Development',
      url: '#', // Replace with your app article URL when available
      source: 'HealthyChildren',
      description: 'Practical tips and activities to support your baby\'s motor skills development',
    },
  ],
  'Language/Communication': [
    {
      title: 'CDC: Learn the Signs. Act Early.',
      url: 'https://www.cdc.gov/ncbddd/actearly/index.html',
      source: 'CDC',
      description: 'Resources to help you track your child\'s developmental milestones',
    },
    {
      title: 'CDC: Act Early - Milestones',
      url: 'https://www.cdc.gov/ncbddd/actearly/',
      source: 'CDC',
      description: 'Learn about developmental milestones and when to act early',
    },
    {
      title: 'Building Language Skills Through Daily Activities',
      url: '#', // Replace with your app article URL when available
      source: 'HealthyChildren',
      description: 'Simple ways to encourage language development in everyday moments',
    },
  ],
  'Social-Emotional': [
    {
      title: 'CDC: Learn the Signs. Act Early.',
      url: 'https://www.cdc.gov/ncbddd/actearly/index.html',
      source: 'CDC',
      description: 'Resources to help you track your child\'s developmental milestones',
    },
    {
      title: 'CDC: Act Early - Milestones',
      url: 'https://www.cdc.gov/ncbddd/actearly/',
      source: 'CDC',
      description: 'Learn about developmental milestones and when to act early',
    },
    {
      title: 'Supporting Your Child\'s Emotional Development',
      url: '#', // Replace with your app article URL when available
      source: 'HealthyChildren',
      description: 'Ways to nurture your child\'s emotional well-being and social skills',
    },
  ],
  'Cognitive': [
    {
      title: 'CDC: Learn the Signs. Act Early.',
      url: 'https://www.cdc.gov/ncbddd/actearly/index.html',
      source: 'CDC',
      description: 'Resources to help you track your child\'s developmental milestones',
    },
    {
      title: 'CDC: Act Early - Milestones',
      url: 'https://www.cdc.gov/ncbddd/actearly/',
      source: 'CDC',
      description: 'Learn about developmental milestones and when to act early',
    },
    {
      title: 'Play-Based Learning for Infants',
      url: '#', // Replace with your app article URL when available
      source: 'HealthyChildren',
      description: 'How play supports cognitive development and learning in babies',
    },
  ],
}

/**
 * Get recommended articles for a given category (static fallback)
 * Only returns articles for milestones that need support (status: 'missed')
 */
export function getRecommendedArticles(
  category: string | null,
  ageMonths?: number,
  limit: number = 3
): ArticleResource[] {
  // Don't show articles for milestones that are met
  if (!category) {
    return []
  }

  const categoryArticles = STATIC_ARTICLES[category] || []
  
  // Filter out placeholder URLs (articles with '#' as URL are not ready)
  const validArticles = categoryArticles.filter(article => article.url && article.url !== '#')
  
  if (validArticles.length === 0) {
    console.warn(`[static-articles] No valid articles found for category: ${category}`)
    return []
  }
  
  // Filter by age range if provided
  let filtered = validArticles
  if (ageMonths !== undefined) {
    filtered = validArticles.filter(article => {
      if (!article.ageRange) return true // Include articles without age restrictions
      const { minMonths, maxMonths } = article.ageRange
      if (minMonths !== undefined && ageMonths < minMonths) return false
      if (maxMonths !== undefined && ageMonths > maxMonths) return false
      return true
    })
  }

  // If no age-filtered results, fall back to all valid articles for the category
  if (filtered.length === 0) {
    filtered = validArticles
  }

  // Return up to the limit, prioritizing CDC articles first
  const sorted = filtered.sort((a, b) => {
    // CDC articles first, then HealthyChildren, then AAP, then Other
    const sourceOrder = { CDC: 0, HealthyChildren: 1, AAP: 2, Other: 3 }
    return (sourceOrder[a.source] || 3) - (sourceOrder[b.source] || 3)
  })

  return sorted.slice(0, limit)
}

