-- INSERT Articles from CSV with Column Name Fixes
-- This handles the CSV format issues and inserts directly into articles table

-- Method 1: Using a temporary table (if importing via Supabase CSV import)
-- First, import your CSV to a temporary table, then run this:

INSERT INTO public.articles (
  title,
  url,
  source,
  description,
  milestone_code,
  category,
  focus_area,
  age_months_min,
  age_months_max,
  priority,
  is_backup,
  is_featured,
  validation_status
)
SELECT 
  title,
  url,
  source,
  description,
  NULL as milestone_code,  -- Extract from milestone_ccategory if needed, or set to NULL
  -- If milestone_ccategory contains both, you might need to split it:
  -- SPLIT_PART(milestone_ccategory, '|', 1) as milestone_code,  -- Adjust separator
  -- SPLIT_PART(milestone_ccategory, '|', 2) as category,  -- Adjust separator
  category,  -- Or extract from milestone_ccategory
  focus_area,
  -- Extract from age_months_age_months_priority (assuming format: "min|max|priority")
  CAST(SPLIT_PART(age_months_age_months_priority, '|', 1) AS INTEGER) as age_months_min,
  CAST(SPLIT_PART(age_months_age_months_priority, '|', 2) AS INTEGER) as age_months_max,
  CAST(SPLIT_PART(age_months_age_months_priority, '|', 3) AS INTEGER) as priority,
  is_backup::boolean,
  is_featured::boolean,
  validation_st as validation_status  -- Rename column
FROM your_temp_table_name;  -- Replace with your temporary table name

-- Method 2: Direct INSERT with VALUES (if you fix the CSV first)
-- Fix your CSV column names, then use this template:

INSERT INTO public.articles (
  title, url, source, description,
  milestone_code, category, focus_area,
  age_months_min, age_months_max,
  priority, is_backup, is_featured, validation_status
) VALUES
  -- Row 1
  (
    'Milestones by Age',
    'https://www.cdc.gov/ncbddd/actearly/milestones/index.html',
    'CDC',
    'CDC comprehensive guide to developmental milestones by age',
    NULL,  -- milestone_code (can be NULL)
    'Cognitive',
    'Typically Developing',
    0,     -- age_months_min
    60,    -- age_months_max
    10,    -- priority
    true,  -- is_backup
    true,  -- is_featured
    'pending'  -- validation_status
  ),
  -- Row 2
  (
    'Early Warning Signs',
    'https://www.healthychildren.org/English/ages-stages/Pages/default.aspx',
    'HealthyChildren',
    'AAP resource covering cognitive development milestones',
    NULL,
    'Cognitive',
    'Typically Developing',
    12,
    36,
    9,
    true,
    false,
    'pending'
  ),
  -- Row 3
  (
    'Language Development in Down Syndrome',
    'https://ndss.org/resources/development/',
    'Other',
    'National Down Syndrome Society language development resources',
    NULL,
    'Language/Communication',
    'Down Syndrome',
    0,
    60,
    9,
    true,
    false,
    'pending'
  ),
  -- Row 4
  (
    'Motor Skills Development',
    'https://publications.aap.org/pediatrics/article/',
    'AAP',
    'NIH NIDCD comprehensive guide to motor development',
    NULL,
    'Motor',
    'Typically Developing',
    6,
    24,
    8,
    true,
    true,
    'pending'
  ),
  -- Row 5
  (
    'Social-Emotional Development',
    'https://my.clevelandclinic.org/health/articles/',
    'Other',
    'Cleveland Clinic resource on social-emotional milestones',
    NULL,
    'Social-Emotional',
    'Typically Developing',
    0,
    36,
    8,
    true,
    false,
    'pending'
  ),
  -- Row 6
  (
    'Positive Parenting',
    'https://www.cdc.gov/ncbddd/childdevelopment/positiveparenting/index.html',
    'CDC',
    'CDC resource on developmental support strategies',
    NULL,
    'Social-Emotional',
    'Typically Developing',
    0,
    60,
    7,
    true,
    true,
    'pending'
  );

-- Add more rows as needed following the same pattern

-- Method 3: Using COPY command (if you have direct file access)
-- This is the fastest method for large datasets

-- First, fix your CSV column names, then:
/*
COPY public.articles (
  title, url, source, description,
  milestone_code, category, focus_area,
  age_months_min, age_months_max,
  priority, is_backup, is_featured, validation_status
)
FROM '/path/to/your/articles.csv'
WITH (FORMAT csv, HEADER true, DELIMITER ',', NULL '');
*/

