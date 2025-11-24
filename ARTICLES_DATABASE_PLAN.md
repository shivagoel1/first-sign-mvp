# Articles Database & Backup Plan

## Overview
Create a dedicated database table to store static articles as a backup option, ensuring reliable article recommendations even when AI-generated articles fail or are unavailable.

---

## 1. Database Schema

### Table: `articles`

```sql
CREATE TABLE public.articles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  
  -- Article Metadata
  title text NOT NULL,
  url text NOT NULL,
  source text NOT NULL CHECK (source = ANY (ARRAY['CDC'::text, 'HealthyChildren'::text, 'AAP'::text, 'Other'::text])),
  description text,
  
  -- Mapping to Milestones/Categories
  milestone_code text, -- Optional: Link to specific milestone
  category text NOT NULL CHECK (category = ANY (ARRAY['Social-Emotional'::text, 'Language/Communication'::text, 'Motor'::text, 'Cognitive'::text])),
  focus_area text CHECK (focus_area = ANY (ARRAY['Typically Developing'::text, 'Down Syndrome'::text, 'Cerebral Palsy'::text, 'Autism Spectrum Disorder'::text])),
  
  -- Age Targeting
  age_months_min integer,
  age_months_max integer,
  
  -- Article Quality & Status
  is_validated boolean DEFAULT false, -- URL accessibility checked
  validation_date timestamp with time zone,
  validation_status text DEFAULT 'pending' CHECK (validation_status = ANY (ARRAY['pending'::text, 'valid'::text, 'invalid'::text, 'timeout'::text])),
  last_checked_at timestamp with time zone,
  
  -- Priority & Ranking
  priority integer DEFAULT 5 CHECK (priority >= 1 AND priority <= 10), -- Higher = more relevant
  is_backup boolean DEFAULT true, -- True for static backup articles
  is_featured boolean DEFAULT false, -- Featured articles shown first
  
  -- Usage Tracking
  times_used integer DEFAULT 0,
  last_used_at timestamp with time zone,
  
  -- Metadata
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by text DEFAULT 'system'::text,
  
  CONSTRAINT articles_pkey PRIMARY KEY (id),
  CONSTRAINT articles_url_unique UNIQUE (url),
  CONSTRAINT articles_milestone_fkey FOREIGN KEY (milestone_code) REFERENCES public.milestones(milestone_code),
  CONSTRAINT articles_age_range_check CHECK (age_months_min IS NULL OR age_months_max IS NULL OR age_months_min <= age_months_max)
);

-- Indexes for Performance
CREATE INDEX idx_articles_category ON public.articles(category);
CREATE INDEX idx_articles_milestone_code ON public.articles(milestone_code);
CREATE INDEX idx_articles_age_range ON public.articles(age_months_min, age_months_max);
CREATE INDEX idx_articles_validation_status ON public.articles(validation_status, is_validated);
CREATE INDEX idx_articles_priority ON public.articles(priority DESC, is_featured DESC);
CREATE INDEX idx_articles_source ON public.articles(source);
```

### Table: `article_usage_log` (Optional - for analytics)

```sql
CREATE TABLE public.article_usage_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL,
  assessment_result_id uuid,
  page_number integer,
  milestone_code text,
  used_at timestamp with time zone DEFAULT now(),
  user_type text CHECK (user_type = ANY (ARRAY['parent'::text, 'physician'::text])),
  
  CONSTRAINT article_usage_log_pkey PRIMARY KEY (id),
  CONSTRAINT article_usage_log_article_fkey FOREIGN KEY (article_id) REFERENCES public.articles(id),
  CONSTRAINT article_usage_log_assessment_fkey FOREIGN KEY (assessment_result_id) REFERENCES public.assessment_results(id)
);

CREATE INDEX idx_article_usage_article ON public.article_usage_log(article_id);
CREATE INDEX idx_article_usage_assessment ON public.article_usage_log(assessment_result_id);
```

---

## 2. Mapping Strategy

### Article-to-Milestone Mapping

**Primary Mapping:**
- `milestone_code` → Direct link to specific milestone (most specific)
- `category` → Maps to milestone category (Social-Emotional, Language/Communication, Motor, Cognitive)
- `age_months_min` / `age_months_max` → Age range for relevance

