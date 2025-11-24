# Perplexity Prompt - Ready to Use

## Copy and Paste This Prompt into Perplexity

```
I need you to find authoritative, evidence-based articles from CDC (cdc.gov), American Academy of Pediatrics (AAP/HealthyChildren.org), or other reputable pediatric health sources for the milestones provided in the attached file.

## Context
I've attached a file containing developmental milestones that need support articles. Each milestone includes:
- milestone_code: Unique identifier (optional reference only)
- category: Developmental category (Social-Emotional, Language/Communication, Motor, Cognitive)
- age_months: Child's age in months
- question: The milestone question
- description: What the milestone is about
- focus_area: Focus area (Typically Developing, Down Syndrome, Cerebral Palsy, Autism Spectrum Disorder)
- concern_narrative: What the concern is (why support is needed)

## Requirements

1. **Source Requirements:**
   - Articles MUST be from official sources:
     - CDC.gov (Centers for Disease Control and Prevention)
     - HealthyChildren.org (American Academy of Pediatrics)
     - AAP.org (American Academy of Pediatrics)
     - Other medical institutions (Mayo Clinic, Cleveland Clinic, etc.)
   - NO blog posts, forums, or non-medical sources
   - NO URL shorteners or redirect links

2. **Article Requirements:**
   - Articles must be directly relevant to the specific milestone
   - Articles must address the concern described in concern_narrative
   - Articles must be age-appropriate for the milestone's age_months
   - Articles should be tailored to the focus_area when specified (e.g., Down Syndrome-specific resources)
   - Articles should be actionable (provide tips/strategies)
   - Articles should be parent-friendly (not too technical)
   - **Important**: Articles are stored generically and AI matches them based on category, age, and description. milestone_code is optional and can be NULL.

3. **URL Validation:**
   - Verify that each URL is accessible (returns 200 OK)
   - Use the EXACT URL from the source website
   - Do NOT use shortened URLs or redirects

4. **Quantity:**
   - Find 2-3 articles per milestone
   - Prioritize CDC articles first, then AAP/HealthyChildren, then other medical sources
   - **Important**: Articles are stored generically and AI matches them based on category, age, and description. milestone_code is optional and can be NULL.

## Output Format

Provide your response as a **CSV/Excel file** with the following columns (ready for Supabase import):

| title | url | source | description | milestone_code | category | focus_area | age_months_min | age_months_max | priority | is_backup | is_featured | validation_status |
|-------|-----|--------|-------------|----------------|----------|------------|----------------|----------------|----------|-----------|-------------|-------------------|
| Article Title | https://full-url-here | CDC | Brief description | SE-12-1 | Social-Emotional | Typically Developing | 9 | 15 | 10 | true | false | pending |
| Another Article | https://another-url | HealthyChildren | Description | SE-12-1 | Social-Emotional | Down Syndrome | 12 | 18 | 8 | true | false | pending |
| Language Development Guide | https://www.cdc.gov/... | CDC | Comprehensive guide to language milestones |  | Language/Communication | Typically Developing | 12 | 24 | 8 | true | true | pending |

### Column Specifications:

- **title**: Full article title (as it appears on the website)
- **url**: Complete, exact URL (no shorteners)
- **source**: One of: CDC, HealthyChildren, AAP, Other
- **description**: 1-2 sentence description of article content and relevance - **IMPORTANT for AI semantic matching**
- **milestone_code**: Optional - can be NULL or empty. Used for reference only, not enforced. AI will match articles based on category, age, and description, not milestone_code.
- **category**: Copy from input file (Social-Emotional, Language/Communication, Motor, Cognitive) - **REQUIRED for AI matching**
- **focus_area**: Copy from input file (Typically Developing, Down Syndrome, Cerebral Palsy, Autism Spectrum Disorder, or NULL for general) - **IMPORTANT for AI matching**
- **age_months_min**: Age range minimum (milestone age - 3 months, or null for general)
- **age_months_max**: Age range maximum (milestone age + 3 months, or null for general)
- **priority**: Relevance score 1-10 (10 = exact match, 8-9 = very relevant, 6-7 = relevant, 4-5 = somewhat relevant)
- **is_backup**: Always "true" (these are backup articles)
- **is_featured**: "true" for CDC articles, "false" for others
- **validation_status**: Always "pending" (will be validated later)

### Priority Scoring Guide:
- **10**: Exact match + age match + CDC source + high relevance + focus_area match
- **9**: Exact match + age match + AAP/HealthyChildren source + high relevance + focus_area match
- **8**: Exact match + age match + other medical source + high relevance
- **7**: Category match + age match + CDC source + high relevance
- **6**: Category match + age match + other source + medium relevance
- **5**: Category match only (any age) + medium relevance
- **4**: General article (low specificity)

### Age Range Guidelines:
- For milestone at 12 months: age_months_min = 9, age_months_max = 15
- For milestone at 18 months: age_months_min = 15, age_months_max = 21
- For milestone at 24 months: age_months_min = 21, age_months_max = 27
- For general articles: age_months_min = null, age_months_max = null

## Instructions

1. Read the attached milestone data file
2. For EACH milestone, find 2-3 relevant articles
   - If focus_area is specified (e.g., "Down Syndrome"), prioritize articles specific to that condition
   - If focus_area is "Typically Developing" or NULL, use general developmental articles
3. Verify each URL is accessible
4. Generate the CSV/Excel file with all articles
5. **CRITICAL: Use EXACT column names matching the database schema:**
   - `source` (singular, NOT "sources")
   - `milestone_code` (full name, NOT "milestone_cc")
   - `age_months_min` and `age_months_max` (separate columns, NOT "age_months")
   - `priority` (separate column, NOT combined with age)
   - `validation_status` (full name, NOT "validation_st")
6. Ensure all required columns are filled (including focus_area)
7. Double-check URLs are exact and accessible
8. For milestones with specific focus areas, ensure articles are condition-appropriate
9. **milestone_code can be NULL or empty** - AI will match articles based on category, age, focus_area, and description

## Example Output Rows (CSV Format)

```
title,url,source,description,milestone_code,category,focus_area,age_months_min,age_months_max,priority,is_backup,is_featured,validation_status
"Supporting Your Child's Social-Emotional Development","https://www.cdc.gov/ncbddd/actearly/milestones/milestones-12mo.html","CDC","CDC milestone guide for 12-month social-emotional development, including tips for parents","SE-12-1","Social-Emotional","Typically Developing",9,15,10,true,true,"pending"
"Social-Emotional Development in Children with Down Syndrome","https://www.healthychildren.org/...","HealthyChildren","Article about social-emotional milestones for children with Down Syndrome","SE-12-1","Social-Emotional","Down Syndrome",9,15,9,true,false,"pending"
"Language Development Guide","https://www.cdc.gov/...","CDC","Comprehensive guide to language milestones and support strategies","","Language/Communication","Typically Developing",12,24,8,true,true,"pending"
```

**Important Column Name Requirements:**
- ✅ `source` (singular, NOT "sources")
- ✅ `milestone_code` (NOT "milestone_cc")
- ✅ `age_months_min` and `age_months_max` (separate columns, NOT "age_months")
- ✅ `priority` (separate column, NOT "age_months_priority")
- ✅ `validation_status` (full name, NOT "validation_st")

**Note**: The third example shows `milestone_code` as empty string (which becomes NULL in database) - this is a category-level article that AI will match to multiple milestones.

Please process the attached file and provide the articles in CSV/Excel format ready for database import.
```

