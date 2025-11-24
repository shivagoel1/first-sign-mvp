# Generate INSERT Query from CSV

## Quick Method: Excel Formula

If your CSV has the wrong column names, fix them first, then use this Excel formula to generate INSERT statements:

### Step 1: Fix Column Names in Excel

1. **Rename columns:**
   - `milestone_ccategory` → Split into `milestone_code` and `category`
   - `age_months_age_months_priority` → Split into `age_months_min`, `age_months_max`, `priority`
   - `validation_st` → `validation_status`

2. **If `milestone_ccategory` contains both values:**
   - Extract `milestone_code` (first part before category)
   - Extract `category` (second part after milestone_code)
   - Or set both to appropriate values

3. **If `age_months_age_months_priority` contains combined values:**
   - Extract `age_months_min` (first number)
   - Extract `age_months_max` (second number)
   - Extract `priority` (third number)

### Step 2: Generate INSERT Query

Add a new column in Excel with this formula (adjust column letters to match your data):

```excel
="(" & CHAR(39) & A2 & CHAR(39) & "," & CHAR(39) & B2 & CHAR(39) & "," & CHAR(39) & C2 & CHAR(39) & "," & CHAR(39) & D2 & CHAR(39) & "," & IF(E2="","NULL",CHAR(39) & E2 & CHAR(39)) & "," & CHAR(39) & F2 & CHAR(39) & "," & IF(G2="","NULL",CHAR(39) & G2 & CHAR(39)) & "," & IF(H2="","NULL",H2) & "," & IF(I2="","NULL",I2) & "," & J2 & "," & LOWER(K2) & "," & LOWER(M2) & "," & CHAR(39) & N2 & CHAR(39) & "),"
```

**Column Mapping:**
- A = title
- B = url
- C = source
- D = description
- E = milestone_code
- F = category
- G = focus_area
- H = age_months_min
- I = age_months_max
- J = priority
- K = is_backup
- M = is_featured
- N = validation_status

### Step 3: Copy and Use

1. Copy the generated values
2. Paste into the INSERT query template
3. Remove the trailing comma from the last row
4. Run in Supabase SQL Editor

---

## Alternative: Python Script (If you have many rows)

```python
import csv

# Read CSV
with open('articles.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    rows = list(reader)

# Generate INSERT
print("INSERT INTO public.articles (")
print("  title, url, source, description, milestone_code, category, focus_area,")
print("  age_months_min, age_months_max, priority, is_backup, is_featured, validation_status")
print(") VALUES")

for i, row in enumerate(rows):
    # Handle NULL values
    milestone_code = f"'{row['milestone_code']}'" if row.get('milestone_code') else 'NULL'
    focus_area = f"'{row['focus_area']}'" if row.get('focus_area') else 'NULL'
    age_min = row.get('age_months_min') or 'NULL'
    age_max = row.get('age_months_max') or 'NULL'
    
    # Escape single quotes in strings
    title = row['title'].replace("'", "''")
    url = row['url'].replace("'", "''")
    description = row['description'].replace("'", "''")
    
    print(f"  ('{title}', '{url}', '{row['source']}', '{description}', {milestone_code}, '{row['category']}', {focus_area}, {age_min}, {age_max}, {row['priority']}, {row['is_backup'].lower()}, {row['is_featured'].lower()}, '{row['validation_status']}')" + ("," if i < len(rows) - 1 else ";"))
```

---

## Direct SQL INSERT (Manual)

If you have a few rows, you can write them manually:

```sql
INSERT INTO public.articles (
  title, url, source, description,
  milestone_code, category, focus_area,
  age_months_min, age_months_max,
  priority, is_backup, is_featured, validation_status
) VALUES
  ('Title 1', 'https://url1.com', 'CDC', 'Description 1', NULL, 'Cognitive', 'Typically Developing', 0, 60, 10, true, true, 'pending'),
  ('Title 2', 'https://url2.com', 'HealthyChildren', 'Description 2', NULL, 'Language/Communication', 'Down Syndrome', 12, 36, 9, true, false, 'pending');
```

---

## Fix Your Current CSV First

Your CSV has these issues that need fixing:

1. **`milestone_ccategory`** → Split into:
   - `milestone_code` (can be NULL)
   - `category` (required)

2. **`age_months_age_months_priority`** → Split into:
   - `age_months_min` (integer or NULL)
   - `age_months_max` (integer or NULL)
   - `priority` (integer 1-10)

3. **`validation_st`** → Rename to `validation_status`

After fixing, use the INSERT query template above.

