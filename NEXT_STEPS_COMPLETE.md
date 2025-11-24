# Complete Next Steps Guide

## ✅ What's Done

1. ✅ Database schema created (`articles` table)
2. ✅ Code updated (`getBackupArticlesFromDatabase` function)
3. ✅ Integration complete (`getHybridArticleRecommendations` uses database)
4. ✅ Articles inserted into database
5. ✅ Perplexity prompts created

---

## 📋 Next Steps (In Order)

### Step 1: Run Database Migrations ⚠️ REQUIRED

Run these migrations in Supabase SQL Editor:

#### 1.1 Remove Foreign Key Constraint
```sql
-- File: supabase/migrations/20251123_update_articles_for_ai_driven_approach.sql
ALTER TABLE public.articles 
DROP CONSTRAINT IF EXISTS articles_milestone_fkey;
```

#### 1.2 Add Indexes (For Performance)
```sql
-- File: supabase/migrations/20251123_add_articles_indexes.sql
-- Run the entire file
```

#### 1.3 Add RLS Policies (For Security)
```sql
-- File: supabase/migrations/20251123_add_articles_rls_policies.sql
-- Run the entire file
```

#### 1.4 Optional: Remove URL Unique Constraint
```sql
-- File: supabase/migrations/20251123_remove_articles_url_unique_constraint.sql
-- Only if you want duplicate URLs
ALTER TABLE public.articles 
DROP CONSTRAINT IF EXISTS articles_url_unique;
```

**How to Run:**
1. Open Supabase Dashboard → SQL Editor
2. Copy and paste each migration
3. Click "Run"
4. Verify no errors

---

### Step 2: Validate Articles ⚠️ REQUIRED

Articles are currently `validation_status = 'pending'`. They need to be validated to be used.

#### Option A: Mark All as Valid (Quick - If You Trust URLs)

If you trust the URLs from Perplexity are correct:

```sql
UPDATE public.articles
SET 
  validation_status = 'valid',
  is_validated = true,
  validation_date = now(),
  last_checked_at = now()
WHERE validation_status = 'pending';
```

#### Option B: Run Validation Script (Recommended)

Validate URLs automatically:

```bash
npx tsx scripts/validate-articles.ts
```

This will:
- Check each URL (HEAD/GET request)
- Update to `'valid'` if accessible
- Update to `'invalid'` if 404/error
- Update to `'timeout'` if request times out

**Note**: Only articles with `validation_status = 'valid'` are returned by `getBackupArticlesFromDatabase`.

---

### Step 3: Test Article Retrieval

Verify articles are being retrieved from the database:

#### 3.1 Test Database Query

```sql
-- Check if articles are being retrieved
SELECT 
  category,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE validation_status = 'valid') as valid,
  COUNT(*) FILTER (WHERE validation_status = 'pending') as pending
FROM articles
GROUP BY category;
```

#### 3.2 Test in Code

Create a test API route or run in console:

```typescript
// Test article retrieval
import { getBackupArticlesFromDatabase } from '@/lib/articles/article-agent'

const articles = await getBackupArticlesFromDatabase(
  'Social-Emotional',  // category
  12,                  // ageMonths
  undefined,           // milestoneCode (optional)
  3                    // limit
)

console.log('Articles found:', articles)
```

---

### Step 4: Test Full Storybook Generation

1. **Create a test assessment** (or use existing one)
2. **Generate storybook** (or regenerate if exists)
3. **Check if articles appear** for "needs support" milestones
4. **Verify in three places:**
   - Parent dashboard storybook viewer
   - Physician review modal
   - PDF download

#### What to Check:
- ✅ Articles appear for "missed" status milestones
- ✅ Articles are relevant to the milestone
- ✅ Article links are clickable and work
- ✅ Articles match the category and age range

---

### Step 5: Monitor Article Usage

Track which articles are being used:

