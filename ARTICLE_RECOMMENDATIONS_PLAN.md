# Article Recommendations Feature - Implementation Plan

## Overview
Display CDC and app-curated articles/resources when a milestone shows "needs support" status, based on the category (focus area) from the assessment.

## Feature Goals
- Show relevant articles when a milestone needs support
- Match articles to milestone categories (Motor, Language/Communication, Social-Emotional, Cognitive)
- Optionally match by age range
- Display in storybook viewer, PDF, and dashboard preview

---

## Implementation Approach

### Option 1: Database-Driven (Recommended)
**Pros:** Flexible, easy to update, can track usage
**Cons:** Requires database setup and content management

### Option 2: Static Configuration
**Pros:** Simple, no database needed
**Cons:** Less flexible, harder to update

### Option 3: Hybrid (Recommended for MVP)
**Pros:** Best of both worlds
**Cons:** Slightly more complex

---

## Recommended Implementation: Hybrid Approach

### Phase 1: Database Schema

#### 1.1 Create `article_resources` table
```sql
CREATE TABLE article_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  source TEXT NOT NULL, -- 'CDC', 'APP', 'EXTERNAL'
  categories TEXT[] NOT NULL, -- ['Motor', 'Language/Communication', etc.]
  age_range_min_months INTEGER,
  age_range_max_months INTEGER,
  milestone_codes TEXT[], -- Optional: specific milestone codes
  priority INTEGER DEFAULT 0, -- Higher = show first
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast category lookups
CREATE INDEX idx_article_resources_categories ON article_resources USING GIN(categories);
CREATE INDEX idx_article_resources_active ON article_resources(is_active) WHERE is_active = true;
```

#### 1.2 Seed Initial Articles
Create a seed file with CDC and app articles for each category:

**Motor Category:**
- CDC: "Important Milestones: Your Baby By 6 Months" (Motor section)
- CDC: "Physical Development: 0-12 Months"
- App: "Supporting Your Baby's Motor Development"

**Language/Communication:**
- CDC: "Important Milestones: Your Baby By 6 Months" (Communication section)
- CDC: "Act Early: Communication Milestones"
- App: "Building Language Skills Through Daily Activities"

**Social-Emotional:**
- CDC: "Social-Emotional Development: 0-12 Months"
- App: "Supporting Your Child's Emotional Development"

**Cognitive:**
- CDC: "Cognitive Development: 0-12 Months"
- App: "Play-Based Learning for Infants"

---

### Phase 2: Backend API

#### 2.1 Create Article Matching Service
**File:** `lib/articles/article-matcher.ts`

```typescript
type ArticleResource = {
  id: string
  title: string
  description: string | null
  url: string
  source: 'CDC' | 'APP' | 'EXTERNAL'
  categories: string[]
  age_range_min_months?: number | null
  age_range_max_months?: number | null
  milestone_codes?: string[] | null
  priority: number
}

type ArticleMatchParams = {
  category: string
  ageMonths?: number
  milestoneCodes?: string[]
  status: 'met' | 'missed'
}

export async function getRecommendedArticles(
  params: ArticleMatchParams,
  limit: number = 3
): Promise<ArticleResource[]> {
  // Only show articles for milestones that need support
  if (params.status === 'met') {
    return []
  }

  const supabase = await createClient()
  
  // Build query
  let query = supabase
    .from('article_resources')
    .select('*')
    .eq('is_active', true)
    .contains('categories', [params.category])
    .order('priority', { ascending: false })
    .limit(limit)

  // Optional: Filter by age range
  if (params.ageMonths) {
    query = query.or(
      `age_range_min_months.is.null,age_range_min_months.lte.${params.ageMonths}`
    ).or(
      `age_range_max_months.is.null,age_range_max_months.gte.${params.ageMonths}`
    )
  }

  // Optional: Filter by specific milestone codes
  if (params.milestoneCodes && params.milestoneCodes.length > 0) {
    query = query.or(
      params.milestoneCodes
        .map(code => `milestone_codes.cs.{${code}}`)
        .join(',')
    )
  }

  const { data, error } = await query

  if (error) {
    console.error('[article-matcher] Error fetching articles:', error)
    return []
  }

  return data ?? []
}
```

