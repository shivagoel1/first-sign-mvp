# Implementation Next Steps

## ✅ Completed Steps

1. **Database Schema**: Articles table already exists in Supabase
2. **Indexes Migration**: Created `20251123_add_articles_indexes.sql`
3. **TypeScript Implementation**: Added `getBackupArticlesFromDatabase` function
4. **Integration**: Updated `getHybridArticleRecommendations` to use database articles
5. **Type Updates**: Added `milestoneCode` to `ArticleSearchParams`

---

## 📋 Next Steps

### Step 1: Run Database Migration

```bash
# Apply the indexes migration
# In Supabase Dashboard: SQL Editor → Run the migration file
# Or use Supabase CLI:
supabase migration up
```

**Migration File**: `supabase/migrations/20251123_add_articles_indexes.sql`

This creates indexes for:
- Category filtering
- Milestone code filtering
- Age range queries
- Validation status filtering
- Priority-based ordering
- Source filtering

---

### Step 2: Collect Articles Using Perplexity

1. **Export Milestone Data**:
   ```sql
   -- Export milestones that commonly need support
   -- Includes focus_area and concern_narrative for more targeted article generation
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
   
   **Note**: 
   - The query uses `LEFT JOIN` because not all milestones may have a corresponding `cdcguidelines` entry. 
   - If no focus area is found, it defaults to 'Typically Developing'.
   - `concern_narrative` will be NULL for milestones without a `cdcguidelines` entry. You can manually add concern narratives or leave them blank for Perplexity to infer from the milestone description.

2. **Create CSV/Excel File** with columns:
   - `milestone_code`
   - `category`
   - `age_months`
   - `question`
   - `description`
   - `concern_narrative` (add this manually or use a template)

3. **Use Perplexity Prompt**:
   - Open `PERPLEXITY_EXCEL_PROMPT.md`
   - Copy the prompt
   - Upload your milestone CSV to Perplexity
   - Request CSV output format

4. **Review and Clean**:
   - Check URLs are correct
   - Remove duplicates
   - Verify all required fields are filled
   - Adjust priority scores if needed

---

### Step 3: Import Articles to Supabase

**Option A: CSV Import (Recommended)**

1. Open Supabase Dashboard
2. Go to Table Editor → `articles` table
3. Click "Insert" → "Import data from CSV"
4. Upload the CSV from Perplexity
5. Map columns (should auto-match)
6. Click "Import"

**Option B: SQL Insert**

```sql
-- Example insert (adjust values)
INSERT INTO articles (
  title, url, source, description,
  milestone_code, category,
  age_months_min, age_months_max,
  priority, is_backup, is_featured, validation_status
) VALUES
  (
    'Article Title',
    'https://www.cdc.gov/...',
    'CDC',
    'Description here',
    'SE-12-1',
    'Social-Emotional',
    9,
    15,
    10,
    true,
    true,
    'pending'
  );
```

---

### Step 4: Validate URLs

Create a validation script or use the existing validation function:

```typescript
// In article-agent.ts, the getBackupArticlesFromDatabase function
// already validates URLs before returning articles
// But you can also create a batch validation script
```

**Manual Validation** (for initial import):

1. Spot-check 10-20 URLs manually
2. Update validation status:
   ```sql
   UPDATE articles 
   SET validation_status = 'valid',
       is_validated = true,
       validation_date = now(),
       last_checked_at = now()
   WHERE url = 'https://...';
   ```

**Automated Validation** (recommended):

Create a script to validate all pending articles:

```typescript
// scripts/validate-articles.ts
import { createAdminClient } from '@/lib/supabase/admin'
import { isUrlAccessible } from '@/lib/articles/article-agent'

async function validateAllArticles() {
  const supabase = createAdminClient()
  
  // Get all pending articles
  const { data: articles } = await supabase
    .from('articles')
    .select('id, url')
    .eq('validation_status', 'pending')
  
  if (!articles) return
  
  for (const article of articles) {
    const isValid = await isUrlAccessible(article.url)
    
    await supabase
      .from('articles')
      .update({
        validation_status: isValid ? 'valid' : 'invalid',
        is_validated: isValid,
        validation_date: new Date().toISOString(),
        last_checked_at: new Date().toISOString(),
      })
      .eq('id', article.id)
    
    console.log(`${article.url}: ${isValid ? 'valid' : 'invalid'}`)
  }
}
```

---

### Step 5: Update combine-pages.ts to Pass milestoneCode

The `combinePages` function should pass `milestoneCode` to `getHybridArticleRecommendations`:

```typescript
// In lib/ai/combine-pages.ts
// When calling getHybridArticleRecommendations, add milestoneCode:

