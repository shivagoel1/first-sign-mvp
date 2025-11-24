# Importing Articles to Supabase - Handling Duplicates

## The Constraint (Optional)

The `articles` table can have a **UNIQUE constraint** on the `url` column:

```sql
url text NOT NULL UNIQUE,
CONSTRAINT articles_url_unique UNIQUE (url)
```

**Note**: If you've removed this constraint (see migration `20251123_remove_articles_url_unique_constraint.sql`), you can store duplicate URLs. This allows the same article to be linked to multiple milestones.

**If constraint exists**: This prevents duplicate articles from being stored. The same article URL should only exist once in the database, even if it's relevant to multiple milestones.

---

## The Problem

When importing articles from Perplexity CSV, you might encounter:
- **Same article for multiple milestones** (e.g., a general CDC article relevant to multiple milestones)
- **Re-importing the same batch** (accidentally importing twice)
- **Articles already in database** (from previous imports)

---

## Solutions

### Option 1: Skip Duplicates (Recommended)

Use `ON CONFLICT DO NOTHING` to skip duplicate URLs:

```sql
-- Import CSV with duplicate handling
INSERT INTO articles (
  title, url, source, description,
  milestone_code, category, focus_area,
  age_months_min, age_months_max,
  priority, is_backup, is_featured, validation_status
)
SELECT 
  title, url, source, description,
  milestone_code, category, focus_area,
  age_months_min, age_months_max,
  priority, is_backup, is_featured, validation_status
FROM (
  -- Your CSV data here
  VALUES
    ('Article Title', 'https://www.cdc.gov/...', 'CDC', 'Description', 'SE-12-1', 'Social-Emotional', 'Typically Developing', 9, 15, 10, true, false, 'pending')
    -- ... more rows
) AS csv_data(title, url, source, description, milestone_code, category, focus_area, age_months_min, age_months_max, priority, is_backup, is_featured, validation_status)
ON CONFLICT (url) DO NOTHING;
```

**Note**: Supabase's CSV import UI doesn't support `ON CONFLICT`. You'll need to use SQL Editor or a script.

---

### Option 2: Update Existing Records

If you want to update existing articles (e.g., change priority, add milestone_code), use `ON CONFLICT DO UPDATE`:

```sql
INSERT INTO articles (
  title, url, source, description,
  milestone_code, category, focus_area,
  age_months_min, age_months_max,
  priority, is_backup, is_featured, validation_status
)
VALUES
  -- Your data here
ON CONFLICT (url) 
DO UPDATE SET
  -- Update fields if needed (optional)
  priority = GREATEST(articles.priority, EXCLUDED.priority), -- Keep higher priority
  updated_at = now();
```

---

### Option 3: Check for Duplicates Before Import

**Step 1: Check for existing URLs in your CSV**

```sql
-- First, create a temporary table with your CSV data
-- (Or use Supabase's CSV import to a temp table)

-- Then check for duplicates
SELECT 
  csv.url,
  CASE 
    WHEN a.id IS NOT NULL THEN 'EXISTS'
    ELSE 'NEW'
  END as status,
  a.title as existing_title
FROM (
  -- Your CSV data here
  SELECT DISTINCT url FROM your_csv_data
) csv
LEFT JOIN articles a ON a.url = csv.url
ORDER BY status;
```

**Step 2: Filter out duplicates in Excel/CSV**

Before importing, remove rows where the URL already exists in the database.

---

### Option 4: Use Supabase Import with Pre-filtering

**In Excel/Google Sheets:**

1. Export existing articles from Supabase:
   ```sql
   SELECT url FROM articles;
   ```

2. In your CSV, add a column to check if URL exists:
   - Use `VLOOKUP` or `XLOOKUP` to check against existing URLs
   - Filter out rows where URL already exists
   - Import only new articles

3. Import the filtered CSV to Supabase

---

## Recommended Workflow

### For Initial Import:

1. **Check for existing articles:**
   ```sql
   SELECT COUNT(*) FROM articles;
   ```

2. **If database is empty**, import directly via Supabase UI

3. **If database has articles**, use Option 1 (SQL with ON CONFLICT)

### For Subsequent Imports:

1. **Export existing URLs:**
   ```sql
   SELECT url FROM articles;
   ```

2. **Filter CSV in Excel** to remove duplicate URLs

3. **Import filtered CSV** via Supabase UI

---

## SQL Script for Safe Import

Create a function to safely import articles:

```sql
-- Function to import articles with duplicate handling
CREATE OR REPLACE FUNCTION import_articles_safe(
  p_title text,
  p_url text,
  p_source text,
  p_description text,
  p_milestone_code text,
  p_category text,
  p_focus_area text,
  p_age_months_min integer,
  p_age_months_max integer,
  p_priority integer,
  p_is_backup boolean DEFAULT true,
  p_is_featured boolean DEFAULT false,
  p_validation_status text DEFAULT 'pending'
)
RETURNS uuid AS $$
DECLARE
  v_article_id uuid;
BEGIN
  INSERT INTO articles (
    title, url, source, description,
    milestone_code, category, focus_area,
    age_months_min, age_months_max,
    priority, is_backup, is_featured, validation_status
  )
  VALUES (
    p_title, p_url, p_source, p_description,
    p_milestone_code, p_category, p_focus_area,
    p_age_months_min, p_age_months_max,
    p_priority, p_is_backup, p_is_featured, p_validation_status
  )
  ON CONFLICT (url) DO UPDATE SET
    -- Update only if new data is more specific (higher priority)
    priority = GREATEST(articles.priority, EXCLUDED.priority),
    updated_at = now()
  RETURNING id INTO v_article_id;
  
  RETURN v_article_id;
END;
$$ LANGUAGE plpgsql;
```

---

## Quick Fix for Current Error

If you're getting the error right now:

1. **Check which URLs already exist:**
   ```sql
   SELECT url, title, milestone_code 
   FROM articles 
   WHERE url IN (
     -- List of URLs from your CSV that are failing
     'https://www.cdc.gov/act-early/milestones/2-months.html',
     -- ... other URLs
   );
   ```

2. **Remove those URLs from your CSV** and re-import

3. **Or use SQL import** with `ON CONFLICT DO NOTHING` (see Option 1)

---

## Why This Constraint Exists

- **Prevents duplicate articles**: Same article shouldn't be stored multiple times
- **Saves storage**: One article can be linked to multiple milestones via `milestone_code`
- **Maintains data integrity**: One source of truth for each article URL
- **Easier updates**: Update article once, affects all references

**Note**: If an article is relevant to multiple milestones, you can:
- Store it once with `milestone_code = NULL` (category-level article)
- Or store it with one `milestone_code` and let the query logic match it to other milestones

---

## Summary

- **Constraint**: `UNIQUE (url)` prevents duplicate URLs
- **Solution**: Use `ON CONFLICT DO NOTHING` in SQL, or filter CSV before import
- **Best Practice**: Check for existing URLs before importing

