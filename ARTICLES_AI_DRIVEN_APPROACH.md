# AI-Driven Article Selection Approach

## Overview

Instead of hard-coding article-to-milestone relationships, articles are stored generically and the AI intelligently selects the most relevant articles based on context.

---

## Schema Changes

### Removed Constraints:
- ❌ `articles_milestone_fkey` - Foreign key to milestones table
- ✅ `milestone_code` column remains (optional, for reference only)

### Article Storage Strategy:

Articles are stored with **contextual metadata** that AI uses for matching:

```sql
CREATE TABLE public.articles (
  id uuid PRIMARY KEY,
  title text NOT NULL,
  url text NOT NULL,
  source text NOT NULL,
  description text,  -- Key for AI semantic matching
  
  -- Contextual matching fields (AI uses these)
  category text NOT NULL,  -- Social-Emotional, Language/Communication, Motor, Cognitive
  focus_area text,  -- Typically Developing, Down Syndrome, Cerebral Palsy, Autism
  age_months_min integer,  -- Age range start
  age_months_max integer,  -- Age range end
  
  -- Optional reference (not enforced)
  milestone_code text,  -- For reference only, no foreign key constraint
  
  -- Quality & ranking
  priority integer DEFAULT 5,
  is_backup boolean DEFAULT true,
  validation_status text DEFAULT 'pending',
  
  -- ... other fields
);
```

---

## How AI Selects Articles

### Matching Criteria (in priority order):

1. **Category Match**: Article category matches milestone category
2. **Age Range Match**: Child's age falls within article's age range
3. **Focus Area Match**: Article focus_area matches child's condition (if applicable)
4. **Semantic Matching**: AI analyzes `description` and `milestone_description` for relevance
5. **Priority Score**: Higher priority articles are preferred

### Example Flow:

```
Milestone: "Says several single words" (18 months, Language/Communication)
↓
AI searches articles with:
- category = 'Language/Communication'
- age_months_min <= 18 AND age_months_max >= 18
- focus_area matches (or NULL for general)
↓
AI ranks by:
- Semantic relevance (description vs milestone description)
- Priority score
- Source quality (CDC > AAP > Other)
↓
Returns top 3 articles
```

---

## Benefits of This Approach

### ✅ Flexibility
- Articles can be reused across multiple milestones
- No need to create duplicate articles for each milestone
- Easy to add new articles without updating milestone references

### ✅ AI Intelligence
- AI can match articles based on semantic meaning, not just exact codes
- Better relevance - AI understands context and concern narratives
- Adapts to new milestones automatically

### ✅ Simpler Data Model
- No foreign key constraints to manage
- No need to maintain article-milestone relationships
- Easier to import and maintain

### ✅ Scalability
- Add articles once, use for many milestones
- Category-level articles serve multiple milestones
- Focus-area articles automatically match relevant milestones

---

## Article Import Strategy

### For Perplexity CSV:

**Required Fields:**
- `title`, `url`, `source`, `description`
- `category` (Social-Emotional, Language/Communication, Motor, Cognitive)
- `focus_area` (Typically Developing, Down Syndrome, etc. or NULL)
- `age_months_min`, `age_months_max` (or NULL for all ages)

**Optional Fields:**
- `milestone_code` - Can be NULL or a reference (not enforced)
- `priority` - 1-10 (higher = more relevant)

**Example CSV Row:**
```csv
title,url,source,description,category,focus_area,age_months_min,age_months_max,priority,milestone_code
"Language Development Guide","https://cdc.gov/...","CDC","Comprehensive guide to language milestones and support strategies","Language/Communication","Typically Developing",12,24,8,
```

**Note**: `milestone_code` can be empty/NULL - AI will match based on other fields.

---

## Query Logic (Updated)

The `getBackupArticlesFromDatabase` function already supports this:

```typescript
// Query by category and age (not milestone_code)
let query = supabase
  .from('articles')
  .select('*')
  .eq('category', category)
  .eq('validation_status', 'valid')
  .eq('is_backup', true)

// Optional: Filter by milestone_code if provided (for exact matches)
if (milestoneCode) {
  query = query.or(`milestone_code.eq.${milestoneCode},milestone_code.is.null`)
} else {
  // No milestone code - get category-level articles
  query = query.is('milestone_code', null)
}

// Filter by age range
if (ageMonths !== undefined) {
  // Articles with no age restriction OR within age range
  query = query.or(`age_months_min.is.null,age_months_max.is.null`)
}
```

**Then AI ranks by:**
- Semantic relevance (description matching)
- Priority score
- Source quality

---

## Migration Steps

1. **Run migration to remove foreign key:**
   ```sql
   -- Already in: 20251123_make_articles_milestone_code_nullable.sql
   ALTER TABLE public.articles 
   DROP CONSTRAINT IF EXISTS articles_milestone_fkey;
   ```

2. **Import articles without milestone_code:**
   - Set `milestone_code = NULL` in CSV
   - Focus on `category`, `age_months_min/max`, `focus_area`, `description`
   - Let AI match articles to milestones

3. **Optional: Add milestone_code for reference:**
   - Can still include `milestone_code` in CSV for tracking
   - But it's not required or enforced
   - AI will match even if `milestone_code` is NULL

---

## Example Article Storage

### Category-Level Article (No Specific Milestone):
```json
{
  "title": "Social-Emotional Development Guide",
  "url": "https://cdc.gov/...",
  "category": "Social-Emotional",
  "focus_area": "Typically Developing",
  "age_months_min": 12,
  "age_months_max": 24,
  "milestone_code": null,  // NULL = applies to all milestones in category
  "priority": 7
}
```

### Focus-Area Specific Article:
```json
{
  "title": "Language Development in Down Syndrome",
  "url": "https://healthychildren.org/...",
  "category": "Language/Communication",
  "focus_area": "Down Syndrome",
  "age_months_min": 12,
  "age_months_max": 36,
  "milestone_code": null,  // NULL = AI matches to relevant milestones
  "priority": 9
}
```

### Reference Article (With milestone_code for tracking):
```json
{
  "title": "Specific Milestone Support",
  "url": "https://cdc.gov/...",
  "category": "Motor",
  "focus_area": "Typically Developing",
  "age_months_min": 6,
  "age_months_max": 12,
  "milestone_code": "M-6-1",  // Optional reference, not enforced
  "priority": 10
}
```

---

## Updated Perplexity Prompt

When generating articles, focus on:

1. **Category** - Must match milestone category
2. **Age Range** - Should cover milestone age ±3 months
3. **Focus Area** - Match child's condition (if applicable)
4. **Description** - Rich, semantic description for AI matching
5. **milestone_code** - Optional, can be NULL

**Example Prompt Addition:**
```
When generating articles, focus on:
- Category matching (Social-Emotional, Language/Communication, Motor, Cognitive)
- Age-appropriate content (age_months_min to age_months_max)
- Focus area specificity (if applicable)
- Rich descriptions for AI semantic matching

milestone_code is optional - can be NULL. AI will match articles based on category, age, and description.
```

---

## Summary

✅ **Removed**: Foreign key constraint on `milestone_code`  
✅ **Kept**: `milestone_code` column (optional, for reference)  
✅ **Focus**: Category, age range, focus_area, description for AI matching  
✅ **Benefit**: More flexible, AI-driven article selection  
✅ **Result**: No import errors, smarter article matching

