# CSV Column Names Reference - Database Schema Match

## ⚠️ Correct Column Names (Must Match Database)

Use these **EXACT** column names in your CSV for Supabase import:

| CSV Column Name | Database Column | Type | Required | Notes |
|----------------|-----------------|------|----------|-------|
| `title` | `title` | text | ✅ Yes | Article title |
| `url` | `url` | text | ✅ Yes | Full URL |
| `source` | `source` | text | ✅ Yes | ⚠️ **SINGULAR** "source", NOT "sources" |
| `description` | `description` | text | ❌ No | For AI semantic matching |
| `milestone_code` | `milestone_code` | text | ❌ No | ⚠️ Full name "milestone_code", NOT "milestone_cc" |
| `category` | `category` | text | ✅ Yes | Social-Emotional, Language/Communication, Motor, Cognitive |
| `focus_area` | `focus_area` | text | ❌ No | Typically Developing, Down Syndrome, etc. |
| `age_months_min` | `age_months_min` | integer | ❌ No | ⚠️ Separate column, NOT "age_months" |
| `age_months_max` | `age_months_max` | integer | ❌ No | ⚠️ Separate column, NOT "age_months" |
| `priority` | `priority` | integer | ❌ No | ⚠️ Separate column, NOT "age_months_priority" |
| `is_backup` | `is_backup` | boolean | ❌ No | Default: true |
| `is_featured` | `is_featured` | boolean | ❌ No | Default: false |
| `validation_status` | `validation_status` | text | ❌ No | ⚠️ Full name "validation_status", NOT "validation_st" |

---

## ❌ Common Mistakes (DO NOT USE)

| ❌ Wrong | ✅ Correct | Why It Matters |
|---------|-----------|----------------|
| `sources` | `source` | Database column is singular |
| `milestone_cc` | `milestone_code` | Must match exact column name |
| `age_months` | `age_months_min` + `age_months_max` | Two separate columns needed |
| `age_months_priority` | `priority` | Separate column, not combined |
| `validation_st` | `validation_status` | Must use full column name |

---

## ✅ Correct CSV Header Row

```csv
title,url,source,description,milestone_code,category,focus_area,age_months_min,age_months_max,priority,is_backup,is_featured,validation_status
```

---

## Example CSV Row (Correct Format)

```csv
"Supporting Your Child's Social-Emotional Development","https://www.cdc.gov/ncbddd/actearly/milestones/milestones-12mo.html","CDC","CDC milestone guide for 12-month social-emotional development","SE-12-1","Social-Emotional","Typically Developing",9,15,10,true,true,"pending"
```

**Column breakdown:**
1. `title`: "Supporting Your Child's Social-Emotional Development"
2. `url`: "https://www.cdc.gov/ncbddd/actearly/milestones/milestones-12mo.html"
3. `source`: "CDC" (singular)
4. `description`: "CDC milestone guide..."
5. `milestone_code`: "SE-12-1" (or empty for category-level)
6. `category`: "Social-Emotional"
7. `focus_area`: "Typically Developing"
8. `age_months_min`: 9
9. `age_months_max`: 15
10. `priority`: 10
11. `is_backup`: true
12. `is_featured`: true
13. `validation_status`: "pending"

---

## Quick Fix for Your Current CSV

If Perplexity generated CSV with wrong column names, fix in Excel:

1. **Rename columns:**
   - `sources` → `source`
   - `milestone_cc` → `milestone_code`
   - `age_months` → Split into `age_months_min` and `age_months_max`
   - `age_months_priority` → `priority`
   - `validation_st` → `validation_status`

2. **Split `age_months` column:**
   - If you have a single `age_months` column, create two new columns:
   - `age_months_min` = `age_months - 3`
   - `age_months_max` = `age_months + 3`
   - Then delete the original `age_months` column

3. **Save as CSV** and import to Supabase

---

## Verification

Before importing, verify column names match exactly:

```sql
-- Check articles table columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'articles'
ORDER BY ordinal_position;
```

Your CSV header should match these column names exactly!