await getHybridArticleRecommendations(
  {
    category: page.category,
    ageMonths: page.age_months,
    milestoneCode: page.milestone_code, // ← Add this
    milestoneDescription: page.display_text,
    status: page.status === 'missed' ? 'missed' : 'met',
  },
  1, // minArticles
  3  // maxArticles
)
```

---

### Step 6: Test the Integration

1. **Test Database Query**:
   ```typescript
   // Test in a Next.js API route or script
   import { getBackupArticlesFromDatabase } from '@/lib/articles/article-agent'
   
   const articles = await getBackupArticlesFromDatabase(
     'Social-Emotional',
     12,
     'SE-12-1',
     3
   )
   console.log('Articles:', articles)
   ```

2. **Test Full Flow**:
   - Create a test assessment
   - Generate storybook
   - Check if articles appear for "missed" milestones
   - Verify articles are from database (check console logs)

3. **Verify Priority Order**:
   - AI articles should appear first
   - Database articles should appear second
   - Static articles should appear third

---

### Step 7: Monitor and Optimize

1. **Track Article Usage**:
   ```sql
   -- See which articles are used most
   SELECT 
     a.title,
     a.url,
     a.times_used,
     a.last_used_at
   FROM articles a
   ORDER BY a.times_used DESC
   LIMIT 20;
   ```

2. **Identify Gaps**:
   ```sql
   -- Find milestones without articles
   SELECT m.milestone_code, m.category, m.age_months
   FROM milestones m
   LEFT JOIN articles a ON a.milestone_code = m.milestone_code
   WHERE a.id IS NULL
   AND m.is_active = true
   ORDER BY m.category, m.age_months;
   ```

3. **Update Priority Scores**:
   - Based on usage patterns
   - Based on relevance feedback
   - Based on source quality

---

### Step 8: Periodic Maintenance

**Weekly Tasks:**
- Validate new articles (if any added)
- Check for broken URLs (404s)
- Review article usage statistics

**Monthly Tasks:**
- Re-validate all articles (URLs can break)
- Add articles for new milestones
- Update priority scores based on usage
- Remove or replace invalid articles

**Automated Validation Job** (optional):

Create a cron job or scheduled function to validate articles:

```sql
-- Supabase Edge Function or cron job
-- Validate articles with validation_status = 'valid' every week
-- Update status if URL becomes invalid
```

---

## 🎯 Success Criteria

- ✅ All milestones have at least 1 backup article
- ✅ >95% of articles are validated (validation_status = 'valid')
- ✅ Articles appear correctly in storybook for "missed" milestones
- ✅ Priority order works: AI → Database → Static
- ✅ No "no articles available" errors
- ✅ Articles are relevant and helpful to parents

---

## 📝 Notes

1. **Article Source Mapping**:
   - `CDC` → `source = 'CDC'` in ArticleRecommendation
   - `HealthyChildren` or `AAP` → `source = 'APP'` in ArticleRecommendation
   - `Other` → `source = 'EXTERNAL'` in ArticleRecommendation

2. **Age Range Logic**:
   - If `age_months_min` and `age_months_max` are both null → applies to all ages
   - If only one is set → use that as the boundary
   - If both are set → age must fall within range

3. **Milestone Code**:
   - If `milestone_code` is provided → get exact match articles first
   - Then fall back to category-level articles (milestone_code IS NULL)
   - This ensures specific articles are prioritized

4. **Validation**:
   - Articles are validated when retrieved (in `getBackupArticlesFromDatabase`)
   - But initial validation should be done after import
   - Periodic re-validation ensures URLs stay valid

---

## 🚀 Quick Start Checklist

- [ ] Run database migration (indexes)
- [ ] Export milestone data to CSV
- [ ] Use Perplexity to generate articles (CSV format)
- [ ] Review and clean CSV
- [ ] Import articles to Supabase
- [ ] Validate URLs (manual or automated)
- [ ] Update `combine-pages.ts` to pass `milestoneCode`
- [ ] Test article retrieval
- [ ] Test full storybook generation
- [ ] Monitor article usage
- [ ] Fill gaps for milestones without articles

---

## 📚 Related Files

- `lib/articles/article-agent.ts` - Main article retrieval logic
- `lib/ai/combine-pages.ts` - Storybook page combination (calls article retrieval)
- `supabase/migrations/20251123_add_articles_indexes.sql` - Database indexes
- `PERPLEXITY_EXCEL_PROMPT.md` - Perplexity prompt for article collection
- `ARTICLES_DATABASE_PLAN.md` - Complete database plan

