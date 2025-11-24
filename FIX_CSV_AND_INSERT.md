# Fix CSV and Generate INSERT Query

## Your Current CSV Issues

Based on your CSV, you have these column name problems:

1. **`milestone_ccategory`** - This appears to be two columns combined
2. **`age_months_age_months_priority`** - This is three columns combined (min, max, priority)
3. **`validation_st`** - Should be `validation_status`

---

## Quick Fix in Excel

### Step 1: Fix Column Names

1. **Split `milestone_ccategory`:**
   - If it contains values like "SE-12-1|Social-Emotional":
     - Create new column `milestone_code`: Extract part before `|`
     - Keep `category`: Extract part after `|`
   - If it's just category, set `milestone_code` to empty/NULL

2. **Split `age_months_age_months_priority`:**
   - If format is "9|15|10" (min|max|priority):
     - Create `age_months_min`: Extract first number
     - Create `age_months_max`: Extract second number  
     - Create `priority`: Extract third number
   - Use Excel formula: `=LEFT(age_months_age_months_priority, FIND("|", age_months_age_months_priority)-1)`

3. **Rename `validation_st`** → `validation_status`

### Step 2: Generate INSERT Query

Use this Excel formula in a new column (adjust column letters):

```excel
="(" & CHAR(39) & SUBSTITUTE(A2,CHAR(39),CHAR(39)&CHAR(39)) & CHAR(39) & "," & CHAR(39) & SUBSTITUTE(B2,CHAR(39),CHAR(39)&CHAR(39)) & CHAR(39) & "," & CHAR(39) & C2 & CHAR(39) & "," & CHAR(39) & SUBSTITUTE(D2,CHAR(39),CHAR(39)&CHAR(39)) & CHAR(39) & "," & IF(E2="","NULL",CHAR(39) & E2 & CHAR(39)) & "," & CHAR(39) & F2 & CHAR(39) & "," & IF(G2="","NULL",CHAR(39) & G2 & CHAR(39)) & "," & IF(H2="","NULL",H2) & "," & IF(I2="","NULL",I2) & "," & J2 & "," & LOWER(K2) & "," & LOWER(M2) & "," & CHAR(39) & N2 & CHAR(39) & "),"
```

---

## Direct SQL INSERT (Based on Your Data)

Here's an INSERT query based on the data I can see. **Replace URLs and descriptions with actual values:**

```sql
INSERT INTO public.articles (
  title, url, source, description,
  milestone_code, category, focus_area,
  age_months_min, age_months_max,
  priority, is_backup, is_featured, validation_status
) VALUES
  ('Milestones by Age', 'https://www.cdc.gov/ncbddd/actearly/milestones/index.html', 'CDC', 'CDC comprehensive guide to developmental milestones by age', NULL, 'Cognitive', 'Typically Developing', 0, 60, 10, true, true, 'pending'),
  ('Early Warning Signs', 'https://www.healthychildren.org/English/ages-stages/Pages/default.aspx', 'HealthyChildren', 'AAP resource covering cognitive development milestones', NULL, 'Cognitive', 'Typically Developing', 12, 36, 9, true, false, 'pending'),
  ('Language Development in Down Syndrome', 'https://ndss.org/resources/development/', 'Other', 'National Down Syndrome Society language development resources', NULL, 'Language/Communication', 'Down Syndrome', 0, 60, 9, true, false, 'pending'),
  ('Motor Skills Development', 'https://publications.aap.org/pediatrics/article/', 'AAP', 'NIH NIDCD comprehensive guide to motor development', NULL, 'Motor', 'Typically Developing', 6, 24, 8, true, true, 'pending'),
  ('Social-Emotional Development', 'https://my.clevelandclinic.org/health/articles/', 'Other', 'Cleveland Clinic resource on social-emotional milestones', NULL, 'Social-Emotional', 'Typically Developing', 0, 36, 8, true, false, 'pending'),
  ('Positive Parenting', 'https://www.cdc.gov/ncbddd/childdevelopment/positiveparenting/index.html', 'CDC', 'CDC resource on developmental support strategies', NULL, 'Social-Emotional', 'Typically Developing', 0, 60, 7, true, true, 'pending');
```

**Note**: I've set `milestone_code` to NULL for all rows (AI-driven approach). Update URLs and descriptions with your actual values.

---

## Easiest Method: Fix CSV, Then Import via Supabase UI

1. **Fix column names in Excel** (as described above)
2. **Save as CSV**
3. **Import via Supabase Dashboard** → Table Editor → `articles` → Import CSV
4. **Map columns** (should auto-match after fixing names)

This is faster than writing INSERT queries for many rows!

