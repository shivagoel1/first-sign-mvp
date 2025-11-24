-- Remove foreign key constraint on articles.milestone_code
-- Articles are stored generically and AI selects them based on context
-- (category, age, focus_area, description) rather than hard-coded milestone references

-- Drop the foreign key constraint entirely
-- This allows articles to be stored without requiring milestone_code to exist
ALTER TABLE public.articles 
DROP CONSTRAINT IF EXISTS articles_milestone_fkey;

-- Note: milestone_code can still be stored for reference/tracking purposes
-- but it's not enforced by foreign key constraint
-- The AI will match articles based on:
-- - category (Social-Emotional, Language/Communication, Motor, Cognitive)
-- - age_months_min / age_months_max (age range)
-- - focus_area (Typically Developing, Down Syndrome, etc.)
-- - description (semantic matching)