**Fallback Hierarchy:**
1. **Exact Match**: `milestone_code` + `category` + age range
2. **Category Match**: `category` + age range (no specific milestone)
3. **Category Only**: `category` only (any age)
4. **General**: No specific mapping (catch-all articles)

### Example Mapping:

```typescript
// Specific milestone article
{
  milestone_code: "SE-12-1",
  category: "Social-Emotional",
  age_months_min: 9,
  age_months_max: 15,
  priority: 10
}

// Category-level article (no specific milestone)
{
  milestone_code: null,
  category: "Social-Emotional",
  age_months_min: 12,
  age_months_max: 24,
  priority: 7
}

// General article (any age, any category)
{
  milestone_code: null,
  category: "Social-Emotional",
  age_months_min: null,
  age_months_max: null,
  priority: 5
}
```

---

## 3. Article Retrieval Logic

### Priority Order:
1. **AI-Generated Articles** (from `ai_report.recommended_articles`) - validated
2. **Static Backup Articles** (from `articles` table) - validated
3. **Unvalidated Static Articles** (last resort)

### Query Strategy:

```sql
-- Get backup articles for a milestone
SELECT * FROM articles
WHERE (
  milestone_code = $1 
  OR (milestone_code IS NULL AND category = $2)
)
AND (
  (age_months_min IS NULL AND age_months_max IS NULL)
  OR ($3 BETWEEN age_months_min AND age_months_max)
)
AND validation_status = 'valid'
AND is_backup = true
ORDER BY 
  CASE WHEN milestone_code IS NOT NULL THEN 1 ELSE 2 END, -- Exact match first
  priority DESC,
  is_featured DESC,
  times_used ASC -- Less used articles get priority
LIMIT 3;
```

---

## 4. Perplexity Prompt Template

### Base Prompt Structure:

```
I need to find authoritative, evidence-based articles from CDC (cdc.gov), American Academy of Pediatrics (AAP/HealthyChildren.org), or other reputable pediatric health sources about [TOPIC] for children aged [AGE_RANGE].

Context:
- Child's Age: [AGE] months
- Developmental Category: [CATEGORY] (Social-Emotional / Language/Communication / Motor / Cognitive)
- Specific Milestone: [MILESTONE_DESCRIPTION]
- Concern: [CONCERN_NARRATIVE or MILESTONE_QUESTION]

Requirements:
1. Articles must be from official sources (CDC.gov, HealthyChildren.org, AAP.org, or other medical institutions)
2. Articles must be directly relevant to the specific milestone/concern
3. Articles must be age-appropriate for [AGE] months
4. Provide the EXACT URL (not shortened links)
5. Provide the article title
6. Provide a 1-2 sentence description
7. Verify the URL is accessible (returns 200 OK)

Format your response as JSON:
{
  "articles": [
    {
      "title": "Article Title",
      "url": "https://full-url-here",
      "source": "CDC" | "HealthyChildren" | "AAP" | "Other",
      "description": "Brief description of article content",
      "relevance_score": 1-10
    }
  ]
}

Find 3-5 articles that are most relevant to this specific developmental milestone and concern.
```

### Example Prompts by Category:

#### Social-Emotional:
```
I need to find authoritative articles from CDC, AAP, or HealthyChildren.org about social-emotional development for a [AGE] month old child who [CONCERN_DESCRIPTION].

Specific milestone: [MILESTONE_TEXT]
Category: Social-Emotional Development
Age: [AGE] months

Find articles about:
- Social skills development
- Emotional regulation
- Parent-child interaction
- Early social milestones

[Include base prompt requirements]
```

#### Language/Communication:
```
I need to find authoritative articles from CDC, AAP, or HealthyChildren.org about language and communication development for a [AGE] month old child who [CONCERN_DESCRIPTION].

Specific milestone: [MILESTONE_TEXT]
Category: Language/Communication Development
Age: [AGE] months

Find articles about:
- Speech and language milestones
- Communication delays
- Early language development
- When to seek help

[Include base prompt requirements]
```

