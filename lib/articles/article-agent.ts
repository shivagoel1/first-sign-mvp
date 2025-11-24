/**
 * AI-Powered Article Recommendation Agent
 * 
 * This agent uses AI to intelligently discover, evaluate, and recommend
 * relevant articles for milestones that need support.
 */

import OpenAI from 'openai'
import { getRecommendedArticles as getStaticArticles, type ArticleResource } from './static-articles'
import { createAdminClient } from '@/lib/supabase/admin'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export type ArticleRecommendation = {
  title: string
  url: string
  source: 'CDC' | 'HealthyChildren' | 'AAP' | 'Other'
  description: string
  relevanceScore?: number
  ageRange?: {
    minMonths?: number
    maxMonths?: number
  }
  articleId?: string // Database article ID (if from database)
}

export type ArticleSearchParams = {
  category: string
  ageMonths?: number
  milestoneDescription?: string
  milestoneCode?: string
  status: 'met' | 'missed'
}

// Cache for article recommendations to avoid repeated API calls
const articleCache = new Map<string, {
  articles: ArticleRecommendation[]
  timestamp: number
}>()

const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

/**
 * Main function to get recommended articles using AI agent
 * Can be disabled via USE_AI_ARTICLE_AGENT environment variable
 * 
 * Note: This function may return fewer articles than requested if some are invalid.
 * Use getHybridArticleRecommendations for guaranteed valid articles (1-3).
 */
export async function getRecommendedArticlesWithAI(
  params: ArticleSearchParams,
  limit: number = 3
): Promise<ArticleRecommendation[]> {
  // Only show articles for milestones that need support
  if (params.status === 'met') {
    return []
  }

  // Check if AI agent is enabled (default: true)
  const useAIAgent = process.env.USE_AI_ARTICLE_AGENT !== 'false'
  
  if (!useAIAgent) {
    console.log('[article-agent] AI agent disabled, using static articles')
    const staticArticles = getStaticArticles(params.category, params.ageMonths, limit)
    return staticArticles.map(a => ({
      title: a.title,
      url: a.url,
      source: a.source,
      description: a.description || '',
      ageRange: a.ageRange,
    }))
  }

  // Check cache first
  const cacheKey = `${params.category}_${params.ageMonths ?? 'any'}_${params.milestoneDescription ?? ''}`
  const cached = articleCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    console.log('[article-agent] Using cached articles for:', cacheKey)
    return cached.articles.slice(0, limit)
  }

  try {
    // Use AI agent to find and evaluate articles
    const articles = await discoverAndEvaluateArticles(params, limit)
    
    // If AI returns articles, use them
    if (articles.length > 0) {
      // Cache the results
      articleCache.set(cacheKey, {
        articles,
        timestamp: Date.now(),
      })

      console.log(`[article-agent] Successfully discovered ${articles.length} articles for ${params.category}`)
      return articles
    } else {
      // AI returned empty array, fall back to static
      console.log('[article-agent] AI returned no articles, falling back to static articles')
      const staticArticles = getStaticArticles(params.category, params.ageMonths, limit)
      if (staticArticles.length > 0) {
        return staticArticles.map(a => ({
          title: a.title,
          url: a.url,
          source: a.source,
          description: a.description || '',
          ageRange: a.ageRange,
        }))
      }
      return []
    }
  } catch (error) {
    console.error('[article-agent] AI article discovery failed, falling back to static articles:', error)
    // Fallback to static articles if AI fails
    const staticArticles = getStaticArticles(params.category, params.ageMonths, limit)
    if (staticArticles.length > 0) {
      return staticArticles.map(a => ({
        title: a.title,
        url: a.url,
        source: a.source,
        description: a.description || '',
        ageRange: a.ageRange,
      }))
    }
    // If static articles also fail, return empty array (graceful degradation)
    console.warn(`[article-agent] No static articles available for category: ${params.category}`)
    return []
  }
}