#### 2.2 Create API Route
**File:** `app/api/articles/recommendations/route.ts`

```typescript
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { category, ageMonths, milestoneCodes, status } = body

  const articles = await getRecommendedArticles({
    category,
    ageMonths,
    milestoneCodes,
    status,
  })

  return NextResponse.json({ articles })
}
```

---

### Phase 3: Integrate into Storybook Generation

#### 3.1 Update Storybook Page Type
**File:** `lib/ai/combine-pages.ts`

```typescript
export type CombinedPage = {
  page_number: number
  category: string | null
  status: 'met' | 'missed'
  display_text: string
  narrative_text: string
  visual_flag?: string
  illustration_prompts?: string[]
  recommended_articles?: Array<{
    id: string
    title: string
    description: string | null
    url: string
    source: string
  }>
  items?: Array<{
    milestone_code?: string
    display_text?: string
    micro_narrative?: string
    visual_flag?: string
  }>
}
```

#### 3.2 Add Articles During Page Combination
**File:** `lib/ai/combine-pages.ts`

```typescript
import { getRecommendedArticles } from '@/lib/articles/article-matcher'

// In combinePages function, after creating a page:
if (page.status === 'missed' && page.category) {
  const articles = await getRecommendedArticles({
    category: page.category,
    ageMonths: verified[0]?.age_months ?? undefined,
    milestoneCodes: page.items?.map(i => i.milestone_code).filter(Boolean) as string[],
    status: 'missed',
  }, 3) // Limit to 3 articles per page

  page.recommended_articles = articles.map(a => ({
    id: a.id,
    title: a.title,
    description: a.description,
    url: a.url,
    source: a.source,
  }))
}
```

---

### Phase 4: Frontend Display

#### 4.1 Update Storybook Viewer
**File:** `components/dashboard/storybook-viewer.tsx`

Add articles section after narrative text:

```tsx
{/* Recommended Articles - Only show for "needs support" pages */}
{currentPage?.status === 'missed' && currentPage?.recommended_articles && currentPage.recommended_articles.length > 0 && (
  <div className="mt-6 p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border border-primary/20">
    <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
      <BookOpen className="w-4 h-4" />
      Helpful Resources
    </h4>
    <div className="space-y-2">
      {currentPage.recommended_articles.map((article) => (
        <a
          key={article.id}
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block p-3 bg-white rounded-md border border-border hover:border-primary/50 hover:shadow-sm transition-all group"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-primary">
                  {article.source === 'CDC' ? 'CDC' : article.source === 'APP' ? 'FirstSignFirst' : 'External'}
                </span>
                <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-primary" />
              </div>
              <p className="text-sm font-medium text-foreground group-hover:text-primary">
                {article.title}
              </p>
              {article.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {article.description}
                </p>
              )}
            </div>
          </div>
        </a>
      ))}
    </div>
  </div>
)}
```

#### 4.2 Update PDF Generator
**File:** `lib/pdf/storybook-generator.tsx`

Add articles section in PDF pages:

```tsx
{/* Recommended Articles Section */}
{page.recommended_articles && page.recommended_articles.length > 0 && (
  <View style={{ marginTop: 16, padding: 12, backgroundColor: '#ffedd5', borderRadius: 8 }}>
    <Text style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: '#c2410c' }}>
      Helpful Resources
    </Text>
    {page.recommended_articles.map((article, idx) => (
      <View key={idx} style={{ marginBottom: 8 }}>
        <Text style={{ fontSize: 11, fontWeight: 600, color: '#ea580c' }}>
          {article.source} - {article.title}
        </Text>
        <Text style={{ fontSize: 10, color: '#78350f', marginTop: 2 }}>
          {article.url}
        </Text>
      </View>
    ))}
  </View>
)}
```

