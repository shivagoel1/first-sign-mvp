# Perplexity Prompt Templates for Article Collection

## How to Use These Prompts

1. **Replace placeholders** in brackets `[PLACEHOLDER]` with actual values
2. **Copy the entire prompt** to Perplexity
3. **Request JSON format** in your response
4. **Validate URLs** before adding to database
5. **Map articles** to appropriate milestones/categories

---

## Template 1: General Category Article Search

```
I need to find authoritative, evidence-based articles from CDC (cdc.gov), American Academy of Pediatrics (AAP/HealthyChildren.org), or other reputable pediatric health sources about [CATEGORY] development for children aged [AGE_RANGE].

Context:
- Developmental Category: [CATEGORY] (Social-Emotional / Language/Communication / Motor / Cognitive)
- Age Range: [AGE_RANGE] months (e.g., "12-18 months" or "18-24 months")
- Focus: Articles should address developmental milestones, concerns, and support strategies

Requirements:
1. Articles must be from official sources:
   - CDC.gov (Centers for Disease Control and Prevention)
   - HealthyChildren.org (American Academy of Pediatrics)
   - AAP.org (American Academy of Pediatrics)
   - Other medical institutions (Mayo Clinic, Cleveland Clinic, etc.)
2. Articles must be directly relevant to [CATEGORY] development
3. Articles must be age-appropriate for [AGE_RANGE]
4. Provide the EXACT URL (not shortened links, no URL shorteners)
5. Verify the URL is accessible (returns 200 OK status)
6. Prioritize articles that are:
   - Evidence-based
   - Actionable (provide tips/strategies)
   - Parent-friendly (not too technical)

Format your response as JSON:
{
  "articles": [
    {
      "title": "Full Article Title",
      "url": "https://full-url-here.gov/page",
      "source": "CDC" | "HealthyChildren" | "AAP" | "Other",
      "description": "1-2 sentence description of what the article covers and why it's relevant",
      "relevance_score": 1-10,
      "age_range": {
        "min_months": 12,
        "max_months": 18
      }
    }
  ]
}

Find 5-7 articles that are most relevant to [CATEGORY] development for [AGE_RANGE] month old children.
```

---

## Template 2: Specific Milestone Article Search

```
I need to find authoritative articles from CDC, AAP, or HealthyChildren.org about a specific developmental milestone for a [AGE] month old child.

Context:
- Child's Age: [AGE] months
- Developmental Category: [CATEGORY] (Social-Emotional / Language/Communication / Motor / Cognitive)
- Specific Milestone: [MILESTONE_DESCRIPTION]
- Milestone Question: "[MILESTONE_QUESTION]"
- Concern Narrative: "[CONCERN_NARRATIVE]" (if available)

Example Context:
- Child's Age: 12 months
- Developmental Category: Social-Emotional
- Specific Milestone: "Shows affection to familiar people"
- Milestone Question: "Does your child show affection to familiar people?"
- Concern Narrative: "Child does not show affection to parents or caregivers"

Requirements:
1. Articles must be from official sources (CDC.gov, HealthyChildren.org, AAP.org, or other medical institutions)
2. Articles must be directly relevant to the specific milestone: [MILESTONE_DESCRIPTION]
3. Articles must address the concern: [CONCERN_NARRATIVE]
4. Articles must be age-appropriate for [AGE] months
5. Provide the EXACT URL (not shortened links)
6. Provide the article title
7. Provide a 1-2 sentence description explaining why this article is relevant
8. Verify the URL is accessible (returns 200 OK)

Format your response as JSON:
{
  "articles": [
    {
      "title": "Article Title",
      "url": "https://full-url-here",
      "source": "CDC" | "HealthyChildren" | "AAP" | "Other",
      "description": "Brief description of article content and relevance to this specific milestone",
      "relevance_score": 1-10,
      "milestone_code": "[MILESTONE_CODE]" (if known)
    }
  ]
}

Find 3-5 articles that are most relevant to this specific developmental milestone and concern.
```

---

## Template 3: Focus Area Specific (Down Syndrome, Autism, etc.)