/**
 * AI Agent that discovers and evaluates articles
 */
async function discoverAndEvaluateArticles(
  params: ArticleSearchParams,
  limit: number
): Promise<ArticleRecommendation[]> {
  const { category, ageMonths, milestoneDescription } = params

  // Build a comprehensive prompt for the AI agent
  const ageContext = ageMonths 
    ? `The child is ${ageMonths} months old. Focus on resources appropriate for this age range (${Math.max(0, ageMonths - 3)}-${ageMonths + 3} months).`
    : 'Age not specified. Provide general developmental resources.'

  const prompt = `You are an expert pediatric development resource curator with deep knowledge of CDC resources, medical literature, and evidence-based parenting resources.

TASK: Recommend ${limit} high-quality, authoritative articles/resources for parents whose child needs support in ${category} development.

CONTEXT:
- Development Category: ${category}
- ${ageContext}
- Specific Focus: ${milestoneDescription || 'General support and development in this area'}

REQUIREMENTS:
1. Prioritize these sources in order:
   a. CDC (Centers for Disease Control) - "Learn the Signs. Act Early." materials
   b. American Academy of Pediatrics (AAP) resources
   c. Other reputable medical/developmental organizations
   d. Evidence-based parenting resources

2. For each article, you MUST provide:
   - Exact, real article title (as it appears on the website)
   - Complete, working URL (must start with https://)
   - Source type: "CDC", "APP", or "EXTERNAL"
   - Clear, helpful description (1-2 sentences explaining why this resource is valuable)
   - Relevance score (0-100, where 100 = perfectly matches the child's needs)
   - Optional: age range if article is specific to certain ages

3. URL VALIDATION:
   - Only use URLs you know exist and are publicly accessible
   - CDC URLs should be from cdc.gov/ncbddd/actearly/ or cdc.gov/ncbddd/childdevelopment/
   - AAP URLs should be from healthychildren.org
   - Do NOT make up or guess URLs
   - If unsure about a URL, use a known CDC resource instead

4. QUALITY STANDARDS:
   - Articles must be evidence-based and from reputable sources
   - Descriptions should be specific and actionable
   - Focus on resources that help parents understand and support their child
   - Avoid generic or commercial content

KNOWN CDC RESOURCES (use these as examples):
- Motor: https://www.cdc.gov/ncbddd/actearly/milestones/physical-milestones.html
- Language: https://www.cdc.gov/ncbddd/actearly/milestones/communication-milestones.html
- Social-Emotional: https://www.cdc.gov/ncbddd/actearly/milestones/social-emotional-milestones.html
- Cognitive: https://www.cdc.gov/ncbddd/actearly/milestones/cognitive-milestones.html
- General: https://www.cdc.gov/ncbddd/actearly/milestones/index.html

Return your recommendations as JSON with this exact structure:
{
  "articles": [
    {
      "title": "Exact article title from the website",
      "url": "https://complete-working-url-here",
      "source": "CDC" | "HealthyChildren" | "AAP" | "Other",
      "description": "1-2 sentence description explaining the value of this resource",
      "relevanceScore": 85,
      "ageRange": { "minMonths": 0, "maxMonths": 12 }
    }
  ]
}

CRITICAL: Only return real URLs that you can verify exist. Prioritize CDC resources.`

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are a pediatric development resource expert specializing in CDC materials and evidence-based child development resources. 
          
Your expertise includes:
- CDC "Learn the Signs. Act Early." milestone materials
- American Academy of Pediatrics resources
- Evidence-based developmental interventions
- Age-appropriate support strategies

CRITICAL RULES:
1. Only return URLs that you can verify exist
2. Prioritize CDC resources (cdc.gov/ncbddd/actearly/)
3. Use exact article titles as they appear on websites
4. Provide specific, actionable descriptions
5. Always return valid JSON format`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.2, // Very low temperature for factual, consistent results
      max_tokens: 1500, // Enough tokens for multiple article recommendations
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      throw new Error('No content returned from AI agent')
    }

    const parsed = JSON.parse(content) as { articles: ArticleRecommendation[] }
    const articles = parsed.articles || []

    // Validate and filter articles
    const validatedArticles = await validateAndRankArticles(articles, params)

    console.log(`[article-agent] AI discovered ${validatedArticles.length} articles for ${category}`)
    return validatedArticles.slice(0, limit)
  } catch (error) {
    console.error('[article-agent] Error in AI article discovery:', error)
    throw error
  }
}

/**
 * Check if a URL is accessible (not a 404 or error page)
 * Uses HEAD request for efficiency, falls back to GET if needed
 * IMPORTANT: This function properly detects 404 errors
 */
export async function isUrlAccessible(url: string, timeoutMs: number = 5000): Promise<boolean> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    // Try HEAD request first (more efficient)
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; FirstSignFirst/1.0; +https://firstsignfirst.com)',
        },
        redirect: 'follow',
      })
      clearTimeout(timeoutId)
      
      // Check for 404 explicitly - this is the main issue
      if (response.status === 404) {
        console.warn(`[article-agent] URL returned 404: ${url}`)
        return false
      }
      
      // Consider 2xx as accessible (200-299)
      if (response.ok) {
        return true
      }
      
      // Consider 3xx redirects as accessible (they redirect to valid pages)
      if (response.status >= 300 && response.status < 400) {
        return true
      }
      
      // If HEAD doesn't work (405 Method Not Allowed or 501 Not Implemented), try GET
      if (response.status === 405 || response.status === 501) {
        const getResponse = await fetch(url, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; FirstSignFirst/1.0; +https://firstsignfirst.com)',
          },
          redirect: 'follow',
        })
        clearTimeout(timeoutId)
        
        // Check for 404 in GET response too
        if (getResponse.status === 404) {
          console.warn(`[article-agent] URL returned 404 (GET): ${url}`)
          return false
        }
        
        return getResponse.ok || (getResponse.status >= 300 && getResponse.status < 400)
      }
      
      // Any other status (400, 403, 500, etc.) is considered inaccessible
      console.warn(`[article-agent] URL returned status ${response.status}: ${url}`)
      return false
    } catch (headError) {
      clearTimeout(timeoutId)
      // If HEAD fails, try GET as fallback
      const getController = new AbortController()
      const getTimeoutId = setTimeout(() => getController.abort(), timeoutMs)
      
      try {
        const getResponse = await fetch(url, {
          method: 'GET',
          signal: getController.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; FirstSignFirst/1.0; +https://firstsignfirst.com)',
          },
          redirect: 'follow',
        })
        clearTimeout(getTimeoutId)
        
        // Check for 404 in GET response
        if (getResponse.status === 404) {
          console.warn(`[article-agent] URL returned 404 (GET fallback): ${url}`)
          return false
        }
        
        return getResponse.ok || (getResponse.status >= 300 && getResponse.status < 400)
      } catch {
        clearTimeout(getTimeoutId)
        return false
      }
    }
  } catch (error) {
    // Network errors, timeouts, etc. - treat as inaccessible
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn(`[article-agent] URL check timeout for: ${url}`)
    } else {
      console.warn(`[article-agent] URL check failed for: ${url}`, error instanceof Error ? error.message : 'Unknown error')
    }
    return false
  }
}

/**
 * Validate articles and ensure URLs are accessible
 * Rank by relevance score
 */
async function validateAndRankArticles(
  articles: ArticleRecommendation[],
  params: ArticleSearchParams
): Promise<ArticleRecommendation[]> {
  const validated: ArticleRecommendation[] = []

  // Validate articles in parallel (with concurrency limit to avoid overwhelming servers)
  const validationPromises = articles.map(async (article) => {
    // Basic validation
    if (!article.title || !article.url) {
      console.warn('[article-agent] Skipping article with missing title or URL')
      return null
    }

    // Validate URL format
    try {
      new URL(article.url)
    } catch {
      console.warn('[article-agent] Skipping article with invalid URL format:', article.url)
      return null
    }

    // Check age range if specified
    if (params.ageMonths && article.ageRange) {
      const { minMonths, maxMonths } = article.ageRange
      if (minMonths !== undefined && params.ageMonths < minMonths) return null
      if (maxMonths !== undefined && params.ageMonths > maxMonths) return null
    }

    // Check if URL is accessible (not a 404)
    const isAccessible = await isUrlAccessible(article.url)
    if (!isAccessible) {
      console.warn(`[article-agent] Skipping article with inaccessible URL (404 or error): ${article.url}`)
      return null
    }

    // Ensure description exists
    if (!article.description) {
      article.description = `Learn more about ${params.category} development and how to support your child.`
    }

    return article
  })

  // Wait for all validations to complete
  const results = await Promise.all(validationPromises)
  
  // Filter out null results (invalid articles)
  for (const result of results) {
    if (result) {
      validated.push(result)
    }
  }

  // Sort by relevance score (higher is better), then by source priority (CDC > HealthyChildren > AAP > Other)
  const sourcePriority = { CDC: 4, HealthyChildren: 3, AAP: 2, Other: 1 }
  validated.sort((a, b) => {
    const scoreA = (a.relevanceScore ?? 50) + (sourcePriority[a.source] ?? 0) * 10
    const scoreB = (b.relevanceScore ?? 50) + (sourcePriority[b.source] ?? 0) * 10
    return scoreB - scoreA
  })

  console.log(`[article-agent] Validated ${validated.length} out of ${articles.length} articles (filtered ${articles.length - validated.length} invalid/ inaccessible URLs)`)
  return validated
}

/**
 * Validate static articles to ensure URLs are accessible
 * This is done asynchronously to avoid blocking, but we validate in parallel
 */
async function validateStaticArticles(
  articles: ArticleResource[]
): Promise<ArticleRecommendation[]> {
  const validationPromises = articles.map(async (article): Promise<ArticleRecommendation | null> => {
    // Skip placeholder URLs
    if (!article.url || article.url === '#') {
      return null
    }

    // Check if URL is accessible
    const isAccessible = await isUrlAccessible(article.url)
    if (!isAccessible) {
      console.warn(`[article-agent] Static article URL is inaccessible (404 or error): ${article.url}`)
      return null
    }

    const recommendation: ArticleRecommendation = {
      title: article.title,
      url: article.url,
      source: article.source,
      description: article.description || '',
      ageRange: article.ageRange,
    }
    return recommendation
  })

  const results = await Promise.all(validationPromises)
  return results.filter((article): article is ArticleRecommendation => article !== null)
}

/**
 * Get backup articles from the database (articles table)
 * This queries the static articles stored in Supabase
 */
async function getBackupArticlesFromDatabase(
  category: string,
  ageMonths?: number,
  milestoneCode?: string,
  limit: number = 3
): Promise<ArticleRecommendation[]> {
  try {
    const supabase = createAdminClient()
    
    // Build the query - start with base filters
    let query = supabase
      .from('articles')
      .select('*')
      .eq('category', category)
      .eq('validation_status', 'valid')
      .eq('is_backup', true)
    
    // Add milestone filter: exact match OR category-level (milestone_code IS NULL)
    if (milestoneCode) {
      // Get articles that match this milestone OR are category-level (no specific milestone)
      query = query.or(`milestone_code.eq.${milestoneCode},milestone_code.is.null`)
    } else {
      // No milestone code - only get category-level articles
      query = query.is('milestone_code', null)
    }
    
    // Add age range filter if age is provided
    if (ageMonths !== undefined) {
      // Articles with no age restriction OR articles where age falls within range
      // Note: Supabase PostgREST doesn't support complex OR with AND, so we'll filter in TypeScript
      query = query.or(`age_months_min.is.null,age_months_max.is.null`)
    }
    
    // Order by: priority, then featured, then less used
    query = query
      .order('priority', { ascending: false })
      .order('is_featured', { ascending: false })
      .order('times_used', { ascending: true })
      .limit(limit * 2) // Get more to sort and filter properly
    
    const { data, error } = await query
    
    if (error) {
      console.error('[article-agent] Error fetching backup articles from database:', error)
      return []
    }
    
    if (!data || data.length === 0) {
      console.log(`[article-agent] No backup articles found in database for category: ${category}`)
      return []
    }
    
    // Type assertion for article data (articles table may not be in database.types.ts yet)
    type ArticleRow = {
      id: string
      title: string
      url: string
      source: string
      description: string | null
      milestone_code: string | null
      category: string
      age_months_min: number | null
      age_months_max: number | null
      priority: number
      is_featured: boolean
      times_used: number
    }
    
    // Filter by age range in TypeScript (more reliable than complex SQL)
    const typedData = (data as unknown) as ArticleRow[]
    let filtered = typedData
    if (ageMonths !== undefined) {
      filtered = typedData.filter((article: ArticleRow) => {
        // Include if no age restriction
        if (article.age_months_min === null && article.age_months_max === null) {
          return true
        }
        // Include if age falls within range
        if (article.age_months_min !== null && article.age_months_max !== null) {
          return ageMonths >= article.age_months_min && ageMonths <= article.age_months_max
        }
        // Include if only min is set and age is >= min
        if (article.age_months_min !== null && article.age_months_max === null) {
          return ageMonths >= article.age_months_min
        }
        // Include if only max is set and age is <= max
        if (article.age_months_min === null && article.age_months_max !== null) {
          return ageMonths <= article.age_months_max
        }
        return true
      })
    }
    
    // Sort in TypeScript: exact milestone match first
    const sorted = filtered.sort((a, b) => {
      // Exact milestone match gets priority
      if (milestoneCode) {
        if (a.milestone_code === milestoneCode && b.milestone_code !== milestoneCode) return -1
        if (a.milestone_code !== milestoneCode && b.milestone_code === milestoneCode) return 1
      }
      
      // Then by priority (already sorted by DB, but maintain order)
      if (a.priority !== b.priority) {
        return b.priority - a.priority
      }
      
      // Then by featured
      if (a.is_featured !== b.is_featured) {
        return a.is_featured ? -1 : 1
      }
      
      // Then by times used (less used = better)
      return a.times_used - b.times_used
    })
    
    // Transform to ArticleRecommendation format and validate URLs
    const recommendations: ArticleRecommendation[] = []
    const articleIdsToUpdate: string[] = []
    
    for (const article of sorted.slice(0, limit)) {
      // Quick validation - check if URL is accessible
      const isAccessible = await isUrlAccessible(article.url)
      if (!isAccessible) {
        console.warn(`[article-agent] Skipping database article with inaccessible URL: ${article.url}`)
        continue
      }
      
      // Map source from database to ArticleRecommendation type
      // Database uses: 'CDC' | 'HealthyChildren' | 'AAP' | 'Other'
      // Type uses the same values, so direct mapping
      const source: 'CDC' | 'HealthyChildren' | 'AAP' | 'Other' = 
        (article.source === 'CDC' || article.source === 'HealthyChildren' || 
         article.source === 'AAP' || article.source === 'Other')
          ? article.source as 'CDC' | 'HealthyChildren' | 'AAP' | 'Other'
          : 'Other'
      
      recommendations.push({
        title: article.title,
        url: article.url,
        source: source,
        description: article.description || '',
        relevanceScore: article.priority,
        ageRange: article.age_months_min || article.age_months_max
          ? {
              minMonths: article.age_months_min ?? undefined,
              maxMonths: article.age_months_max ?? undefined,
            }
          : undefined,
        articleId: article.id, // Include article ID for logging
      })
      
      articleIdsToUpdate.push(article.id)
    }
    
    // Update usage statistics for articles we're returning (async, don't wait)
    if (articleIdsToUpdate.length > 0) {
      // Update usage statistics asynchronously (non-blocking)
      // We'll use a simple approach: update each article individually
      Promise.all(
        articleIdsToUpdate.map(async (articleId) => {
          try {
            // First, get current times_used value
            const { data: currentData, error: fetchError } = await supabase
              .from('articles')
              .select('times_used')
              .eq('id', articleId)
              .single()
            
            if (fetchError || !currentData) {
              console.warn(`[article-agent] Could not fetch current usage for article ${articleId}:`, fetchError)
              return
            }
            
            // Type assertion for currentData
            type ArticleUsageData = { times_used: number | null }
            const usageData = currentData as unknown as ArticleUsageData
            
            // Then update with incremented value
            const updatePayload: { times_used: number; last_used_at: string } = {
              times_used: (usageData.times_used || 0) + 1,
              last_used_at: new Date().toISOString()
            }
            const { error: updateError } = await supabase
              .from('articles')
              .update(updatePayload as never)
              .eq('id', articleId)
            
            if (updateError) {
              console.warn(`[article-agent] Could not update usage for article ${articleId}:`, updateError)
            }
          } catch (err) {
            console.error(`[article-agent] Error updating article ${articleId} usage:`, err)
          }
        })
      )
        .then(() => {
          console.log(`[article-agent] Updated usage count for ${articleIdsToUpdate.length} database articles`)
        })
        .catch((err: unknown) => {
          console.error('[article-agent] Error in batch article usage update:', err)
        })
    }
    
    console.log(`[article-agent] Found ${recommendations.length} valid backup articles from database for category: ${category}`)
    return recommendations
  } catch (error) {
    console.error('[article-agent] Error in getBackupArticlesFromDatabase:', error)
    return []
  }
}

/**
 * Hybrid approach: Prioritize database backup articles, then AI-discovered, then static
 * This ensures we use curated, validated articles first before searching externally
 * 
 * Priority Order:
 * 1. Database backup articles (curated, validated, high quality)
 * 2. AI-discovered articles (external sources found via AI)
 * 3. Static fallback articles (hardcoded defaults)
 * 
 * Returns 1-3 valid articles:
 * - Requests more articles initially (5-6) to account for invalid ones
 * - Validates all articles
 * - Returns up to 3 valid articles, ensuring at least 1 if possible
 */
export async function getHybridArticleRecommendations(
  params: ArticleSearchParams,
  minArticles: number = 1,
  maxArticles: number = 3
): Promise<ArticleRecommendation[]> {
  // Request more articles initially to account for some being invalid
  // We'll request 1.5x to 2x the max to ensure we get enough valid ones
  const requestCount = Math.max(maxArticles * 2, 6) // Request at least 6, or 2x maxArticles
  
  // Get static articles as baseline (request more to account for invalid ones)
  const staticArticles = getStaticArticles(params.category, params.ageMonths, requestCount)
  
  try {
    // Combine articles in priority order: Database → AI → Static
    const allArticles: ArticleRecommendation[] = []
    const usedUrls = new Set<string>()
    
    // 1. PRIORITY: Add database backup articles FIRST (curated, validated, high quality)
    console.log(`[article-agent] Prioritizing database backup articles for category: ${params.category}`)
    const dbArticles = await getBackupArticlesFromDatabase(
      params.category,
      params.ageMonths,
      params.milestoneCode,
      maxArticles * 2 // Request more to ensure we get enough valid ones
    )
    
    for (const article of dbArticles) {
      if (!usedUrls.has(article.url) && allArticles.length < maxArticles) {
        allArticles.push(article)
        usedUrls.add(article.url)
        console.log(`[article-agent] Added database article: ${article.title} (${article.source})`)
      }
    }
    
    // 2. SECONDARY: Add AI-discovered articles (if we need more)
    if (allArticles.length < maxArticles) {
      console.log(`[article-agent] Found ${allArticles.length} database articles, searching for AI articles...`)
      const aiArticles = await getRecommendedArticlesWithAI(params, requestCount)
      
      // IMPORTANT: Re-validate ALL articles (including cached ones) to ensure they're still valid
      // URLs can become invalid over time, so we must validate even cached articles
      const validatedAiArticles = await validateAndRankArticles(aiArticles, params)
      
      for (const article of validatedAiArticles) {
        if (!usedUrls.has(article.url) && allArticles.length < maxArticles) {
          allArticles.push(article)
          usedUrls.add(article.url)
          console.log(`[article-agent] Added AI article: ${article.title} (${article.source})`)
        }
      }
    }
    
    // 3. FALLBACK: Add static articles that aren't duplicates
    if (allArticles.length < maxArticles) {
      console.log(`[article-agent] Found ${allArticles.length} articles, adding static fallback...`)
      const validatedStatic = await validateStaticArticles(staticArticles)
      for (const staticArticle of validatedStatic) {
        if (!usedUrls.has(staticArticle.url) && allArticles.length < maxArticles) {
          allArticles.push(staticArticle)
          usedUrls.add(staticArticle.url)
          console.log(`[article-agent] Added static article: ${staticArticle.title} (${staticArticle.source})`)
        }
      }
    }
    
    // Return up to maxArticles, but ensure we have at least minArticles if available
    if (allArticles.length >= minArticles) {
      console.log(`[article-agent] Returning ${Math.min(allArticles.length, maxArticles)} valid articles (requested ${minArticles}-${maxArticles})`)
      return allArticles.slice(0, maxArticles)
    } else if (allArticles.length > 0) {
      // If we have some articles but fewer than min, return what we have
      console.warn(`[article-agent] Only found ${allArticles.length} valid articles (requested min ${minArticles}), returning what we have`)
      return allArticles
    } else {
      // No valid articles found - try to get unvalidated static articles as last resort
      // Get counts for logging (need to fetch validated articles first)
      let aiCount = 0
      let staticCount = 0
      try {
        const aiArticles = await getRecommendedArticlesWithAI(params, requestCount)
        const validatedAi = await validateAndRankArticles(aiArticles, params)
        aiCount = validatedAi.length
        const validatedStatic = await validateStaticArticles(staticArticles)
        staticCount = validatedStatic.length
      } catch {
        // Ignore errors when getting counts for logging
      }
      
      console.warn(`[article-agent] ⚠️ VALIDATION FAILURE: No valid articles found after validation for category: ${params.category}`)
      console.warn(`[article-agent] Attempted sources: Database (${dbArticles.length}), AI (${aiCount}), Static (${staticCount})`)
      console.warn(`[article-agent] All article URLs failed validation (404s, timeouts, or inaccessible). Falling back to unvalidated static articles.`)
      
      // Log this as an error for monitoring
      console.error(`[article-agent] ERROR: Article validation failure for category "${params.category}", ageMonths: ${params.ageMonths}, milestoneCode: ${params.milestoneCode || 'none'}`)
      console.error(`[article-agent] This indicates potential issues with article URLs or network connectivity.`)
      
      // Last resort: return static articles even if validation failed (better than nothing)
      // But first, try to get MORE static articles and validate them
      const moreStaticArticles = getStaticArticles(params.category, params.ageMonths, requestCount * 2)
      const validatedMoreStatic = await validateStaticArticles(moreStaticArticles)
      
      if (validatedMoreStatic.length > 0) {
        console.log(`[article-agent] Found ${validatedMoreStatic.length} valid articles from expanded static list`)
        return validatedMoreStatic.slice(0, maxArticles)
      }
      
      // If still no valid articles, return unvalidated static articles (better than nothing)
      const unvalidatedStatic = staticArticles
        .filter(a => a.url && a.url !== '#')
        .slice(0, maxArticles)
        .map(a => ({
          title: a.title,
          url: a.url,
          source: a.source,
          description: a.description || '',
          ageRange: a.ageRange,
        }))
      
      if (unvalidatedStatic.length > 0) {
        console.warn(`[article-agent] ⚠️ FALLBACK: Returning ${unvalidatedStatic.length} unvalidated static articles as last resort`)
        console.warn(`[article-agent] These articles have NOT been validated and may contain broken links.`)
        return unvalidatedStatic
      }
      
      console.error(`[article-agent] CRITICAL: No articles available at all for category: ${params.category}`)
      return []
    }
  } catch (error) {
    console.error('[article-agent] Hybrid approach failed, using validated static articles only:', error)
    // Fallback to validated static articles if AI completely fails
    const validatedStatic = await validateStaticArticles(staticArticles)
    if (validatedStatic.length >= minArticles) {
      console.log(`[article-agent] Returning ${Math.min(validatedStatic.length, maxArticles)} validated static articles (fallback)`)
      return validatedStatic.slice(0, maxArticles)
    } else if (validatedStatic.length > 0) {
      console.warn(`[article-agent] Only found ${validatedStatic.length} valid static articles (requested min ${minArticles}), returning what we have`)
      return validatedStatic
    }
    
    // Last resort: return unvalidated static articles (better than nothing)
    console.warn(`[article-agent] No validated articles available, trying unvalidated static articles as last resort for category: ${params.category}`)
    const unvalidatedStatic = staticArticles
      .filter(a => a.url && a.url !== '#')
      .slice(0, maxArticles)
      .map(a => ({
        title: a.title,
        url: a.url,
        source: a.source,
        description: a.description || '',
        ageRange: a.ageRange,
      }))
    
    if (unvalidatedStatic.length > 0) {
      console.warn(`[article-agent] Returning ${unvalidatedStatic.length} unvalidated static articles as last resort fallback`)
      return unvalidatedStatic
    }
    
    // Absolute last resort: return empty array (graceful degradation)
    console.error(`[article-agent] No articles available at all (AI failed, static empty or invalid) for category: ${params.category}`)
    return []
  }
}

/**
 * Validate articles when reading from database
 * Filters out broken URLs (404s, etc.)
 */
export async function validateArticlesOnRetrieval(
  articles: Array<{
    title: string
    url: string
    source?: string
    description?: string
  }>
): Promise<Array<{
  title: string
  url: string
  source?: string
  description?: string
}>> {
  if (!articles || articles.length === 0) {
    return []
  }

  console.log(`[article-agent] Validating ${articles.length} articles on retrieval...`)
  
  // Validate articles in parallel
  const validationPromises = articles.map(async (article) => {
    if (!article.url || article.url === '#') {
      return null
    }

    // Validate URL format
    try {
      new URL(article.url)
    } catch {
      console.warn(`[article-agent] Invalid URL format on retrieval: ${article.url}`)
      return null
    }

    // Check if URL is accessible
    const isAccessible = await isUrlAccessible(article.url)
    if (!isAccessible) {
      console.warn(`[article-agent] Filtering out broken URL on retrieval: ${article.url}`)
      return null
    }

    return article
  })

  const results = await Promise.all(validationPromises)
  const validArticles = results.filter((article): article is NonNullable<typeof article> => article !== null)
  
  console.log(`[article-agent] Validated ${validArticles.length} out of ${articles.length} articles on retrieval (filtered ${articles.length - validArticles.length} broken URLs)`)
  
  return validArticles
}

/**
 * Clear the article cache (useful for testing or forced refresh)
 */
export function clearArticleCache(): void {
  articleCache.clear()
  console.log('[article-agent] Article cache cleared')
}

