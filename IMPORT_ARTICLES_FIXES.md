# Fixing Article Import Errors

## Error 1: Foreign Key Constraint Violation

**Error**: 
```
ERROR: 23503: insert or update on table "articles" violates foreign key constraint "articles_milestone_fkey"
DETAIL: Key (milestone_code)=(COG-2-1) is not present in table "milestones"
```

**Cause**: The `articles` table has a foreign key constraint that requires every `milestone_code` to exist in the `milestones` table. If you're importing an article with a `milestone_code` that doesn't exist, the import fails.

**Solutions**:

### Option 1: Make Foreign Key Allow NULL (Recommended)

Run the migration: `20251123_make_articles_milestone_code_nullable.sql`

This allows:
- Articles with `milestone_code = NULL` (category-level articles)
- Articles with valid `milestone_code` values
- Foreign key only checks when `milestone_code` is NOT NULL

### Option 2: Remove Foreign Key Constraint Entirely

```sql
ALTER TABLE public.articles 
DROP CONSTRAINT IF EXISTS articles_milestone_fkey;
```

**Warning**: This removes referential integrity. Invalid milestone codes can be stored.

### Option 3: Fix Your Data Before Import

**Check which milestone_codes don't exist:**

```sql
-- Get list of milestone_codes from your CSV that don't exist
SELECT DISTINCT milestone_code 
FROM (
  -- Your CSV data here
  VALUES 
    ('COG-2-1'),
    ('SE-12-1'),
    -- ... other milestone codes from CSV
) AS csv_milestones(milestone_code)
WHERE milestone_code IS NOT NULL
AND milestone_code NOT IN (
  SELECT milestone_code FROM milestones WHERE milestone_code IS NOT NULL
);
```

**Then either:**
1. Set those `milestone_code` values to `NULL` in your CSV
2. Add the missing milestones to the `milestones` table
3. Fix typos in milestone codes

---

## Error 2: Duplicate URL (if constraint still exists)

**Error**:
```
ERROR: 23505: duplicate key value violates unique constraint "articles_url_unique"
```

**Solution**: Run migration `20251123_remove_articles_url_unique_constraint.sql` to allow duplicate URLs.

---

## Recommended Approach

### Step 1: Run Migrations

1. **Remove URL unique constraint** (if you want duplicate URLs):
   ```sql
   ALTER TABLE public.articles 
   DROP CONSTRAINT IF EXISTS articles_url_unique;
   ```

2. **Make milestone_code foreign key nullable-friendly**:
   ```sql
   ALTER TABLE public.articles 
   DROP CONSTRAINT IF EXISTS articles_milestone_fkey;
   
   ALTER TABLE public.articles
   ADD CONSTRAINT articles_milestone_fkey 
   FOREIGN KEY (milestone_code) 
   REFERENCES public.milestones(milestone_code)
   ON DELETE SET NULL;
   ```

### Step 2: Clean Your CSV Data

Before importing, check for invalid milestone codes:

```sql
-- In Excel/Google Sheets, create a list of valid milestone codes
-- Export from Supabase:
SELECT milestone_code FROM milestones WHERE is_active = true;

-- Then in your CSV, use VLOOKUP to validate milestone_code
-- Set invalid ones to NULL or empty
```

### Step 3: Import Strategy

**For articles with invalid milestone codes:**
- Set `milestone_code = NULL` (makes it a category-level article)
- The article will still be retrieved by category matching
- You can update `milestone_code` later when the milestone is added

---

## Quick Fix for Current Error

**Immediate solution** - Set invalid milestone codes to NULL:

1. **In your CSV**, find rows with `milestone_code = 'COG-2-1'` (or other invalid codes)
2. **Set those to empty/NULL** in Excel
3. **Re-import** the CSV

Or use SQL to import with NULL for invalid codes:

```sql
INSERT INTO articles (
  title, url, source, description,
  milestone_code, category, focus_area,
  age_months_min, age_months_max,
  priority, is_backup, is_featured, validation_status
)
SELECT 
  title, url, source, description,
  CASE 
    WHEN milestone_code IN (SELECT milestone_code FROM milestones) 
    THEN milestone_code 
    ELSE NULL 
  END as milestone_code,
  category, focus_area,
  age_months_min, age_months_max,
  priority, is_backup, is_featured, validation_status
FROM your_csv_data;
```

---

## Verification Queries

**Check for invalid milestone codes in your CSV:**

```sql
-- Replace with your actual CSV data
WITH csv_data AS (
  SELECT DISTINCT milestone_code 
  FROM (
    VALUES 
      ('COG-2-1'),
      ('SE-12-1'),
      -- ... your milestone codes
  ) AS t(milestone_code)
  WHERE milestone_code IS NOT NULL
)
SELECT 
  csv.milestone_code,
  CASE 
    WHEN m.milestone_code IS NULL THEN 'INVALID - Not in milestones table'
    ELSE 'VALID'
  END as status
FROM csv_data csv
LEFT JOIN milestones m ON m.milestone_code = csv.milestone_code
WHERE m.milestone_code IS NULL;
```

---

## Summary

**The foreign key constraint requires:**
- Every `milestone_code` in `articles` must exist in `milestones`
- If `milestone_code` is NULL, the constraint is not checked (allowed)

**Best practice:**
- Run the migration to make the foreign key nullable-friendly
- Set invalid `milestone_code` values to NULL in your CSV
- Import as category-level articles (they'll still be retrieved by category)

