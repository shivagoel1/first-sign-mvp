# Perplexity Prompt for Excel Article Collection

## Overview
This prompt is designed to work with Perplexity's file upload feature. You can upload a table (CSV/Excel) of milestones, and Perplexity will generate articles in Excel format that can be directly imported into Supabase.

---

## Step 1: Prepare Your Milestone Data

Create an Excel/CSV file with the following columns:

| milestone_code | category | age_months | question | description | focus_area | concern_narrative |
|---------------|----------|------------|----------|-------------|------------|------------------|
| SE-12-1 | Social-Emotional | 12 | Does your child show affection? | Child shows affection to familiar people | Typically Developing | Child does not show affection to parents |
| LC-18-2 | Language/Communication | 18 | Does your child say words? | Child says several single words | Down Syndrome | Child is not saying any words yet |
| M-6-1 | Motor | 6 | Can your child sit? | Child sits without support | Typically Developing | Child cannot sit without support |

**Note:** 
- Include only milestones that commonly need support (status: 'missed'). 
- Export from your `milestones` table with a LEFT JOIN to `cdcguidelines` to get `focus_area`.
- Focus areas: Typically Developing, Down Syndrome, Cerebral Palsy, Autism Spectrum Disorder
- If no focus area is found, use 'Typically Developing' as default.

---

## Step 2: Perplexity Prompt Template

Copy and paste this prompt into Perplexity, then upload your milestone data file:

```
I need you to find authoritative, evidence-based articles from CDC (cdc.gov), American Academy of Pediatrics (AAP/HealthyChildren.org), or other reputable pediatric health sources for the milestones provided in the attached file.

## Context
I've attached a file containing developmental milestones that need support articles. Each milestone includes:
- milestone_code: Unique identifier
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
   - Articles should be actionable (provide tips/strategies)
   - Articles should be parent-friendly (not too technical)

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

| title | url | source | description | milestone_code | category | age_months_min | age_months_max | priority | is_backup | is_featured | validation_status |
|-------|-----|--------|-------------|----------------|----------|----------------|----------------|----------|-----------|-------------|-------------------|
| Article Title | https://full-url-here | CDC | Brief description | SE-12-1 | Social-Emotional | 9 | 15 | 10 | true | false | pending |
| Another Article | https://another-url | HealthyChildren | Description | SE-12-1 | Social-Emotional | 12 | 18 | 8 | true | false | pending |

### Column Specifications:

- **title**: Full article title (as it appears on the website)
- **url**: Complete, exact URL (no shorteners)
- **source**: One of: CDC, HealthyChildren, AAP, Other
- **description**: 1-2 sentence description of article content and relevance
- **milestone_code**: Optional - can be NULL or empty. Used for reference only. AI will match articles based on category, age, and description, not milestone_code.
- **category**: Copy from input file (Social-Emotional, Language/Communication, Motor, Cognitive) - **REQUIRED for AI matching**
- **age_months_min**: Age range minimum (milestone age - 3 months, or null for general)
- **age_months_max**: Age range maximum (milestone age + 3 months, or null for general)
- **priority**: Relevance score 1-10 (10 = exact match, 8-9 = very relevant, 6-7 = relevant, 4-5 = somewhat relevant)
- **is_backup**: Always "true" (these are backup articles)
- **is_featured**: "true" for CDC articles, "false" for others
- **validation_status**: Always "pending" (will be validated later)

### Priority Scoring Guide:
- **10**: Exact milestone match + age match + CDC source + high relevance
- **9**: Exact milestone match + age match + AAP/HealthyChildren source + high relevance
- **8**: Exact milestone match + age match + other medical source + high relevance
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
3. Verify each URL is accessible
4. Generate the CSV/Excel file with all articles
5. Ensure all required columns are filled
6. Double-check URLs are exact and accessible

## Example Output Rows

```
"Supporting Your Child's Social-Emotional Development","https://www.cdc.gov/ncbddd/actearly/milestones/milestones-12mo.html","CDC","CDC milestone guide for 12-month social-emotional development, including tips for parents","SE-12-1","Social-Emotional","Typically Developing",9,15,10,true,true,"pending"
"Social-Emotional Development in Children with Down Syndrome","https://www.healthychildren.org/...","HealthyChildren","Article about social-emotional milestones for children with Down Syndrome","SE-12-1","Social-Emotional","Down Syndrome",9,15,9,true,false,"pending"
```

Please process the attached file and provide the articles in CSV/Excel format ready for database import.
```