```sql
-- See most used articles
SELECT 
  a.title,
  a.url,
  a.times_used,
  a.last_used_at,
  a.category
FROM articles a
WHERE a.times_used > 0
ORDER BY a.times_used DESC
LIMIT 20;
```

---

### Step 6: Fill Gaps

Find milestones without articles:

```sql
-- Find categories/age ranges with few articles
SELECT 
  category,
  focus_area,
  COUNT(*) as article_count
FROM articles
WHERE validation_status = 'valid'
GROUP BY category, focus_area
ORDER BY article_count ASC;
```

Add more articles for categories with low coverage.

---

### Step 7: Periodic Maintenance

#### Weekly:
- ✅ Check for broken URLs (re-validate)
- ✅ Review article usage statistics
- ✅ Add articles for new milestones

#### Monthly:
- ✅ Re-validate all articles (URLs can break)
- ✅ Update priority scores based on usage
- ✅ Remove or replace invalid articles

---

## 🎯 Quick Checklist

- [ ] Run migration: Remove foreign key constraint
- [ ] Run migration: Add indexes
- [ ] Run migration: Add RLS policies
- [ ] Validate articles (mark as valid or run script)
- [ ] Test article retrieval (database query)
- [ ] Test full storybook generation
- [ ] Verify articles appear in storybook viewer
- [ ] Verify articles appear in physician modal
- [ ] Verify articles appear in PDF
- [ ] Monitor article usage
- [ ] Fill gaps for missing categories

---

## 🐛 Troubleshooting

### Articles Not Appearing?

1. **Check validation status:**
   ```sql
   SELECT validation_status, COUNT(*) 
   FROM articles 
   GROUP BY validation_status;
   ```
   - Only `'valid'` articles are used

2. **Check category match:**
   ```sql
   SELECT category, COUNT(*) 
   FROM articles 
   WHERE validation_status = 'valid'
   GROUP BY category;
   ```
   - Ensure articles exist for each category

3. **Check age ranges:**
   ```sql
   SELECT 
     category,
     age_months_min,
     age_months_max,
     COUNT(*) 
   FROM articles 
   WHERE validation_status = 'valid'
   GROUP BY category, age_months_min, age_months_max;
   ```
   - Ensure age ranges cover milestone ages

4. **Check console logs:**
   - Look for `[article-agent]` logs
   - Should show: "Found X valid backup articles from database"

### Articles Still Not Working?

1. **Verify migrations ran:**
   ```sql
   -- Check if foreign key constraint exists
   SELECT constraint_name 
   FROM information_schema.table_constraints 
   WHERE table_name = 'articles' 
   AND constraint_name = 'articles_milestone_fkey';
   ```
   - Should return 0 rows (constraint removed)

2. **Check indexes exist:**
   ```sql
   SELECT indexname 
   FROM pg_indexes 
   WHERE tablename = 'articles';
   ```
   - Should show multiple indexes

3. **Test database query directly:**
   ```sql
   SELECT * FROM articles 
   WHERE category = 'Social-Emotional'
   AND validation_status = 'valid'
   AND is_backup = true
   LIMIT 5;
   ```

---

## 📊 Success Criteria

✅ **Articles System is Working When:**
- Articles appear in storybook for "needs support" milestones
- Articles are relevant (match category, age, focus_area)
- Article links are clickable and work
- No "no articles available" errors
- Database articles are being used (check logs)

---

## 🚀 Priority Order

1. **HIGH**: Run migrations (constraints, indexes)
2. **HIGH**: Validate articles (change pending → valid)
3. **MEDIUM**: Test article retrieval
4. **MEDIUM**: Test full storybook generation
5. **LOW**: Monitor usage and fill gaps

---

## 📝 Summary

**Immediate Actions:**
1. Run migrations (if not done)
2. Validate articles (mark as valid or run script)
3. Test storybook generation
4. Verify articles appear

**Ongoing:**
- Monitor article usage
- Re-validate URLs periodically
- Add articles for gaps
- Update priorities based on usage

Your articles system is ready - just need to validate the articles and test!