#### 4.3 Update Dashboard Preview
**File:** `app/dashboard/parent/parent-dashboard-client.tsx`

Show article count in preview card:

```tsx
{storybookPreview?.needsSupport > 0 && (
  <div className="mt-2 text-xs text-muted-foreground">
    {storybookPreview.articleCount || 0} helpful resources available
  </div>
)}
```

---

### Phase 5: Content Management

#### 5.1 Create Admin Interface (Optional)
- Simple form to add/edit articles
- Category selection
- Age range configuration
- Priority setting

#### 5.2 Initial Article Curation
**CDC Resources:**
- Use CDC's "Learn the Signs. Act Early." materials
- Link to specific milestone pages
- Age-appropriate resources

**App Articles:**
- Create original content
- Focus on actionable tips
- Align with your brand voice

---

## Implementation Steps

### Step 1: Database Setup (1-2 hours)
1. Create `article_resources` table
2. Add indexes
3. Create seed data with initial articles

### Step 2: Backend Service (2-3 hours)
1. Create `article-matcher.ts` service
2. Create API route
3. Add to storybook generation pipeline

### Step 3: Frontend Integration (3-4 hours)
1. Update storybook viewer component
2. Update PDF generator
3. Update dashboard preview
4. Add styling and icons

### Step 4: Testing & Refinement (2-3 hours)
1. Test article matching logic
2. Verify articles show for correct categories
3. Test PDF rendering
4. Test external links

### Step 5: Content Curation (Ongoing)
1. Research and add CDC articles
2. Create app-specific articles
3. Review and update regularly

---

## Alternative: Quick MVP (Static Articles)

If you want to launch faster, you can start with a static configuration:

**File:** `lib/articles/static-articles.ts`

```typescript
export const STATIC_ARTICLES: Record<string, Array<{
  title: string
  url: string
  source: 'CDC' | 'APP'
  description?: string
}>> = {
  'Motor': [
    {
      title: 'CDC: Important Milestones - Motor Development',
      url: 'https://www.cdc.gov/ncbddd/actearly/milestones/index.html',
      source: 'CDC',
      description: 'Learn about motor development milestones'
    },
    // ... more articles
  ],
  'Language/Communication': [
    // ... articles
  ],
  // ... other categories
}
```

Then use this in the storybook generation without database calls.

---

## Benefits

1. **Value-Added Service:** Provides actionable resources beyond just assessment results
2. **Trust Building:** Links to CDC resources build credibility
3. **User Engagement:** Keeps parents engaged with helpful content
4. **SEO Benefits:** External links to CDC can improve domain authority
5. **Differentiation:** Sets your app apart from competitors

---

## Future Enhancements

1. **Article Analytics:** Track which articles are clicked most
2. **Personalized Recommendations:** ML-based article matching
3. **Article Reading Progress:** Track which articles parents have read
4. **In-App Articles:** Full article content within the app
5. **Video Resources:** Add video links alongside articles
6. **Multilingual Support:** Articles in multiple languages

---

## Questions to Consider

1. **Article Sources:** Only CDC + your app, or also allow external trusted sources?
2. **Article Count:** How many articles per "needs support" page? (Recommend: 2-3)
3. **Age Filtering:** Should articles be filtered by child's age? (Recommend: Yes, optional)
4. **Article Updates:** How often will articles be updated? (Recommend: Quarterly review)
5. **Mobile Experience:** Should articles open in-app browser or external browser?

---

## Estimated Timeline

- **MVP (Static Articles):** 4-6 hours
- **Full Implementation (Database + Dynamic):** 10-15 hours
- **With Admin Interface:** 15-20 hours

---

## Next Steps

1. Review and approve this plan
2. Decide on MVP vs Full implementation
3. Create database schema (if going full route)
4. Curate initial article list
5. Implement backend matching logic
6. Integrate into storybook generation
7. Add frontend display components
8. Test and refine