---

## How to Use

1. **Export your milestone data** from Supabase using this query:
   ```sql
   SELECT 
     m.milestone_code,
     m.category,
     m.age_months,
     m.question,
     m.description,
     COALESCE(c.focusarea, 'Typically Developing') as focus_area,
     c.concernnarrative as concern_narrative
   FROM milestones m
   LEFT JOIN cdcguidelines c ON c.guidelinecode = m.milestone_code
   WHERE m.is_active = true
   ORDER BY m.category, m.age_months, c.focusarea;
   ```

2. **Save as CSV** with columns: `milestone_code`, `category`, `age_months`, `question`, `description`, `focus_area`, `concern_narrative`

3. **Open Perplexity** and upload your CSV file

4. **Copy and paste the prompt above** into Perplexity

5. **Request CSV output** - Perplexity will generate articles in CSV format

6. **Review and import** - Check the CSV, then import to Supabase

---

## Key Points for Perplexity

- **milestone_code is optional** - Can be NULL or empty
- **Focus on category, age, focus_area, description** - These are what AI uses for matching
- **Rich descriptions** - Help AI with semantic matching
- **Verify URLs** - Make sure they're accessible
- **2-3 articles per milestone** - Quality over quantity

---

## CSV Import to Supabase

After Perplexity generates the CSV:

1. **Open Supabase Dashboard** → Table Editor → `articles` table
2. **Click "Insert" → "Import data from CSV"**
3. **Upload the CSV**
4. **Map columns** (should auto-match)
5. **Import**

**Note**: If you get errors about duplicate URLs or invalid milestone codes:
- Duplicate URLs: That's fine now (constraint removed)
- Invalid milestone codes: Set those to NULL/empty in CSV