#### Motor:
```
I need to find authoritative articles from CDC, AAP, or HealthyChildren.org about motor development (gross/fine motor skills) for a [AGE] month old child who [CONCERN_DESCRIPTION].

Specific milestone: [MILESTONE_TEXT]
Category: Motor Development
Age: [AGE] months

Find articles about:
- Physical milestones
- Motor skill development
- Developmental delays
- Early intervention

[Include base prompt requirements]
```

#### Cognitive:
```
I need to find authoritative articles from CDC, AAP, or HealthyChildren.org about cognitive development for a [AGE] month old child who [CONCERN_DESCRIPTION].

Specific milestone: [MILESTONE_TEXT]
Category: Cognitive Development
Age: [AGE] months

Find articles about:
- Cognitive milestones
- Learning and thinking skills
- Brain development
- Early learning

[Include base prompt requirements]
```

---

## 5. Implementation Steps

### Phase 1: Database Setup
1. ✅ Create `articles` table
2. ✅ Create indexes
3. ✅ Set up RLS policies (if needed)
4. ✅ Create validation function

### Phase 2: Initial Data Population
1. ✅ Use Perplexity prompts to gather articles for each category
2. ✅ Validate all URLs (check accessibility)
3. ✅ Map articles to milestones/categories
4. ✅ Set priority scores
5. ✅ Insert into database

### Phase 3: Integration
1. ✅ Update `getHybridArticleRecommendations` to query `articles` table
2. ✅ Implement fallback logic: AI → Static (validated) → Static (unvalidated)
3. ✅ Add article usage logging
4. ✅ Implement periodic validation job

### Phase 4: Maintenance
1. ✅ Scheduled validation job (weekly/monthly)
2. ✅ Update invalid articles
3. ✅ Add new articles based on gaps
4. ✅ Monitor usage patterns

---

## 6. Data Population Strategy

### Initial Seed Data:

**For Each Category × Age Range:**
- Social-Emotional: 0-6m, 6-12m, 12-18m, 18-24m, 24-36m
- Language/Communication: Same age ranges
- Motor: Same age ranges
- Cognitive: Same age ranges

**For Each Milestone:**
- Find 2-3 specific articles per milestone
- Find 3-5 category-level articles per category
- Find 5-10 general articles per category

**Total Estimate:**
- ~50-100 milestone-specific articles
- ~100-200 category-level articles
- ~50-100 general articles
- **Total: ~200-400 articles**

---

## 7. Validation & Quality Control

### URL Validation:
```typescript
async function validateArticle(articleId: string) {
  // Check URL accessibility
  // Update validation_status
  // Update last_checked_at
  // Log failures
}
```

### Periodic Validation Job:
- Run weekly/monthly
- Check all articles with `validation_status = 'valid'`
- Update status if URL becomes invalid
- Flag articles needing review

---

## 8. RLS Policies (if needed)

```sql
-- Parents can read articles
CREATE POLICY "parents can read articles"
ON articles FOR SELECT
USING (true); -- Articles are public resources

-- Only admins can insert/update articles
CREATE POLICY "admins can manage articles"
ON articles FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
```

---

## 9. API Integration

### Update `lib/articles/article-agent.ts`:

```typescript
async function getBackupArticles(
  category: string,
  ageMonths: number,
  milestoneCode?: string,
  limit: number = 3
): Promise<Article[]> {
  // Query articles table
  // Return validated articles
  // Fallback to unvalidated if needed
}
```

### Update `getHybridArticleRecommendations`:
1. Try AI articles (validated)
2. If insufficient, add backup articles
3. Return combined list

---

## 10. Success Metrics

- **Coverage**: 100% of milestones have at least 1 backup article
- **Validation Rate**: >95% of articles are validated
- **Usage**: Track which articles are most helpful
- **Reliability**: Zero cases of "no articles available"

---

## Next Steps

1. **Review this plan** and adjust schema as needed
2. **Create migration file** for `articles` table
3. **Generate Perplexity prompts** for each category/age range
4. **Populate initial data** using Perplexity
5. **Implement validation** and integration
6. **Test fallback logic** thoroughly

