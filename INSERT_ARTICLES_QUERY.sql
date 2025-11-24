-- INSERT query for articles table
-- Fix column name issues first, then use this template

-- Step 1: If your CSV has wrong column names, fix them:
-- - milestone_ccategory → split into milestone_code and category
-- - age_months_age_months_priority → split into age_months_min, age_months_max, priority
-- - validation_st → validation_status

-- Step 2: Use this INSERT query template
-- Replace the VALUES with your actual data

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
) VALUES
  -- Example rows (replace with your actual data):
  (
    'Milestones by Age',
    'https://www.cdc.gov/ncbddd/actearly/milestones/index.html',
    'CDC',
    'CDC comprehensive guide to developmental milestones by age',
    NULL,  -- milestone_code (can be NULL)
    'Cognitive',
    'Typically Developing',
    0,
    60,
    10,
    true,
    true,
    'pending'
  ),
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
  (
    'Motor Skills Development',
    'https://publications.aap.org/pediatrics/article/...',
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
  (
    'Social-Emotional Development',
    'https://my.clevelandclinic.org/health/articles/...',
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

-- Note: Add more rows as needed
-- For milestone_code: Use NULL if you want AI to match based on category/age/description
-- For focus_area: Use 'Typically Developing', 'Down Syndrome', 'Cerebral Palsy', or 'Autism Spectrum Disorder'
-- For age_months_min/max: Use NULL for articles that apply to all ages