```
I need to find authoritative articles from CDC, AAP, or HealthyChildren.org about [CATEGORY] development for children with [FOCUS_AREA] aged [AGE_RANGE].

Context:
- Focus Area: [FOCUS_AREA] (Down Syndrome / Cerebral Palsy / Autism Spectrum Disorder / Typically Developing)
- Developmental Category: [CATEGORY] (Social-Emotional / Language/Communication / Motor / Cognitive)
- Age Range: [AGE_RANGE] months
- Specific Milestone: [MILESTONE_DESCRIPTION] (if applicable)

Requirements:
1. Articles must be from official sources (CDC.gov, HealthyChildren.org, AAP.org, or condition-specific organizations)
2. Articles must address [CATEGORY] development specifically for children with [FOCUS_AREA]
3. Articles must be age-appropriate for [AGE_RANGE]
4. Articles should provide:
   - Developmental expectations
   - Support strategies
   - When to seek professional help
   - Evidence-based interventions
5. Provide the EXACT URL (not shortened links)
6. Verify the URL is accessible

Format your response as JSON:
{
  "articles": [
    {
      "title": "Article Title",
      "url": "https://full-url-here",
      "source": "CDC" | "HealthyChildren" | "AAP" | "Other",
      "description": "Description of article content",
      "relevance_score": 1-10,
      "focus_area": "[FOCUS_AREA]"
    }
  ]
}

Find 3-5 articles that are most relevant to [CATEGORY] development for children with [FOCUS_AREA] in the [AGE_RANGE] month age range.
```

---

## Example Prompts (Ready to Use)

### Example 1: Social-Emotional Development (12-18 months)

```
I need to find authoritative, evidence-based articles from CDC (cdc.gov), American Academy of Pediatrics (AAP/HealthyChildren.org), or other reputable pediatric health sources about Social-Emotional development for children aged 12-18 months.

Context:
- Developmental Category: Social-Emotional
- Age Range: 12-18 months
- Focus: Articles should address social-emotional milestones, emotional regulation, parent-child interaction, and support strategies

Requirements:
1. Articles must be from official sources:
   - CDC.gov (Centers for Disease Control and Prevention)
   - HealthyChildren.org (American Academy of Pediatrics)
   - AAP.org (American Academy of Pediatrics)
   - Other medical institutions (Mayo Clinic, Cleveland Clinic, etc.)
2. Articles must be directly relevant to Social-Emotional development
3. Articles must be age-appropriate for 12-18 months
4. Provide the EXACT URL (not shortened links, no URL shorteners)
5. Verify the URL is accessible (returns 200 OK status)
6. Prioritize articles that are:
   - Evidence-based
   - Actionable (provide tips/strategies)
   - Parent-friendly (not too technical)

Format your response as JSON:
{
  "articles": [
    {
      "title": "Full Article Title",
      "url": "https://full-url-here.gov/page",
      "source": "CDC" | "HealthyChildren" | "AAP" | "Other",
      "description": "1-2 sentence description of what the article covers and why it's relevant",
      "relevance_score": 1-10,
      "age_range": {
        "min_months": 12,
        "max_months": 18
      }
    }
  ]
}

Find 5-7 articles that are most relevant to Social-Emotional development for 12-18 month old children.
```

### Example 2: Language/Communication Milestone (18 months)

```
I need to find authoritative articles from CDC, AAP, or HealthyChildren.org about a specific developmental milestone for an 18 month old child.

Context:
- Child's Age: 18 months
- Developmental Category: Language/Communication
- Specific Milestone: "Says several single words"
- Milestone Question: "Does your child say several single words?"
- Concern Narrative: "Child is not saying any words yet, only makes sounds"

Requirements:
1. Articles must be from official sources (CDC.gov, HealthyChildren.org, AAP.org, or other medical institutions)
2. Articles must be directly relevant to the specific milestone: "Says several single words"
3. Articles must address the concern: "Child is not saying any words yet"
4. Articles must be age-appropriate for 18 months
5. Provide the EXACT URL (not shortened links)
6. Provide the article title
7. Provide a 1-2 sentence description explaining why this article is relevant
8. Verify the URL is accessible (returns 200 OK)

Format your response as JSON:
{
  "articles": [
    {
      "title": "Article Title",
      "url": "https://full-url-here",
      "source": "CDC" | "HealthyChildren" | "AAP" | "Other",
      "description": "Brief description of article content and relevance to this specific milestone",
      "relevance_score": 1-10
    }
  ]
}

Find 3-5 articles that are most relevant to this specific developmental milestone and concern.
```

### Example 3: Motor Development (6-12 months)