---

## Step 3: Using the Output

### Option A: Direct CSV Import to Supabase

1. **Download the CSV from Perplexity**
2. **Open Supabase Dashboard** → Your Project → Table Editor → `articles` table
3. **Click "Insert" → "Import data from CSV"**
4. **Upload the CSV file**
5. **Map columns** (they should match automatically)
6. **Import**

### Option B: Excel → Supabase (Recommended)

1. **Open the CSV in Excel**
2. **Review and clean data:**
   - Check for duplicate URLs
   - Verify URLs are complete
   - Ensure all required fields are filled
   - Fix any formatting issues
3. **Save as CSV** (UTF-8 encoding)
4. **Import to Supabase** as above

### Option C: Manual Validation First

1. **Open CSV in Excel**
2. **Add validation column:**
   - Create a new column `url_validated`
   - Manually check a few URLs
   - Mark as "valid" or "invalid"
3. **Filter out invalid URLs**
4. **Import to Supabase**

---

## Step 4: Post-Import Validation

After importing, run a validation script to check all URLs:

```sql
-- Check for articles with invalid URLs
SELECT id, title, url, validation_status 
FROM articles 
WHERE validation_status = 'pending'
ORDER BY created_at DESC;
```

Then update validation status based on URL checks.

---

## Tips for Best Results

1. **Batch Processing**: Process 20-30 milestones at a time (not all at once)
2. **Review Output**: Always review the CSV before importing
3. **Check URLs**: Spot-check a few URLs to ensure they're correct
4. **Remove Duplicates**: Check for duplicate URLs across milestones
5. **Priority Scores**: Adjust priority scores if needed (higher = more relevant)
6. **Age Ranges**: Ensure age ranges make sense (min <= max)

---

## Alternative: Category-Level Articles

If you want general category-level articles (not milestone-specific), use this prompt:

```
I need authoritative articles from CDC, AAP, or HealthyChildren.org about [CATEGORY] development for children aged [AGE_RANGE] months.

Find 5-7 articles that cover:
- Developmental milestones
- Support strategies
- When to seek help
- Evidence-based interventions

Output as CSV with columns:
title, url, source, description, milestone_code, category, focus_area, age_months_min, age_months_max, priority, is_backup, is_featured, validation_status

Set milestone_code to NULL for category-level articles.
Set focus_area to NULL for general category-level articles.
Set priority to 5-7 (lower than milestone-specific articles).
```

---

## Troubleshooting

**Issue: Perplexity doesn't generate CSV**
- Ask explicitly: "Please provide the output as a CSV file that I can download"
- Or: "Format the response as a table that I can copy to Excel"

**Issue: URLs are incorrect**
- Ask: "Please verify each URL is accessible and provide the exact URL from the source website"
- Check a few URLs manually before importing

**Issue: Too many/few articles**
- Specify: "Find exactly 2-3 articles per milestone"
- Or: "Find 5-7 category-level articles"

**Issue: Wrong sources**
- Remind: "Only use CDC, AAP, HealthyChildren.org, or medical institutions"
- Filter out any non-medical sources

---

## Next Steps After Import

1. ✅ **Validate URLs**: Run URL validation script
2. ✅ **Update validation_status**: Mark valid articles as 'valid'
3. ✅ **Test Article Retrieval**: Test `getBackupArticlesFromDatabase` function
4. ✅ **Monitor Usage**: Track which articles are most helpful
5. ✅ **Add More Articles**: Fill gaps for milestones without articles