```
I need to find authoritative, evidence-based articles from CDC (cdc.gov), American Academy of Pediatrics (AAP/HealthyChildren.org), or other reputable pediatric health sources about Motor development for children aged 6-12 months.

Context:
- Developmental Category: Motor
- Age Range: 6-12 months
- Focus: Articles should address gross motor skills (sitting, crawling, standing) and fine motor skills (grasping, reaching)

Requirements:
1. Articles must be from official sources (CDC.gov, HealthyChildren.org, AAP.org, or other medical institutions)
2. Articles must be directly relevant to Motor development
3. Articles must be age-appropriate for 6-12 months
4. Provide the EXACT URL (not shortened links)
5. Verify the URL is accessible (returns 200 OK)
6. Prioritize articles that provide:
   - Developmental milestones
   - Support strategies
   - When to seek help
   - Activities to encourage development

Format your response as JSON:
{
  "articles": [
    {
      "title": "Full Article Title",
      "url": "https://full-url-here.gov/page",
      "source": "CDC" | "HealthyChildren" | "AAP" | "Other",
      "description": "1-2 sentence description of what the article covers",
      "relevance_score": 1-10,
      "age_range": {
        "min_months": 6,
        "max_months": 12
      }
    }
  ]
}

Find 5-7 articles that are most relevant to Motor development for 6-12 month old children.
```

---

## Data Mapping Guide

### When Adding Articles to Database:

1. **Extract from Perplexity Response:**
   - `title` → `articles.title`
   - `url` → `articles.url`
   - `source` → `articles.source` (map: "CDC" → "CDC", "HealthyChildren" → "HealthyChildren", "AAP" → "AAP", else → "Other")
   - `description` → `articles.description`
   - `relevance_score` → `articles.priority` (1-10 scale)
   - `age_range.min_months` → `articles.age_months_min`
   - `age_range.max_months` → `articles.age_months_max`

2. **Set Additional Fields:**
   - `category` → From context (Social-Emotional, Language/Communication, Motor, Cognitive)
   - `milestone_code` → If article is milestone-specific, otherwise `NULL`
   - `focus_area` → If article is condition-specific, otherwise `NULL`
   - `is_backup` → `true` (all static articles are backups)
   - `is_validated` → `false` initially (validate after insertion)
   - `validation_status` → `'pending'` initially

3. **Priority Scoring:**
   - **10**: Exact milestone match + age match + high relevance
   - **8-9**: Category match + age match + high relevance
   - **6-7**: Category match + age match + medium relevance
   - **4-5**: Category match only (any age) + medium relevance
   - **1-3**: General articles (low specificity)

---

## Batch Collection Strategy

### Step 1: Category-Level Articles
For each category (Social-Emotional, Language/Communication, Motor, Cognitive):
- Use Template 1 for each age range: 0-6m, 6-12m, 12-18m, 18-24m, 24-36m
- Collect 5-7 articles per age range
- **Total: ~100-140 category-level articles**

### Step 2: Milestone-Specific Articles
For each milestone that commonly needs support:
- Use Template 2 with specific milestone details
- Collect 2-3 articles per milestone
- Focus on milestones with high "missed" rates
- **Total: ~50-100 milestone-specific articles**

### Step 3: Focus Area Articles (Optional)
For each focus area (Down Syndrome, Autism, Cerebral Palsy):
- Use Template 3 for each category
- Collect 3-5 articles per focus area × category
- **Total: ~40-60 focus area articles**

### Step 4: Validation
- Validate all URLs (check accessibility)
- Remove invalid articles
- Update `validation_status` and `is_validated` fields

---

## Quality Checklist

Before adding an article to the database, verify:

- [ ] URL is from an official source (CDC, AAP, HealthyChildren.org, medical institution)
- [ ] URL is accessible (returns 200 OK, not 404)
- [ ] Article is relevant to the category/milestone
- [ ] Article is age-appropriate
- [ ] Article provides actionable information
- [ ] Article is parent-friendly (not too technical)
- [ ] Title accurately describes the content
- [ ] Description is clear and relevant
- [ ] Priority score is appropriate (1-10)
- [ ] Age range is set correctly (if applicable)

---

## Tips for Best Results

1. **Be Specific**: Include exact milestone descriptions and concern narratives
2. **Request Multiple Articles**: Ask for 5-7 articles to get variety
3. **Verify URLs**: Always check that URLs are accessible before adding
4. **Check Relevance**: Read article descriptions to ensure they match the need
5. **Prioritize Official Sources**: CDC and AAP articles are most trusted
6. **Age-Appropriate**: Ensure articles match the child's age range
7. **Actionable Content**: Prefer articles with tips/strategies over pure information

